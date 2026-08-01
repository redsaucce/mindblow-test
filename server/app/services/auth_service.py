import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import ExpiredTokenError, InvalidTokenError, RateLimitedError
from app.core.security import create_access_token, generate_refresh_token, hash_token
from app.models.activity_log import ActivityType
from app.models.magic_link_token import MagicLinkToken
from app.models.refresh_token import RefreshToken
from app.models.revoked_token import RevokedToken
from app.models.user_data import Role, User
from app.services.activity_log_service import log_action
from app.services.mail_service import send_magic_link_email

# How long a just-rotated refresh token is still tolerated if presented again.
# Concurrent tabs/requests can race to refresh the same token; the first to
# arrive rotates it and the second shows up moments later holding the now-dead
# token. Without this window that reuse looks identical to a stolen token
# being replayed, and gets treated as theft (nukes every session for the
# user). Within the window we instead treat it as a benign race and issue a
# fresh token rather than escalating.
REFRESH_REUSE_GRACE_SECONDS = 10


async def request_magic_link(db: AsyncSession, email: str) -> None:
    normalized_email = email.strip().lower()

    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            email=normalized_email,
            role=Role.USER,
        )
        db.add(user)
        await db.flush()

    result = await db.execute(
        select(MagicLinkToken).where(
            MagicLinkToken.user_id == user.id,
            MagicLinkToken.used_at.is_(None),
            MagicLinkToken.expires_at > datetime.now(timezone.utc),
        )
    )
    existing_token = result.scalar_one_or_none()
    if existing_token is not None:
        raise RateLimitedError()

    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.magic_link_expire_minutes)

    token = MagicLinkToken(
        user_id=user.id,
        token_hash=hash_token(token_value),
        expires_at=expires_at,
    )
    db.add(token)
    await db.commit()

    await send_magic_link_email(to_email=normalized_email, token=token_value)


async def verify_magic_link(db: AsyncSession, token_value: str) -> tuple[str, str, str]:
    """Returns (access_token, refresh_token, role) on success."""
    result = await db.execute(
        select(MagicLinkToken).where(MagicLinkToken.token_hash == hash_token(token_value))
    )
    token = result.scalar_one_or_none()

    if token is None or token.used_at is not None:
        raise InvalidTokenError()

    if token.expires_at < datetime.now(timezone.utc):
        raise ExpiredTokenError()

    result = await db.execute(select(User).where(User.id == token.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise InvalidTokenError()

    # Distinguish a genuine first-ever verification from a returning sign-in:
    # this is the first time this user has ever completed one if no other
    # token for them has been used before. Checked before marking the current
    # token used below, so it can't count itself.
    prior_used_result = await db.execute(
        select(MagicLinkToken.id).where(
            MagicLinkToken.user_id == user.id, MagicLinkToken.used_at.is_not(None)
        )
    )
    is_first_verification = prior_used_result.first() is None

    token.used_at = datetime.now(timezone.utc)

    access_token = create_access_token(user_id=str(user.id), role=user.role)
    refresh_token_value = await _issue_refresh_token(db, str(user.id))

    await db.commit()

    if is_first_verification:
        await log_action(
            db,
            email=user.email,
            description=f"{user.email} registered",
            type=ActivityType.REGISTERED,
        )
    else:
        await log_action(
            db,
            email=user.email,
            description=f"{user.email} signed in",
            type=ActivityType.SIGNED_IN,
        )

    return access_token, refresh_token_value, user.role


async def _issue_refresh_token(db: AsyncSession, user_id: str) -> str:
    refresh_token_value = generate_refresh_token()
    row = RefreshToken(user_id=user_id, token_hash=hash_token(refresh_token_value))
    db.add(row)
    return refresh_token_value


async def _revoke_all_refresh_tokens_for_user(db: AsyncSession, user_id: str) -> None:
    """Called when a dead (already-rotated) refresh token is presented again —
    the standard signal that a token was stolen and is being replayed
    alongside the legitimate rotated session. Kills every outstanding
    refresh token for the user so both the attacker and the legitimate
    session are forced to re-authenticate via a fresh magic link."""
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)
        )
    )
    for row in result.scalars().all():
        row.revoked_at = datetime.now(timezone.utc)


