from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ReleaseRite"
    ENVIRONMENT: str = "dev"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    ALLOWED_ORIGINS: List[AnyHttpUrl] | List[str] = ["http://localhost", "http://127.0.0.1", "http://localhost:3000"]
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/giq_db"
    SECRET_KEY: str = "change-this-in-prod-to-a-long-random-value"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v):
        # Allow comma-separated list in env var
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
