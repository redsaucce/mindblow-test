from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str

    # JWT / session cookie
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30  # short-lived access token; session length is governed by refresh_token_expire_days below

    cookie_name: str = "mb_session"
    cookie_secure: bool = True  # True in production
    cookie_samesite: str = "none"
    refresh_cookie_name: str = "mb_refresh"
    refresh_token_expire_days: int = 7
    csrf_cookie_name: str = "mb_csrf"

    # Magic link
    magic_link_expire_minutes: int = 5

    # File uploads
    max_upload_size_bytes: int = 10 * 1024 * 1024  # 10 MB

    # Mail (Resend)
    resend_api_key: str
    mail_from: str

    # AI (Gemini)
    gemini_api_key: str

    # CORS / frontend
    frontend_url: str = "http://localhost:3000"

    @computed_field
    @property
    def magic_link_base_url(self) -> str:
        return f"{self.frontend_url}/verify"


settings = Settings()