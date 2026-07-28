from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.user_data import User
from app.schemas.activity_log import ActivityLogEntry, ActivityLogListResponse
from app.services.activity_log_service import list_logs

router = APIRouter()


@router.get("", response_model=ActivityLogListResponse)
async def get_admin_logs(
    tab: str = "all",
    page: int = 1,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    logs, total = await list_logs(db, tab=tab, page=page)
    return ActivityLogListResponse(
        logs=[
            ActivityLogEntry(
                id=str(log.id),
                email=log.email,
                description=log.description,
                type=log.type,
                timestamp=log.timestamp,
            )
            for log in logs
        ],
        total=total,
    )