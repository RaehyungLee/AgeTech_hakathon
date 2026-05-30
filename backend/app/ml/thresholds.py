"""Clinical trigger points for restroom-usage monitoring.

These are *population-level* safety limits sourced from the care guidelines.
The ML model (model.py) learns a *personalized* baseline on top of these so it
can warn earlier than the population thresholds for a given resident.

All values are easy to tune in one place.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ClinicalThresholds:
    # --- Duration inside the restroom (single visit), minutes ---
    duration_baseline_min: float = 8.0
    duration_yellow_min: float = 20.0   # soft warning -> automated check-in
    duration_red_min: float = 35.0      # critical -> emergency physical check

    # --- Frequency over a rolling 24h window (visit count) ---
    freq_baseline_low: int = 4
    freq_baseline_high: int = 8
    freq_uti_min: int = 12              # UTI / medication side-effect spike

    # --- Inactivity during waking hours ---
    waking_start_hour: int = 6          # 06:00
    waking_end_hour: int = 22           # 22:00 (also the night-window boundary)
    inactivity_gap_hours: float = 12.0  # zero visits across 12h waking -> alert

    # --- Nighttime window (10:00 PM -> 6:00 AM) ---
    night_baseline_max: int = 2
    night_fall_risk_min: int = 4        # nocturia / fall-risk spike

    def is_night_hour(self, hour: int) -> bool:
        """22:00..05:59 counts as night."""
        return hour >= self.waking_end_hour or hour < self.waking_start_hour


CLINICAL = ClinicalThresholds()
