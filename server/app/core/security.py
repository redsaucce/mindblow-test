import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import settings


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "role": role, "exp": expire, "jti": secrets.token_urlsafe(16)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(raw_token: str) -> str:
    """Used for refresh tokens and magic link tokens before they're stored or
    looked up in the database — the raw value is only ever emailed or set as
    a cookie, never persisted. Both token types are already high-entropy
    (secrets.token_urlsafe), so a plain unsalted hash is sufficient; a DB
    read alone can no longer be used to complete a sign-in or refresh."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def set_session_cookie(response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


def set_refresh_cookie(response, token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    )


def clear_session_cookie(response) -> None:
    response.delete_cookie(key=settings.cookie_name)


def clear_refresh_cookie(response) -> None:
    response.delete_cookie(key=settings.refresh_cookie_name)


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_csrf_cookie(response, token: str) -> None:
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=token,
        httponly=False,  # must be readable by frontend JS to echo back in a header
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


def clear_csrf_cookie(response) -> None:
    response.delete_cookie(key=settings.csrf_cookie_name)