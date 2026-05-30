from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.auth import (
    USERS,
    can_view_resident,
    emergency_for_country,
    get_emergency_contacts,
    get_resident_profile,
    get_watched_residents,
    log_emergency_call,
    login,
    register_user,
    require_user,
)
from app.care import get_care_insight
from app.config import settings
from app.models import (
    Anomaly,
    CareInsight,
    DashboardSummary,
    EmergencyContact,
    EmergencyInfo,
    LoginRequest,
    LoginResponse,
    MeResponse,
    Sensor,
    SensorUpdate,
    SignupRequest,
    User,
    UserRole,
)
from app.privacy import (
    caregiver_privacy_mode,
    filter_anomalies_for_user,
    filter_sensors_for_user,
    summary_for_user,
    care_for_user,
    watched_residents_for_user,
)
from app.store import (
    DEFAULT_RESIDENT_ID,
    acknowledge_anomaly,
    get_anomalies,
    get_anomaly,
    get_sensor,
    get_sensors,
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


@app.post("/api/auth/login", response_model=LoginResponse)
def auth_login(payload: LoginRequest) -> LoginResponse:
    token, user = login(payload.email, payload.password)
    return LoginResponse(token=token, user=user)


@app.post("/api/auth/signup", response_model=LoginResponse)
def auth_signup(payload: SignupRequest) -> LoginResponse:
    token, user = register_user(
        payload.name,
        payload.email,
        payload.password,
        payload.role,
        payload.relation,
    )
    return LoginResponse(token=token, user=user)


@app.get("/api/auth/me", response_model=MeResponse)
def auth_me(user: User = Depends(require_user)) -> MeResponse:
    watched = (
        watched_residents_for_user(user, get_watched_residents(user))
        if user.role == UserRole.caregiver
        else []
    )
    return MeResponse(
        user=user,
        watched_residents=watched,
        privacy_mode=caregiver_privacy_mode(user),
    )


@app.get("/api/emergency/contacts", response_model=list[EmergencyContact])
def emergency_contacts(user: User = Depends(require_user)) -> list[EmergencyContact]:
    return get_emergency_contacts()


@app.get("/api/emergency/{anomaly_id}", response_model=EmergencyInfo)
def emergency_info(anomaly_id: str, user: User = Depends(require_user)) -> EmergencyInfo:
    if user.role != UserRole.caregiver:
        raise HTTPException(status_code=403, detail="Only shared caregivers can place emergency calls")

    anomaly = get_anomaly(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Alert not found")
    if anomaly.severity.value != "critical":
        raise HTTPException(status_code=400, detail="Emergency call is only for critical alerts")
    if anomaly.acknowledged:
        raise HTTPException(status_code=403, detail="Critical alert already handled")

    resident_id = DEFAULT_RESIDENT_ID
    if not can_view_resident(user, resident_id):
        raise HTTPException(status_code=403, detail="You are not authorized for this resident")

    profile = get_resident_profile(resident_id)
    resident = USERS[resident_id]
    number, label = emergency_for_country(profile.country_code)

    return EmergencyInfo(
        anomaly_id=anomaly.id,
        resident_id=resident_id,
        resident_name=resident.name,
        caller_name=user.name,
        address=profile.address,
        city=profile.city,
        region=profile.region,
        country_code=profile.country_code,
        latitude=profile.latitude,
        longitude=profile.longitude,
        emergency_number=number,
        emergency_label=label,
        tel_uri=f"tel:{number}",
        alert_title=anomaly.title,
        alert_message=anomaly.message,
    )


@app.post("/api/emergency/{anomaly_id}/call", response_model=EmergencyInfo)
def emergency_call(anomaly_id: str, user: User = Depends(require_user)) -> EmergencyInfo:
    info = emergency_info(anomaly_id, user)
    log_emergency_call(user, info.resident_id, anomaly_id)
    return info


@app.get("/api/summary", response_model=DashboardSummary)
def summary(user: User = Depends(require_user)) -> DashboardSummary:
    return summary_for_user(user)


@app.get("/api/sensors", response_model=list[Sensor])
def list_sensors(user: User = Depends(require_user)) -> list[Sensor]:
    return filter_sensors_for_user(user, get_sensors())


@app.patch("/api/sensors/{sensor_id}", response_model=Sensor)
def rename_sensor(
    sensor_id: str, payload: SensorUpdate, user: User = Depends(require_user)
) -> Sensor:
    if user.role == UserRole.caregiver:
        raise HTTPException(status_code=403, detail="Sensor details are private to the resident")
    sensor = update_sensor_name(sensor_id, payload.name)
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@app.get("/api/sensors/{sensor_id}", response_model=Sensor)
def read_sensor(sensor_id: str, user: User = Depends(require_user)) -> Sensor:
    sensors = filter_sensors_for_user(user, get_sensors())
    sensor = next((item for item in sensors if item.id == sensor_id), None)
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@app.get("/api/anomalies", response_model=list[Anomaly])
def list_anomalies(user: User = Depends(require_user)) -> list[Anomaly]:
    return filter_anomalies_for_user(user, get_anomalies())


@app.get("/api/alarms", response_model=list[Anomaly])
def list_alarms(user: User = Depends(require_user)) -> list[Anomaly]:
    return filter_anomalies_for_user(user, get_anomalies())


@app.get("/api/care", response_model=CareInsight)
def care_insight(user: User = Depends(require_user)) -> CareInsight:
    return care_for_user(user, get_care_insight())


@app.patch("/api/anomalies/{anomaly_id}/acknowledge", response_model=Anomaly)
def ack_anomaly(anomaly_id: str, user: User = Depends(require_user)) -> Anomaly:
    anomaly = get_anomaly(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    if user.role == UserRole.caregiver and anomaly.severity.value != "critical":
        raise HTTPException(status_code=403, detail="Only critical alerts are shared with caregivers")
    updated = acknowledge_anomaly(anomaly_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return updated
