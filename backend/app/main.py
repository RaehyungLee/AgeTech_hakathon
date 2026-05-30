from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.care import get_care_insight
from app.config import settings
from app.models import Anomaly, CareInsight, DashboardSummary, Sensor, SensorUpdate
from app.store import (
    acknowledge_anomaly,
    get_anomalies,
    get_sensor,
    get_sensors,
    get_summary,
    update_sensor_name,
)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/summary", response_model=DashboardSummary)
def summary() -> DashboardSummary:
    return get_summary()


@app.get("/api/sensors", response_model=list[Sensor])
def list_sensors() -> list[Sensor]:
    return get_sensors()


@app.patch("/api/sensors/{sensor_id}", response_model=Sensor)
def rename_sensor(sensor_id: str, payload: SensorUpdate) -> Sensor:
    sensor = update_sensor_name(sensor_id, payload.name)
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@app.get("/api/sensors/{sensor_id}", response_model=Sensor)
def read_sensor(sensor_id: str) -> Sensor:
    sensor = get_sensor(sensor_id)
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@app.get("/api/anomalies", response_model=list[Anomaly])
def list_anomalies() -> list[Anomaly]:
    return get_anomalies()


@app.get("/api/alarms", response_model=list[Anomaly])
def list_alarms() -> list[Anomaly]:
    return get_anomalies()


@app.get("/api/care", response_model=CareInsight)
def care_insight() -> CareInsight:
    return get_care_insight()


@app.patch("/api/anomalies/{anomaly_id}/acknowledge", response_model=Anomaly)
def ack_anomaly(anomaly_id: str) -> Anomaly:
    anomaly = acknowledge_anomaly(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return anomaly
