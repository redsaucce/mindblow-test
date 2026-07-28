import logging

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.core.exceptions import RateLimitedError
from app.core.security import (
    clear_refresh_cookie,
    clear_session_cookie,
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
    verify_magic_link,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/magic-link", response_model=MagicLinkResponse)
async def send_magic_link(payload: MagicLinkRequest, db: AsyncSession = Depends(get_db)):
    try:
        await request_magic_link(db, payload.email, payload.optInMarketing)
    except RateLimitedError:
        raise
    except Exception:
        logger.exception("Failed to process magic-link request for %s", payload.email)
    return MagicLinkResponse(message="If that email is valid, a sign-in link has been sent.")


@router.get("/verify", response_model=VerifyResponse)
async def verify(token: str, response: Response, db: AsyncSession = Depends(get_db)):
    access_token, refresh_token, role = await verify_magic_link(db, token)
    set_session_cookie(response, access_token)
    set_refresh_cookie(response, refresh_token)
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
    return RefreshResponse(role=role)


@router.post("/logout", response_model=LogoutResponse)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token_value = request.cookies.get(settings.refresh_cookie_name)
    await logout_service(db, refresh_token_value)
    clear_session_cookie(response)
    clear_refresh_cookie(response)
    return LogoutResponse(message="Logged out.")