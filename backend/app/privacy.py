from app.models import (
    Anomaly,
    AnomalySeverity,
    CareInsight,
    DashboardSummary,
    Sensor,
    User,
    UserRole,
    WatchedResident,
)
from app.store import get_anomalies, get_summary


def has_critical_access(user: User) -> bool:
    if user.role != UserRole.caregiver:
        return True
    return any(
        not anomaly.acknowledged and anomaly.severity == AnomalySeverity.critical
        for anomaly in get_anomalies()
    )


def caregiver_privacy_mode(user: User) -> bool:
    return user.role == UserRole.caregiver and not has_critical_access(user)


def filter_anomalies_for_user(user: User, anomalies: list[Anomaly]) -> list[Anomaly]:
    if user.role == UserRole.resident:
        return anomalies
    return [
        anomaly
        for anomaly in anomalies
        if not anomaly.acknowledged and anomaly.severity == AnomalySeverity.critical
    ]


def filter_sensors_for_user(user: User, sensors: list[Sensor]) -> list[Sensor]:
    if caregiver_privacy_mode(user):
        return []
    if user.role == UserRole.caregiver:
        return []
    return sensors


def summary_for_user(user: User) -> DashboardSummary:
    base = get_summary()
    if user.role == UserRole.resident:
        return base.model_copy(update={"privacy_mode": False})

    critical = sum(
        1
        for anomaly in get_anomalies()
        if not anomaly.acknowledged and anomaly.severity == AnomalySeverity.critical
    )

    if caregiver_privacy_mode(user):
        return DashboardSummary(
            total_sensors=0,
            online_sensors=0,
            low_battery_sensors=0,
            active_anomalies=0,
            critical_anomalies=0,
            privacy_mode=True,
            monitoring_active=True,
        )

    return DashboardSummary(
        total_sensors=0,
        online_sensors=0,
        low_battery_sensors=0,
        active_anomalies=critical,
        critical_anomalies=critical,
        privacy_mode=False,
        monitoring_active=True,
    )


def care_for_user(user: User, insight: CareInsight) -> CareInsight:
    if user.role == UserRole.resident:
        return insight
    return private_care_insight()


def private_care_insight() -> CareInsight:
    return CareInsight(
        calm_score=0,
        calm_label="Private",
        rest_hours=0,
        rest_quality="Protected",
        ambient_comfort="Private",
        temperature=0,
        humidity=0,
        daily_affirmation="Daily wellness stays with the resident unless a critical alert needs you.",
        gentle_tip="Kinu keeps routines private for dignity and trust.",
        hydration_reminder="Shared only when a critical issue requires attention.",
        moments_of_peace=0,
    )


def watched_residents_for_user(
    user: User, residents: list[WatchedResident]
) -> list[WatchedResident]:
    if user.role != UserRole.caregiver or has_critical_access(user):
        return residents
    return [
        resident.model_copy(
            update={
                "address": "Protected until a critical alert",
                "city": "Private",
                "region": "",
                "emergency_number": "—",
                "emergency_label": "Shared during critical alerts only",
            }
        )
        for resident in residents
    ]
