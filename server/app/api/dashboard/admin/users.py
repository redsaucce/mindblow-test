from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_admin
from app.models.user_data import User
from app.schemas.admin_users import AdminUserListResponse, DeleteUserResponse
from app.services.admin_users_service import delete_user, list_users

router = APIRouter()


@router.get("", response_model=AdminUserListResponse)
async def get_admin_users(
    page: int = 1,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users, total = await list_users(db, page=page)
    return AdminUserListResponse(users=users, total=total)


@router.delete("/{user_id}", response_model=DeleteUserResponse)
async def delete_admin_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await delete_user(db, str(admin.id), user_id, admin.email)
    return DeleteUserResponse(message="User deleted.")