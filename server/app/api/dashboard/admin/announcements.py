from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.user_data import User
from app.schemas.announcement import SendAnnouncementRequest, SendAnnouncementResponse
from app.services.announcement_service import send_announcement

router = APIRouter()


@router.post("", response_model=SendAnnouncementResponse)
async def create_announcement(
    payload: SendAnnouncementRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result_message = await send_announcement(
        db, admin.email, payload.title, payload.subject, payload.message
    )
    return SendAnnouncementResponse(message=result_message)