from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.newsletter import NewsletterSubscribeRequest, NewsletterSubscribeResponse
from app.services.newsletter_service import subscribe

router = APIRouter()


@router.post("/subscribe", response_model=NewsletterSubscribeResponse)
async def subscribe_to_newsletter(
    payload: NewsletterSubscribeRequest, db: AsyncSession = Depends(get_db)
):
    await subscribe(db, payload.email)
    return NewsletterSubscribeResponse(message="You're subscribed.")