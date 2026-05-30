from dataclasses import dataclass
from uuid import uuid4

from fastapi import Depends, Header, HTTPException

from app.models import EmergencyContact, User, UserRole, WatchedResident


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
        email="father@kinu.demo",
        name="Father",
        role=UserRole.resident,
        relation="Father",
    ),
    "u2": User(
        id="u2",
        email="daughter@kinu.demo",
        name="Daughter",
        role=UserRole.caregiver,
        relation="Daughter",
        watches=["u1"],
    ),
}

EMAIL_INDEX = {user.email.lower(): user.id for user in USERS.values()}
SESSIONS: dict[str, str] = {}
PASSWORDS: dict[str, str] = {user_id: DEMO_PASSWORD for user_id in USERS}

SEEDED_CONTACTS: list[EmergencyContact] = [
    EmergencyContact(
        id="c1",
        name="Daughter",
        relation="Family",
        phone="+1 (408) 368-5319",
        tel_uri="tel:+14083685319",
        when_to_call="First family contact when something feels wrong.",
        is_emergency=False,
    ),
    EmergencyContact(
        id="c2",
        name="Maria Lopez",
        relation="Aunt",
        phone="+1 (628) 555-2841",
        tel_uri="tel:+16285552841",
        when_to_call="Nearby family who can check in quickly.",
        is_emergency=False,
    ),
    EmergencyContact(
        id="c3",
        name="James Holt",
        relation="Family friend",
        phone="+1 (510) 555-7392",
        tel_uri="tel:+15105557392",
        when_to_call="Trusted neighbor with a spare key.",
        is_emergency=False,
    ),
    EmergencyContact(
        id="c4",
        name="Dr. Evelyn Park",
        relation="Primary care",
        phone="+1 (415) 555-0100",
        tel_uri="tel:+14155550100",
        when_to_call="Medical guidance for ongoing health concerns.",
        is_emergency=False,
    ),
    EmergencyContact(
        id="c5",
        name="Westside Pharmacy",
        relation="Medication line",
        phone="+1 (415) 555-8820",
        tel_uri="tel:+14155558820",
        when_to_call="Prescription questions or refill help.",
        is_emergency=False,
    ),
    EmergencyContact(
        id="c6",
        name="Kinu Care Desk",
        relation="Support",
        phone="+1 (800) 555-5468",
        tel_uri="tel:+18005555468",
        when_to_call="Help with the app or sensors — not for urgent danger.",
        is_emergency=False,
    ),
]

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
    if not user_id or PASSWORDS.get(user_id) != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = uuid4().hex
    SESSIONS[token] = user_id
    return token, USERS[user_id]


def register_user(
    name: str,
    email: str,
    password: str,
    role: UserRole,
    relation: str,
) -> tuple[str, User]:
    normalized = email.strip().lower()
    if normalized in EMAIL_INDEX:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = f"u{len(USERS) + 1}"
    watches: list[str] = []
    if role == UserRole.caregiver:
        watches = ["u1"]

    user = User(
        id=user_id,
        email=normalized,
        name=name.strip(),
        role=role,
        relation=relation.strip() or ("Resident" if role == UserRole.resident else "Caregiver"),
        watches=watches,
    )
    USERS[user_id] = user
    EMAIL_INDEX[normalized] = user_id
    PASSWORDS[user_id] = password

    token = uuid4().hex
    SESSIONS[token] = user_id
    return token, user


def get_emergency_contacts() -> list[EmergencyContact]:
    contacts = list(SEEDED_CONTACTS)
    profile = RESIDENT_PROFILES.get("u1")
    if profile:
        number, label = emergency_for_country(profile.country_code)
        contacts.insert(
            0,
            EmergencyContact(
                id="local-911",
                name=label,
                relation="Local emergency",
                phone=number,
                tel_uri=f"tel:{number}",
                when_to_call="Life-threatening danger — call immediately.",
                is_emergency=True,
            ),
        )
    return contacts


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
