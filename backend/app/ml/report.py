"""Train the model on the resident's history and print a readable report.

Run:
    python3 -m backend.app.ml.report                     # uses default CSV
    python3 -m backend.app.ml.report path/to/visits.csv

Because the supplied 1000-visit history is entirely healthy baseline, the
report ends with synthetic incident scenarios so you can see every alert type
actually fire on the *learned* model.
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta
from pathlib import Path

from .features import Visit, load_visits, aggregate_days
from .model import RestroomRiskModel

DEFAULT_CSV = (
    Path(__file__).resolve().parents[3] / "single_patient_detailed_1000_visits.csv"
)

BAR = "=" * 68


def _v(ts: datetime, dur: float, tod: str = "Afternoon") -> Visit:
    return Visit(visit_id="SYN", ts=ts, duration=dur, time_of_day=tod)


def main(argv: list[str]) -> int:
    csv_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_CSV
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}", file=sys.stderr)
        return 1

    visits = load_visits(str(csv_path))
    model = RestroomRiskModel().fit(visits)

    print(BAR)
    print("LEARNED PERSONAL BASELINE")
    print(BAR)
    bs = model.baseline_summary()
    print(f"  trained on            : {bs['samples']} visits "
          f"({len(aggregate_days(visits))} days)")
    print(f"  visit duration        : ~{bs['visit_duration_min']} min "
          f"(spread/MAD {bs['visit_duration_mad']})")
    print(f"  visits / day          : ~{bs['visits_per_day']}")
    print(f"  night visits / day    : ~{bs['night_visits_per_day']}")
    print(f"  duration by time-of-day: {bs['per_time_of_day_min']}")

    print("\n" + BAR)
    print("HISTORY SCAN (duration/frequency/night are healthy; inactivity catches")
    print("a few genuinely sparse daytime-silence days worth a caregiver review)")
    print(BAR)
    result = model.evaluate(visits)
    print(f"  overall level : {result['overall_level'].upper()}")
    print(f"  visit alerts  : {result['visit_alert_count']}")
    print(f"  day alerts    : {result['day_alert_count']}")
    for a in result["alerts"][:8]:
        when = a.get("date") or a.get("ts", "")
        print(f"    - {when}  [{a['level'].upper()}] {a['kind']}: {a['message']}")

    print("\n" + BAR)
    print("SYNTHETIC INCIDENT SCENARIOS (prove the learned model fires)")
    print(BAR)
    base = datetime(2026, 6, 1, 14, 0, 0)

    def show(title: str, alerts):
        tag = "no alert"
        if alerts:
            tag = " | ".join(f"[{a.level.upper()}] {a.message}" for a in alerts)
        print(f"\n• {title}\n    {tag}")

    # Duration scenarios (single visit)
    show("Visit lasting 15 min (UNDER 20-min clinical line, but 2x personal baseline)",
         model.score_visit(_v(base, 15.0, "Afternoon")))
    show("Visit lasting 25 min (clinical YELLOW)",
         model.score_visit(_v(base, 25.0, "Afternoon")))
    show("Visit lasting 40 min (clinical RED)",
         model.score_visit(_v(base, 40.0, "Afternoon")))

    # Frequency scenario: 13 visits across one day
    day0 = datetime(2026, 6, 2, 6, 0, 0)
    spike = [_v(day0 + timedelta(hours=i), 7.0) for i in range(13)]
    day = aggregate_days(spike)[0]
    show("13 visits in one day (UTI / medication spike)", model.score_day(day))

    # Nighttime scenario: a normal day PLUS 4 visits across one night
    # (22:30, 23:30, then 00:30 & 01:30 after midnight -> one night session).
    night = [
        _v(datetime(2026, 6, 3, 8, 0, 0), 7.0, "Morning"),
        _v(datetime(2026, 6, 3, 13, 0, 0), 7.0, "Afternoon"),
        _v(datetime(2026, 6, 3, 18, 0, 0), 7.0, "Evening"),
        _v(datetime(2026, 6, 3, 22, 30, 0), 6.0, "Night"),
        _v(datetime(2026, 6, 3, 23, 30, 0), 6.0, "Night"),
        _v(datetime(2026, 6, 4, 0, 30, 0), 6.0, "Night"),
        _v(datetime(2026, 6, 4, 1, 30, 0), 6.0, "Night"),
    ]
    show("4 visits in one night incl. after-midnight (nocturia / fall risk)",
         model.score_day(aggregate_days(night)[0]))

    # Inactivity scenario: one visit at 06:30, next at 21:00 -> >12h waking gap
    inact = [_v(datetime(2026, 6, 4, 6, 30, 0), 7.0, "Morning"),
             _v(datetime(2026, 6, 4, 21, 0, 0), 7.0, "Evening")]
    show("Only 2 visits, 14.5h apart in waking hours (inactivity / fall / dehydration)",
         model.score_day(aggregate_days(inact)[0]))

    print("\n" + BAR)
    print("Model is JSON-serializable (model.to_json()) for the API to load.")
    print(BAR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
