import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import ExpiredTokenError, InvalidTokenError, RateLimitedError
from app.core.security import create_access_token, generate_refresh_token
from app.models.magic_link_token import MagicLinkToken
from app.models.refresh_token import RefreshToken
from app.models.user_data import User
from app.services.activity_log_service import log_action
from app.services.mail_service import send_magic_link_email


async def request_magic_link(db: AsyncSession, email: str, opt_in_marketing: bool) -> None:
    normalized_email = email.strip().lower()

    result = await db.execute(
        select(MagicLinkToken).where(
            MagicLinkToken.email == normalized_email,
            MagicLinkToken.used_at.is_(None),
            MagicLinkToken.expires_at > datetime.now(timezone.utc),
        )
    )
    existing_token = result.scalar_one_or_none()
    if existing_token is not None:
        raise RateLimitedError()

    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            email=normalized_email,
            role="user",
            opted_in_marketing=opt_in_marketing,
        )
        db.add(user)
        await db.flush()

    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.magic_link_expire_minutes)

    token = MagicLinkToken(
        email=normalized_email,
        token=token_value,
        expires_at=expires_at,
    )
    db.add(token)
    await db.commit()

    await send_magic_link_email(to_email=normalized_email, token=token_value)


async def verify_magic_link(db: AsyncSession, token_value: str) -> tuple[str, str, str]:
    """Returns (access_token, refresh_token, role) on success."""
    result = await db.execute(select(MagicLinkToken).where(MagicLinkToken.token == token_value))
    token = result.scalar_one_or_none()

    if token is None or token.used_at is not None:
        raise InvalidTokenError()

    if token.expires_at < datetime.now(timezone.utc):
        raise ExpiredTokenError()

    result = await db.execute(select(User).where(User.email == token.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise InvalidTokenError()

    token.used_at = datetime.now(timezone.utc)

    access_token = create_access_token(user_id=str(user.id), role=user.role)
    refresh_token_value = await _issue_refresh_token(db, str(user.id))

    await db.commit()

    await log_action(
        db,
        email=user.email,
        description=f"{user.email} registered",
        type="registered",
    )

    return access_token, refresh_token_value, user.role


async def _issue_refresh_token(db: AsyncSession, user_id: str) -> str:
    refresh_token_value = generate_refresh_token()
    row = RefreshToken(user_id=user_id, token=refresh_token_value)
    db.add(row)
    return refresh_token_value


async def refresh_session(db: AsyncSession, refresh_token_value: str) -> tuple[str, str, str]:
    """Rotates the refresh token and issues a fresh access token.
    Returns (access_token, new_refresh_token, role)."""
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token_value)
    )
    row = result.scalar_one_or_none()

    if row is None:
        raise InvalidTokenError()

    cutoff = row.last_used_at + timedelta(days=settings.refresh_token_expire_days)
    if datetime.now(timezone.utc) > cutoff:
        await db.delete(row)
        await db.commit()
        raise ExpiredTokenError()

    result = await db.execute(select(User).where(User.id == row.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        await db.delete(row)
        await db.commit()
        raise InvalidTokenError()

    # Rotation: delete the old row, issue a brand new one
    await db.delete(row)
    new_refresh_token_value = await _issue_refresh_token(db, str(user.id))
    access_token = create_access_token(user_id=str(user.id), role=user.role)

    await db.commit()

    return access_token, new_refresh_token_value, user.role


async def logout(db: AsyncSession, refresh_token_value: str | None) -> None:
    """Always terminates the session server-side, regardless of activity state."""
    if refresh_token_value is None:
        return
    await db.execute(delete(RefreshToken).where(RefreshToken.token == refresh_token_value))
    await db.commit()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()