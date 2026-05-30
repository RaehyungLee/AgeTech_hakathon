"""Personalized restroom-usage risk model.

What makes this *learned* rather than a static rule sheet:

  1. fit() learns this resident's personal baseline from their own history --
     robust location/spread (median + MAD) of visit duration per time-of-day,
     and the empirical distribution of daily / nightly visit frequency.

  2. score_visit() / score_day() combine two signals:
       (a) CLINICAL hard rules  -- the population safety limits (thresholds.py)
       (b) PERSONAL anomaly      -- a robust modified z-score vs. the learned
           baseline, so we can warn *before* the population limit for a resident
           whose normal is much tighter (e.g. an 8-min baseline making a 15-min
           visit clearly abnormal even though it's under the 20-min clinical line).

  3. update() does online learning: it nudges the baseline with EWMA using only
     *non-anomalous* observations, so the model adapts to slow real change
     (aging, season) without being dragged around by acute incidents.

The anomaly core is a robust statistical detector (median/MAD). It is a drop-in
seam: swap `_RobustScorer` for an sklearn IsolationForest once that package is
installable in the environment -- the public API here does not change.

Pure stdlib. JSON-serializable so a fitted model can be saved/loaded by the API.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, asdict
from statistics import median
from typing import Iterable

from .thresholds import ClinicalThresholds, CLINICAL
from .features import Visit, DayFeatures, aggregate_days, rolling_24h_counts

# 0.6745 maps MAD onto the std of a normal distribution; |z|>3.5 is the
# classic Iglewicz-Hoaglin outlier cut-off.
_MAD_SCALE = 0.6745
_DEFAULT_Z = 3.5


def _mad(values: list[float], center: float) -> float:
    """Median absolute deviation with graceful fallbacks so the z-score is
    never divided by zero on tightly-clustered or tiny samples."""
    if not values:
        return 1.0
    devs = [abs(v - center) for v in values]
    m = median(devs)
    if m > 0:
        return m
    mean_dev = sum(devs) / len(devs)          # mean abs deviation
    return mean_dev if mean_dev > 0 else 1.0


def _modified_z(x: float, center: float, mad: float) -> float:
    return _MAD_SCALE * (x - center) / mad


@dataclass
class _RobustScorer:
    """Learned location/spread for one feature, with an online EWMA update."""

    center: float
    mad: float
    n: int

    @classmethod
    def fit(cls, values: list[float]) -> "_RobustScorer":
        c = median(values) if values else 0.0
        return cls(center=c, mad=_mad(values, c), n=len(values))

    def z(self, x: float) -> float:
        return _modified_z(x, self.center, self.mad)

    def update(self, x: float, alpha: float = 0.02) -> None:
        # EWMA toward the new (assumed-normal) observation.
        self.center = (1 - alpha) * self.center + alpha * x
        self.mad = (1 - alpha) * self.mad + alpha * abs(x - self.center)
        self.mad = max(self.mad, 1e-6)
        self.n += 1


# ---- Alert vocabulary -------------------------------------------------------

LEVELS = {"none": 0, "yellow": 1, "red": 2}


@dataclass
class Alert:
    level: str           # "yellow" | "red"
    kind: str            # machine code, e.g. "duration_red", "uti_frequency"
    message: str         # human-readable
    value: float         # the observed value that triggered it
    source: str          # "clinical" | "personal"

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------


class RestroomRiskModel:
    def __init__(
        self,
        thresholds: ClinicalThresholds = CLINICAL,
        z_threshold: float = _DEFAULT_Z,
    ):
        self.th = thresholds
        self.z_threshold = z_threshold
        # learned parameters (populated by fit)
        self.duration_overall: _RobustScorer | None = None
        self.duration_by_tod: dict[str, _RobustScorer] = {}
        self.daily_count: _RobustScorer | None = None
        self.night_count: _RobustScorer | None = None
        self.fitted = False

    # -- training ----------------------------------------------------------

    def fit(self, visits: list[Visit]) -> "RestroomRiskModel":
        durations = [v.duration for v in visits]
        self.duration_overall = _RobustScorer.fit(durations)

        by_tod: dict[str, list[float]] = {}
        for v in visits:
            by_tod.setdefault(v.time_of_day, []).append(v.duration)
        self.duration_by_tod = {
            tod: _RobustScorer.fit(vals) for tod, vals in by_tod.items() if vals
        }

        days = aggregate_days(visits, self.th)
        self.daily_count = _RobustScorer.fit([float(d.visit_count) for d in days])
        self.night_count = _RobustScorer.fit([float(d.night_count) for d in days])
        self.fitted = True
        return self

    def _require_fit(self) -> None:
        if not self.fitted:
            raise RuntimeError("Model is not fitted. Call fit(visits) first.")

    # -- scoring -----------------------------------------------------------

    def score_visit(self, visit: Visit) -> list[Alert]:
        """Duration-based alerts for a single visit (clinical + personal)."""
        self._require_fit()
        d = visit.duration
        alerts: list[Alert] = []

        if d >= self.th.duration_red_min:
            alerts.append(Alert(
                "red", "duration_red",
                f"Critical: {d:.0f} min inside (>= {self.th.duration_red_min:.0f}). "
                "Dispatch a physical check for a possible fall or medical event.",
                d, "clinical"))
            return alerts
        if d >= self.th.duration_yellow_min:
            alerts.append(Alert(
                "yellow", "duration_yellow",
                f"Extended visit: {d:.0f} min (>= {self.th.duration_yellow_min:.0f}). "
                "Trigger an automated check-in.",
                d, "clinical"))
            return alerts

        # Personalized early warning: abnormal *for this resident*.
        scorer = self.duration_by_tod.get(visit.time_of_day, self.duration_overall)
        z = scorer.z(d)
        if z >= self.z_threshold:
            alerts.append(Alert(
                "yellow", "duration_personal",
                f"Unusual visit length {d:.1f} min for {visit.time_of_day or 'this time'} "
                f"(baseline ~{scorer.center:.1f} min, z={z:.1f}). Early watch.",
                d, "personal"))
        return alerts

    def score_day(self, day: DayFeatures) -> list[Alert]:
        """Frequency / night / inactivity alerts for one day."""
        self._require_fit()
        alerts: list[Alert] = []

        # Frequency spike -> UTI / medication side-effect.
        if day.visit_count >= self.th.freq_uti_min:
            alerts.append(Alert(
                "red", "uti_frequency",
                f"{day.visit_count} visits in a day (>= {self.th.freq_uti_min}). "
                "Possible UTI or medication side-effect -- escalate.",
                day.visit_count, "clinical"))
        elif self.daily_count and self.daily_count.z(day.visit_count) >= self.z_threshold:
            alerts.append(Alert(
                "yellow", "frequency_personal",
                f"{day.visit_count} visits is high vs. baseline "
                f"~{self.daily_count.center:.0f}/day. Watch for a developing spike.",
                day.visit_count, "personal"))

        # Nighttime spike -> nocturia / fall risk.
        if day.night_count >= self.th.night_fall_risk_min:
            alerts.append(Alert(
                "red", "night_fall_risk",
                f"{day.night_count} night visits (>= {self.th.night_fall_risk_min}). "
                "Nocturia / elevated nighttime fall risk.",
                day.night_count, "clinical"))

        # Inactivity -> dehydration or an unwitnessed fall elsewhere.
        if day.longest_waking_gap_h >= self.th.inactivity_gap_hours:
            alerts.append(Alert(
                "red", "inactivity",
                f"No restroom visit for {day.longest_waking_gap_h:.1f}h of waking hours "
                f"(>= {self.th.inactivity_gap_hours:.0f}h). Check for dehydration or a fall.",
                day.longest_waking_gap_h, "clinical"))
        return alerts

    def evaluate(self, visits: list[Visit]) -> dict:
        """Run the full pipeline over a span of visits and summarize."""
        self._require_fit()
        visit_alerts: list[dict] = []
        for v in visits:
            for a in self.score_visit(v):
                visit_alerts.append({"visit_id": v.visit_id, "ts": v.ts.isoformat(),
                                     **a.to_dict()})

        day_alerts: list[dict] = []
        for d in aggregate_days(visits, self.th):
            for a in self.score_day(d):
                day_alerts.append({"date": d.date, **a.to_dict()})

        # cross-midnight UTI spike via rolling 24h window -- keep one peak per
        # date so a sustained cluster doesn't emit a duplicate alert per visit.
        peak_24h: dict[str, int] = {}
        for v, c in rolling_24h_counts(visits):
            if c >= self.th.freq_uti_min:
                d = v.ts.date().isoformat()
                peak_24h[d] = max(peak_24h.get(d, 0), c)
        for d, c in sorted(peak_24h.items()):
            day_alerts.append({"date": d, "level": "red", "kind": "uti_frequency_24h",
                               "message": f"{c} visits in a rolling 24h window "
                                          f"(>= {self.th.freq_uti_min}).",
                               "value": c, "source": "clinical"})

        all_alerts = visit_alerts + day_alerts
        level = "none"
        if any(a["level"] == "red" for a in all_alerts):
            level = "red"
        elif any(a["level"] == "yellow" for a in all_alerts):
            level = "yellow"
        return {
            "overall_level": level,
            "visit_alert_count": len(visit_alerts),
            "day_alert_count": len(day_alerts),
            "alerts": all_alerts,
        }

    # -- online learning ---------------------------------------------------

    def update(self, visits: Iterable[Visit]) -> None:
        """Adapt baselines from new, non-anomalous visits (EWMA)."""
        self._require_fit()
        for v in visits:
            if self.score_visit(v):
                continue  # don't learn from anomalies
            self.duration_overall.update(v.duration)
            if v.time_of_day in self.duration_by_tod:
                self.duration_by_tod[v.time_of_day].update(v.duration)

    # -- persistence -------------------------------------------------------

    def to_json(self) -> str:
        return json.dumps({
            "z_threshold": self.z_threshold,
            "duration_overall": asdict(self.duration_overall),
            "duration_by_tod": {k: asdict(v) for k, v in self.duration_by_tod.items()},
            "daily_count": asdict(self.daily_count),
            "night_count": asdict(self.night_count),
        }, indent=2)

    @classmethod
    def from_json(cls, blob: str, thresholds: ClinicalThresholds = CLINICAL) -> "RestroomRiskModel":
        d = json.loads(blob)
        m = cls(thresholds=thresholds, z_threshold=d["z_threshold"])
        m.duration_overall = _RobustScorer(**d["duration_overall"])
        m.duration_by_tod = {k: _RobustScorer(**v) for k, v in d["duration_by_tod"].items()}
        m.daily_count = _RobustScorer(**d["daily_count"])
        m.night_count = _RobustScorer(**d["night_count"])
        m.fitted = True
        return m

    def baseline_summary(self) -> dict:
        self._require_fit()
        return {
            "visit_duration_min": round(self.duration_overall.center, 1),
            "visit_duration_mad": round(self.duration_overall.mad, 2),
            "visits_per_day": round(self.daily_count.center, 1),
            "night_visits_per_day": round(self.night_count.center, 1),
            "samples": self.duration_overall.n,
            "per_time_of_day_min": {
                k: round(v.center, 1) for k, v in self.duration_by_tod.items()
            },
        }
