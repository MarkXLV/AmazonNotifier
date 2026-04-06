from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./pricewatch.db"
    amazon_base_url: str = "https://www.amazon.in"
    cors_origins: list[str] = ["http://localhost:5173"]

    # Email (SMTP)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = ""
    email_enabled: bool = False

    # Scheduler
    price_check_interval_minutes: int = 360  # 6 hours

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def fix_database_url(self) -> "Settings":
        url = self.database_url
        if url.startswith("postgres://"):
            self.database_url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and "+psycopg" not in url:
            self.database_url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self

    @model_validator(mode="after")
    def auto_enable_email(self) -> "Settings":
        if self.smtp_host and self.smtp_user and self.smtp_password:
            self.email_enabled = True
        return self


settings = Settings()
