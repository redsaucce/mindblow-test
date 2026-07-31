import logging

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, verify_csrf
from app.config import settings
from app.core.exceptions import RateLimitedError
from app.core.security import (
    clear_csrf_cookie,
    clear_refresh_cookie,
    clear_session_cookie,
    decode_access_token,
    generate_csrf_token,
    set_csrf_cookie,
    set_refresh_cookie,
    set_session_cookie,
)
from app.models.user_data import User
from app.schemas.auth import (
    LogoutResponse,
    MagicLinkRequest,
    MagicLinkResponse,
    MeResponse,
    RefreshResponse,
    VerifyResponse,
)
from app.services.auth_service import (
    logout as logout_service,
    refresh_session,
    request_magic_link,
    revoke_access_token,
    verify_magic_link,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/magic-link", response_model=MagicLinkResponse)
async def send_magic_link(payload: MagicLinkRequest, db: AsyncSession = Depends(get_db)):
    try:
        await request_magic_link(db, payload.email)
    except RateLimitedError:
        # Deliberately swallowed rather than re-raised: surfacing a distinct
        # 429 here would let a caller tell "no active token for this email"
        # apart from "a token was already requested," which leaks whether an
        # email has recently signed up or is mid-flow. Every outcome gets
        # the same response below.
        pass
    except Exception:
        logger.exception("Failed to process magic-link request for %s", payload.email)
    return MagicLinkResponse(message="If that email is valid, a sign-in link has been sent.")


@router.get("/verify", response_model=VerifyResponse)
async def verify(token: str, response: Response, db: AsyncSession = Depends(get_db)):
    access_token, refresh_token, role = await verify_magic_link(db, token)
    set_session_cookie(response, access_token)
    set_refresh_cookie(response, refresh_token)
    set_csrf_cookie(response, generate_csrf_token())
    return VerifyResponse(role=role)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token_value = request.cookies.get(settings.refresh_cookie_name)
    if refresh_token_value is None:
        clear_session_cookie(response)
        from app.core.exceptions import NotAuthenticatedError
        raise NotAuthenticatedError()

    access_token, new_refresh_token, role = await refresh_session(db, refresh_token_value)
    set_session_cookie(response, access_token)
    set_refresh_cookie(response, new_refresh_token)
    set_csrf_cookie(response, generate_csrf_token())
    return RefreshResponse(role=role)


@router.post("/logout", response_model=LogoutResponse, dependencies=[Depends(verify_csrf)])
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token_value = request.cookies.get(settings.refresh_cookie_name)
    await logout_service(db, refresh_token_value)

    access_token_value = request.cookies.get(settings.cookie_name)
    if access_token_value is not None:
        try:
            payload = decode_access_token(access_token_value)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti is not None and exp is not None:
                from datetime import datetime, timezone
                await revoke_access_token(db, jti, datetime.fromtimestamp(exp, tz=timezone.utc))
        except ValueError:
            pass  # already invalid/expired — nothing to revoke

    clear_session_cookie(response)
    clear_refresh_cookie(response)
    clear_csrf_cookie(response)
    return LogoutResponse(message="Logged out.")

@router.get("/me", response_model=MeResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role,
    )