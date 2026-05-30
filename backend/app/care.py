from app.models import CareInsight


def get_care_insight() -> CareInsight:
    return CareInsight(
        calm_score=86,
        calm_label="Peaceful morning",
        rest_hours=7.2,
        rest_quality="Restful",
        ambient_comfort="Soft & cozy",
        temperature=22.4,
        humidity=48,
        daily_affirmation="Small gentle moments make the day beautiful.",
        gentle_tip="Open the curtains slowly — morning light helps set a calm rhythm.",
        hydration_reminder="A warm cup of water after waking keeps skin and spirit refreshed.",
        moments_of_peace=5,
    )
