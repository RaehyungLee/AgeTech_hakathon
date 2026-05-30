from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Sensor Alarm API"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
