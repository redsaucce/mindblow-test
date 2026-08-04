from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.user_data import User
from app.schemas.admin_home import AdminStatsResponse
from app.services.admin_home_service import get_stats

router = APIRouter()

Granularity = Literal["day", "week", "month", "year"]


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    granularity: Granularity = Query(default="month"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    stats = await get_stats(db, granularity=granularity)
    return AdminStatsResponse(**stats)