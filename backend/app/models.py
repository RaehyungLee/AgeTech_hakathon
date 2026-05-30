from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SensorType(str, Enum):
    motion = "motion"
    fall = "fall"
    door = "door"
    bed = "bed"
    wearable = "wearable"
    temperature = "temperature"


class SensorStatus(str, Enum):
    online = "online"
    offline = "offline"
    low_battery = "low_battery"


class AnomalySeverity(str, Enum):
    critical = "critical"
    warning = "warning"
    info = "info"


class AnomalyType(str, Enum):
    fall = "fall"
    no_movement = "no_movement"
    wandering = "wandering"
    door_open = "door_open"
    temperature = "temperature"
    heart_rate = "heart_rate"
    bed_exit = "bed_exit"
    medication = "medication"


class Sensor(BaseModel):
    id: str
    name: str
    type: SensorType
    location: str
    battery: int = Field(ge=0, le=100)
    status: SensorStatus
    last_seen: datetime


class SensorUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class Anomaly(BaseModel):
    id: str
    sensor_id: str
    sensor_name: str
    type: AnomalyType
    severity: AnomalySeverity
    title: str
    message: str
    occurred_at: datetime
    acknowledged: bool = False


class DashboardSummary(BaseModel):
    total_sensors: int
    online_sensors: int
    low_battery_sensors: int
    active_anomalies: int
    critical_anomalies: int


class CareInsight(BaseModel):
    calm_score: int
    calm_label: str
    rest_hours: float
    rest_quality: str
    ambient_comfort: str
    temperature: float
    humidity: int
    daily_affirmation: str
    gentle_tip: str
    hydration_reminder: str
    moments_of_peace: int
