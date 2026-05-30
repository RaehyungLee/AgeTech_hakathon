"""Restroom monitoring agent.

A backend worker that reviews the resident's restroom history with the ML risk
model (`app.ml`), turns every finding into an `Anomaly` in the shared store, and
returns a human-readable `AgentReport`. Critical findings (e.g. a 2-hour visit)
flow straight into the existing `/api/anomalies` + `/api/emergency` pipeline, so
the frontend will light up with no extra plumbing.

Designed to be triggered on startup and re-runnable on demand (idempotent: the
store upserts by a stable alert id and preserves acknowledgements).
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.config import settings
from app.ml import RestroomRiskModel, load_visits
from app.models import AgentReport, Anomaly, AnomalySeverity, AnomalyType, RestroomAlert
from app.store import RESTROOM_SENSOR_ID, get_sensor, register_agent_anomalies

AGENT_NAME = "Kinu Restroom Monitor"

# kind -> (anomaly type, headline). The message comes from the ML alert itself.
_KIND_MAP: dict[str, tuple[AnomalyType, str]] = {
    "duration_red": (AnomalyType.fall, "Possible fall — prolonged restroom visit"),
    "duration_yellow": (AnomalyType.restroom, "Extended restroom visit"),
    "duration_personal": (AnomalyType.restroom, "Unusual restroom visit length"),
    "uti_frequency": (AnomalyType.medication, "Frequent restroom visits (possible UTI)"),
    "uti_frequency_24h": (AnomalyType.medication, "Frequent restroom visits (possible UTI)"),
    "frequency_personal": (AnomalyType.restroom, "Rising restroom frequency"),
    "night_fall_risk": (AnomalyType.fall, "Frequent nighttime restroom visits"),
    "inactivity": (AnomalyType.no_movement, "No restroom activity for hours"),
}

_DEFAULT_KIND = (AnomalyType.restroom, "Restroom usage anomaly")


def _level_to_severity(level: str) -> AnomalySeverity:
    return AnomalySeverity.critical if level == "red" else AnomalySeverity.warning


def _occurred_at(alert: dict) -> datetime:
    """tz-aware timestamp for an alert (so it sorts alongside the demo anomalies)."""
    raw = alert.get("ts")
    if raw:
        return datetime.fromisoformat(raw).replace(tzinfo=timezone.utc)
    # day-level alert: anchor to noon of that day
    day = datetime.fromisoformat(alert["date"])
    return day.replace(hour=12, tzinfo=timezone.utc)


def _alert_id(alert: dict, occurred_at: datetime) -> str:
    key = alert.get("visit_id") or alert.get("date") or occurred_at.date().isoformat()
    return f"rr-{alert['kind']}-{key}"


class RestroomMonitorAgent:
    def __init__(self, data_path: str | None = None):
        self.data_path = data_path or settings.restroom_data_path
        self.name = AGENT_NAME

    def scan(self) -> AgentReport:
        visits = load_visits(self.data_path)
        model = RestroomRiskModel().fit(visits)
        result = model.evaluate(visits)
        days_reviewed = len({v.ts.date() for v in visits})

        sensor = get_sensor(RESTROOM_SENSOR_ID)
        sensor_name = sensor.name if sensor else "Restroom Occupancy"

        restroom_alerts: list[RestroomAlert] = []
        anomalies: list[Anomaly] = []

        for alert in result["alerts"]:
            atype, title = _KIND_MAP.get(alert["kind"], _DEFAULT_KIND)
            occurred_at = _occurred_at(alert)
            aid = _alert_id(alert, occurred_at)
            severity = _level_to_severity(alert["level"])

            anomalies.append(Anomaly(
                id=aid,
                sensor_id=RESTROOM_SENSOR_ID,
                sensor_name=sensor_name,
                type=atype,
                severity=severity,
                title=title,
                message=alert["message"],
                occurred_at=occurred_at,
                acknowledged=False,
            ))
            restroom_alerts.append(RestroomAlert(
                id=aid,
                level=alert["level"],
                kind=alert["kind"],
                title=title,
                message=alert["message"],
                value=float(alert["value"]),
                source=alert["source"],
                occurred_at=occurred_at,
                anomaly_id=aid,
            ))

        register_agent_anomalies(anomalies)

        restroom_alerts.sort(key=lambda a: a.occurred_at, reverse=True)
        emergency = result["overall_level"] == "red"
        return AgentReport(
            agent=self.name,
            generated_at=datetime.now(timezone.utc),
            visits_reviewed=len(visits),
            days_reviewed=days_reviewed,
            baseline=model.baseline_summary(),
            overall_level=result["overall_level"],
            emergency=emergency,
            summary=self._summarize(len(visits), days_reviewed, restroom_alerts, emergency),
            alerts=restroom_alerts,
        )

    @staticmethod
    def _summarize(
        visits: int, days: int, alerts: list[RestroomAlert], emergency: bool
    ) -> str:
        reds = sum(1 for a in alerts if a.level == "red")
        yellows = len(alerts) - reds
        head = f"Reviewed {visits} restroom visits across {days} days. "
        if not alerts:
            return head + "All readings within this resident's learned baseline."
        body = f"Flagged {reds} critical and {yellows} watch-level finding(s). "
        if emergency:
            top = max(alerts, key=lambda a: (a.level == "red", a.occurred_at))
            body += f"EMERGENCY ESCALATION: {top.title} — {top.message}"
        return head + body


# Module-level singleton + convenience runner used by the API.
agent = RestroomMonitorAgent()


def run_agent_scan() -> AgentReport:
    return agent.scan()
