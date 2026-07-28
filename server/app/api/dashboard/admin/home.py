from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.user_data import User
from app.schemas.admin_home import AdminStatsResponse
from app.services.admin_home_service import get_stats

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    stats = await get_stats(db)
    return AdminStatsResponse(**stats)