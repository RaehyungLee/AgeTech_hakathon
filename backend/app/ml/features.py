"""Feature engineering for restroom-usage visits.

Turns the raw CSV rows (one row per restroom visit) into:
  * Visit  -- a single normalized visit
  * DayFeatures -- per-calendar-day aggregates used by the frequency / night /
    inactivity detectors.

Pure stdlib so it runs anywhere the backend runs.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Iterable

from .thresholds import ClinicalThresholds, CLINICAL

TIMESTAMP_FMT = "%Y-%m-%d %H:%M:%S"


@dataclass
class Visit:
    visit_id: str
    ts: datetime
    duration: float
    time_of_day: str
    age: int | None = None
    mobility_aid: str | None = None
    assistance: bool = False

    @property
    def hour(self) -> int:
        return self.ts.hour

    def is_night(self, th: ClinicalThresholds = CLINICAL) -> bool:
        return th.is_night_hour(self.hour)


@dataclass
class DayFeatures:
    date: str
    visit_count: int
    night_count: int
    max_duration: float
    mean_duration: float
    # Largest stretch (hours) with no visit *inside the waking window*.
    longest_waking_gap_h: float
    visits: list[Visit] = field(default_factory=list)


def _parse_bool(v: str) -> bool:
    return str(v).strip().lower() in {"true", "1", "yes", "y"}


def parse_visit(row: dict) -> Visit:
    """Parse one CSV row. Tolerant of the two schemas seen in this project
    (Record_ID/no-timestamp and Visit_ID/Timestamp)."""
    vid = row.get("Visit_ID") or row.get("Record_ID") or ""
    raw_ts = row.get("Timestamp")
    ts = datetime.strptime(raw_ts, TIMESTAMP_FMT) if raw_ts else None
    return Visit(
        visit_id=vid,
        ts=ts,
        duration=float(row["Duration_Minutes"]),
        time_of_day=(row.get("Time_of_Day") or "").strip(),
        age=int(row["Age"]) if row.get("Age") else None,
        mobility_aid=(row.get("Mobility_Aid") or None),
        assistance=_parse_bool(row.get("Assistance_Required", "")),
    )


def load_visits(csv_path: str) -> list[Visit]:
    with open(csv_path, newline="") as fh:
        visits = [parse_visit(r) for r in csv.DictReader(fh)]
    visits = [v for v in visits if v.ts is not None]
    visits.sort(key=lambda v: v.ts)
    return visits


def longest_waking_gap_hours(
    day_visits: list[Visit], th: ClinicalThresholds = CLINICAL
) -> float:
    """Largest no-visit stretch (hours) within the waking window [06:00, 22:00).

    Considers the edges of the window too: e.g. if the first visit of the day is
    at 20:00, the morning had a long inactive stretch.
    """
    if not day_visits:
        return float(th.waking_end_hour - th.waking_start_hour)

    day = day_visits[0].ts.date()
    start = datetime(day.year, day.month, day.day, th.waking_start_hour)
    end = datetime(day.year, day.month, day.day, th.waking_end_hour)

    waking = sorted(v.ts for v in day_visits if start <= v.ts < end)
    if not waking:
        return (end - start).total_seconds() / 3600.0

    markers = [start, *waking, end]
    gap = max(
        (b - a).total_seconds() / 3600.0 for a, b in zip(markers, markers[1:])
    )
    return gap


def night_session_date(v: Visit, th: ClinicalThresholds = CLINICAL) -> str:
    """The calendar date that *owns* a night visit.

    A night runs 22:00 -> 06:00 and straddles two calendar dates. We attribute
    it to the evening it began on, so an after-midnight visit (00:00-05:59)
    counts toward the previous day's night. This keeps nocturia detection from
    splitting a single night in half at midnight.
    """
    d = v.ts.date()
    if v.hour < th.waking_start_hour:
        d = d - timedelta(days=1)
    return d.isoformat()


def aggregate_days(
    visits: Iterable[Visit], th: ClinicalThresholds = CLINICAL
) -> list[DayFeatures]:
    visits = list(visits)

    # Night visits are bucketed by the night-session they belong to, not the
    # raw calendar date, so a night straddling midnight is counted as one night.
    night_by_session: dict[str, int] = defaultdict(int)
    for v in visits:
        if v.is_night(th):
            night_by_session[night_session_date(v, th)] += 1

    by_day: dict[str, list[Visit]] = defaultdict(list)
    for v in visits:
        by_day[v.ts.date().isoformat()].append(v)

    days: list[DayFeatures] = []
    for date in sorted(by_day):
        dv = sorted(by_day[date], key=lambda v: v.ts)
        durs = [v.duration for v in dv]
        days.append(
            DayFeatures(
                date=date,
                visit_count=len(dv),
                night_count=night_by_session.get(date, 0),
                max_duration=max(durs),
                mean_duration=sum(durs) / len(durs),
                longest_waking_gap_h=longest_waking_gap_hours(dv, th),
                visits=dv,
            )
        )
    return days


def rolling_24h_counts(visits: list[Visit]) -> list[tuple[Visit, int]]:
    """For each visit, the number of visits in the preceding 24h window
    (inclusive). Catches a UTI spike that straddles a calendar-day boundary,
    which a pure per-day count would miss."""
    out: list[tuple[Visit, int]] = []
    window: list[Visit] = []
    for v in visits:
        window.append(v)
        cutoff = v.ts - timedelta(hours=24)
        window = [w for w in window if w.ts >= cutoff]
        out.append((v, len(window)))
    return out