async def refresh_session(db: AsyncSession, refresh_token_value: str) -> tuple[str, str, str]:
    """Rotates the refresh token and issues a fresh access token.
    Returns (access_token, new_refresh_token, role)."""
    result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.token_hash == hash_token(refresh_token_value))
        .with_for_update()
    )
    row = result.scalar_one_or_none()

    if row is None:
        raise InvalidTokenError()

    if row.revoked_at is not None:
        reused_within_grace = (
            datetime.now(timezone.utc) - row.revoked_at
            <= timedelta(seconds=REFRESH_REUSE_GRACE_SECONDS)
        )
        if not reused_within_grace:
            # This exact token was already rotated away, and well outside the
            # grace window — treat it as a stolen copy being replayed: kill
            # every refresh token for this user and force a fresh login.
            await _revoke_all_refresh_tokens_for_user(db, str(row.user_id))
            await db.commit()
            raise InvalidTokenError()

        # Likely a benign race (e.g. two tabs refreshing around the same
        # time) rather than theft. Nothing links this dead row to whichever
        # token superseded it, so rather than guess we issue this caller a
        # fresh token of their own — safe, just means an extra live token
        # for the user instead of reusing the sibling request's.
        result = await db.execute(select(User).where(User.id == row.user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise InvalidTokenError()

        new_refresh_token_value = await _issue_refresh_token(db, str(user.id))
        access_token = create_access_token(user_id=str(user.id), role=user.role)
        await db.commit()
        return access_token, new_refresh_token_value, user.role

    cutoff = row.last_used_at + timedelta(days=settings.refresh_token_expire_days)
    if datetime.now(timezone.utc) > cutoff:
        row.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        raise ExpiredTokenError()

    result = await db.execute(select(User).where(User.id == row.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        row.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        raise InvalidTokenError()

    # Rotation: mark the old row revoked (kept, not deleted, so a later
    # replay of this same token can be recognized as reuse) and issue a
    # brand new one.
    row.revoked_at = datetime.now(timezone.utc)
    new_refresh_token_value = await _issue_refresh_token(db, str(user.id))
    access_token = create_access_token(user_id=str(user.id), role=user.role)

    await db.commit()

    return access_token, new_refresh_token_value, user.role


async def logout(db: AsyncSession, refresh_token_value: str | None) -> None:
    """Always terminates the session server-side, regardless of activity state."""
    if refresh_token_value is None:
        return
    await db.execute(
        delete(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh_token_value))
    )
    await db.commit()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def is_token_revoked(db: AsyncSession, jti: str | None) -> bool:
    if jti is None:
        # Tokens without a jti predate this feature (or are malformed) — treat
        # as not-revoked rather than raising, since revocation is an addition
        # on top of normal expiry/signature checks, not a replacement for it.
        return False
    result = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
    return result.scalar_one_or_none() is not None


async def revoke_access_token(db: AsyncSession, jti: str, expires_at: datetime) -> None:
    db.add(RevokedToken(jti=jti, expires_at=expires_at))
    await db.commit()


async def revoke_all_access_tokens_for_user(db: AsyncSession, user_id: str) -> None:
    """Best-effort mass revocation: since access tokens are stateless JWTs, we
    can't enumerate a user's currently-outstanding jtis. Session-terminating
    actions (logout, account deletion) revoke the specific token presented at
    that time via revoke_access_token; this helper is a placeholder for a
    future per-user revocation epoch if a "log out everywhere" feature is
    ever needed. Currently a no-op, kept as an explicit extension point rather
    than silently absent."""
    return None