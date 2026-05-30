from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

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


@app.get("/api/sensors")
def list_sensors() -> dict[str, list]:
    """Placeholder — replace with real sensor data source."""
    return {"sensors": []}


@app.get("/api/alarms")
def list_alarms() -> dict[str, list]:
    """Placeholder — replace with real alarm feed."""
    return {"alarms": []}
