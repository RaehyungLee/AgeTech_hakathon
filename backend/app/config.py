from pathlib import Path

from pydantic_settings import BaseSettings

# Repo root = .../AgeTech_hakathon (config.py is at backend/app/config.py)
_REPO_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_RESTROOM_CSV = _REPO_ROOT / "single_patient_detailed_1000_visits.csv"


class Settings(BaseSettings):
    app_name: str = "Kinu API"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Restroom-usage history the monitoring agent reviews.
    restroom_data_path: str = str(_DEFAULT_RESTROOM_CSV)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
