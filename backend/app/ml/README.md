# Restroom-usage risk model

Personalized, online anomaly detection for elder-care restroom monitoring,
layered on the clinical safety thresholds.

## Run the demo

```bash
python3 -m backend.app.ml.report          # uses single_patient_detailed_1000_visits.csv
python3 -m backend.app.ml.report some.csv
```

## How it works

| Layer | What it does |
|-------|--------------|
| **Clinical rules** (`thresholds.py`) | The population safety limits you specified: duration 20m/35m, 12+ visits/24h, 4+ night visits, 12h+ waking inactivity. Hard, always-on. |
| **Personal baseline** (`model.fit`) | Learns *this* resident from their own history — robust median + MAD of duration per time-of-day, and the daily/night frequency distribution. |
| **Anomaly score** | Modified z-score vs. the learned baseline (Iglewicz–Hoaglin, \|z\|>3.5). Warns *before* the population line when normal is tight (e.g. flags a 15-min visit for an 8-min-baseline resident). |
| **Online learning** (`model.update`) | EWMA nudges the baseline using only non-anomalous visits, so it adapts to slow real change without chasing acute incidents. |

The anomaly core (`_RobustScorer`) is a drop-in seam: swap for an sklearn
`IsolationForest` once that package is installable here — the public API is
unchanged. (pip is currently broken on this machine's Homebrew Python, so the
model is pure stdlib and runs anywhere the FastAPI backend runs.)

## Alert types produced

`duration_yellow` / `duration_red` / `duration_personal` ·
`uti_frequency` (+ rolling-24h variant) / `frequency_personal` ·
`night_fall_risk` · `inactivity`

Each `Alert` has `level` (yellow|red), `kind`, `message`, `value`, `source`
(clinical|personal) and is JSON-serializable.

## Use from code

```python
from backend.app.ml import load_visits, RestroomRiskModel

visits = load_visits("single_patient_detailed_1000_visits.csv")
model = RestroomRiskModel().fit(visits)
report = model.evaluate(visits)          # {overall_level, alerts: [...]}
blob = model.to_json()                    # persist; RestroomRiskModel.from_json(blob)
```
