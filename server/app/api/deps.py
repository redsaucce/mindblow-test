from collections.abc import AsyncGenerator

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import ForbiddenError, NotAuthenticatedError
from app.core.security import decode_access_token
from app.database import get_session
from app.models.user_data import User
from app.services.auth_service import get_user_by_id


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    token = request.cookies.get(settings.cookie_name)
    if token is None:
        raise NotAuthenticatedError()

    try:
        payload = decode_access_token(token)
    except ValueError:
        raise NotAuthenticatedError()

    user_id = payload.get("sub")
    if user_id is None:
        raise NotAuthenticatedError()

    user = await get_user_by_id(db, user_id)
    if user is None:
        raise NotAuthenticatedError()

    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise ForbiddenError()
    return user