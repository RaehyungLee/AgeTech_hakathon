from datetime import datetime, timedelta, timezone

from app.models import (
    Anomaly,
    AnomalySeverity,
    AnomalyType,
    DashboardSummary,
    Sensor,
    SensorStatus,
    SensorType,
)

DEFAULT_RESIDENT_ID = "u1"

SENSORS: dict[str, Sensor] = {}
ANOMALIES: dict[str, Anomaly] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _seed() -> None:
    if SENSORS:
        return

    now = _now()
    sensors = [
        Sensor(
            id="s1",
            name="Living Room Motion",
            type=SensorType.motion,
            location="Living Room",
            battery=87,
            status=SensorStatus.online,
            last_seen=now - timedelta(minutes=2),
        ),
        Sensor(
            id="s2",
            name="Bedroom Fall Detector",
            type=SensorType.fall,
            location="Master Bedroom",
            battery=62,
            status=SensorStatus.online,
            last_seen=now - timedelta(minutes=1),
        ),
        Sensor(
            id="s3",
            name="Front Door Sensor",
            type=SensorType.door,
            location="Entryway",
            battery=23,
            status=SensorStatus.low_battery,
            last_seen=now - timedelta(minutes=5),
        ),
        Sensor(
            id="s4",
            name="Bed Pressure Mat",
            type=SensorType.bed,
            location="Master Bedroom",
            battery=91,
            status=SensorStatus.online,
            last_seen=now - timedelta(seconds=30),
        ),
        Sensor(
            id="s5",
            name="Wrist Wearable",
            type=SensorType.wearable,
            location="On Resident",
            battery=45,
            status=SensorStatus.online,
            last_seen=now - timedelta(minutes=3),
        ),
        Sensor(
            id="s6",
            name="Kitchen Temperature",
            type=SensorType.temperature,
            location="Kitchen",
            battery=78,
            status=SensorStatus.online,
            last_seen=now - timedelta(minutes=8),
        ),
    ]

    for sensor in sensors:
        SENSORS[sensor.id] = sensor

    anomalies = [
        Anomaly(
            id="a1",
            sensor_id="s2",
            sensor_name=sensors[1].name,
            type=AnomalyType.fall,
            severity=AnomalySeverity.critical,
            title="Possible fall detected",
            message="Sudden impact and no movement for 45 minuates in the bedroom.",
            occurred_at=now - timedelta(minutes=12),
            acknowledged=False,
        ),
        Anomaly(
            id="a2",
            sensor_id="s1",
            sensor_name=sensors[0].name,
            type=AnomalyType.no_movement,
            severity=AnomalySeverity.warning,
            title="Extended inactivity",
            message="No motion detected in the living room for over 3 hours.",
            occurred_at=now - timedelta(hours=1, minutes=20),
            acknowledged=False,
        ),
        Anomaly(
            id="a3",
            sensor_id="s3",
            sensor_name=sensors[2].name,
            type=AnomalyType.door_open,
            severity=AnomalySeverity.warning,
            title="Door open at night",
            message="Front door has been open since 2:14 AM.",
            occurred_at=now - timedelta(hours=2),
            acknowledged=False,
        ),
        Anomaly(
            id="a4",
            sensor_id="s5",
            sensor_name=sensors[4].name,
            type=AnomalyType.heart_rate,
            severity=AnomalySeverity.critical,
            title="Elevated heart rate",
            message="Heart rate reached 118 bpm — above the configured threshold.",
            occurred_at=now - timedelta(minutes=35),
            acknowledged=True,
        ),
        Anomaly(
            id="a5",
            sensor_id="s4",
            sensor_name=sensors[3].name,
            type=AnomalyType.bed_exit,
            severity=AnomalySeverity.info,
            title="Left bed during night",
            message="Resident exited bed at 3:42 AM. Motion resumed in hallway.",
            occurred_at=now - timedelta(hours=4),
            acknowledged=True,
        ),
        Anomaly(
            id="a6",
            sensor_id="s5",
            sensor_name=sensors[4].name,
            type=AnomalyType.wandering,
            severity=AnomalySeverity.warning,
            title="Unusual movement pattern",
            message="Repeated pacing detected near the entryway over 20 minutes.",
            occurred_at=now - timedelta(minutes=55),
            acknowledged=False,
        ),
    ]

    for anomaly in anomalies:
        ANOMALIES[anomaly.id] = anomaly


def get_sensors() -> list[Sensor]:
    _seed()
    return sorted(SENSORS.values(), key=lambda s: s.name.lower())


def get_sensor(sensor_id: str) -> Sensor | None:
    _seed()
    return SENSORS.get(sensor_id)


def update_sensor_name(sensor_id: str, name: str) -> Sensor | None:
    _seed()
    sensor = SENSORS.get(sensor_id)
    if not sensor:
        return None

    updated = sensor.model_copy(update={"name": name.strip()})
    SENSORS[sensor_id] = updated

    for anomaly_id, anomaly in ANOMALIES.items():
        if anomaly.sensor_id == sensor_id:
            ANOMALIES[anomaly_id] = anomaly.model_copy(update={"sensor_name": name.strip()})

    return updated


def get_anomaly(anomaly_id: str) -> Anomaly | None:
    _seed()
    return ANOMALIES.get(anomaly_id)


def get_anomalies() -> list[Anomaly]:
    _seed()
    return sorted(ANOMALIES.values(), key=lambda a: a.occurred_at, reverse=True)


def acknowledge_anomaly(anomaly_id: str) -> Anomaly | None:
    _seed()
    anomaly = ANOMALIES.get(anomaly_id)
    if not anomaly:
        return None

    updated = anomaly.model_copy(update={"acknowledged": True})
    ANOMALIES[anomaly_id] = updated
    return updated


def get_summary() -> DashboardSummary:
    _seed()
    sensors = list(SENSORS.values())
    anomalies = [a for a in ANOMALIES.values() if not a.acknowledged]

    return DashboardSummary(
        total_sensors=len(sensors),
        online_sensors=sum(1 for s in sensors if s.status == SensorStatus.online),
        low_battery_sensors=sum(
            1 for s in sensors if s.status == SensorStatus.low_battery or s.battery <= 25
        ),
        active_anomalies=len(anomalies),
        critical_anomalies=sum(1 for a in anomalies if a.severity == AnomalySeverity.critical),
    )
