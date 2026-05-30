from dataclasses import dataclass
from uuid import uuid4

from fastapi import Depends, Header, HTTPException

from app.models import User, UserRole, WatchedResident


@dataclass
class ResidentProfile:
    user_id: str
    address: str
    city: str
    region: str
    country_code: str
    latitude: float
    longitude: float


DEMO_PASSWORD = "demo123"

RESIDENT_PROFILES: dict[str, ResidentProfile] = {
    "u1": ResidentProfile(
        user_id="u1",
        address="42 Oak Grove Lane",
        city="San Francisco",
        region="CA",
        country_code="US",
        latitude=37.7749,
        longitude=-122.4194,
    ),
}

USERS: dict[str, User] = {
    "u1": User(
        id="u1",
        email="maya@kinu.demo",
        name="Maya Chen",
        role=UserRole.resident,
        relation="Resident",
    ),
    "u2": User(
        id="u2",
        email="alex@kinu.demo",
        name="Alex Chen",
        role=UserRole.caregiver,
        relation="Daughter",
        watches=["u1"],
    ),
    "u3": User(
        id="u3",
        email="sam@kinu.demo",
        name="Sam Rivera",
        role=UserRole.caregiver,
        relation="Neighbor",
        watches=["u1"],
    ),
}

EMAIL_INDEX = {user.email.lower(): user.id for user in USERS.values()}
SESSIONS: dict[str, str] = {}

EMERGENCY_NUMBERS: dict[str, tuple[str, str]] = {
    "US": ("911", "US Emergency Services"),
    "CA": ("911", "Canadian Emergency Services"),
    "GB": ("999", "UK Emergency Services"),
    "AU": ("000", "Australian Emergency Services"),
    "JP": ("119", "Japanese Emergency Services"),
    "EU": ("112", "European Emergency Services"),
}

EU_COUNTRIES = {
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
}

EMERGENCY_CALLS: list[dict[str, str]] = []


def login(email: str, password: str) -> tuple[str, User]:
    user_id = EMAIL_INDEX.get(email.strip().lower())
    if not user_id or password != DEMO_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = uuid4().hex
    SESSIONS[token] = user_id
    return token, USERS[user_id]


def logout(token: str) -> None:
    SESSIONS.pop(token, None)


def get_user_by_token(token: str | None) -> User | None:
    if not token:
        return None
    user_id = SESSIONS.get(token)
    if not user_id:
        return None
    return USERS.get(user_id)


def require_user(authorization: str | None = Header(default=None)) -> User:
    token = _extract_token(authorization)
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required")
    return user


def optional_user(authorization: str | None = Header(default=None)) -> User | None:
    return get_user_by_token(_extract_token(authorization))


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def get_watched_residents(user: User) -> list[WatchedResident]:
    residents: list[WatchedResident] = []
    for resident_id in user.watches:
        resident = USERS.get(resident_id)
        profile = RESIDENT_PROFILES.get(resident_id)
        if not resident or not profile:
            continue
        number, label = emergency_for_country(profile.country_code)
        residents.append(
            WatchedResident(
                id=resident.id,
                name=resident.name,
                address=f"{profile.address}, {profile.city}, {profile.region}",
                city=profile.city,
                region=profile.region,
                country_code=profile.country_code,
                emergency_number=number,
                emergency_label=label,
            )
        )
    return residents


def emergency_for_country(country_code: str) -> tuple[str, str]:
    code = country_code.upper()
    if code in EU_COUNTRIES:
        return EMERGENCY_NUMBERS["EU"]
    return EMERGENCY_NUMBERS.get(code, ("911", "Local Emergency Services"))


def get_resident_profile(resident_id: str) -> ResidentProfile:
    profile = RESIDENT_PROFILES.get(resident_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Resident location not found")
    return profile


def can_view_resident(user: User, resident_id: str) -> bool:
    if user.role == UserRole.resident:
        return user.id == resident_id
    return resident_id in user.watches


def log_emergency_call(caller: User, resident_id: str, anomaly_id: str) -> None:
    EMERGENCY_CALLS.append(
        {
            "caller_id": caller.id,
            "caller_name": caller.name,
            "resident_id": resident_id,
            "anomaly_id": anomaly_id,
        }
    )
