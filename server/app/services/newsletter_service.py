from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.newsletter_subscriber import NewsletterSubscriber
from app.services.activity_log_service import log_action


async def subscribe(db: AsyncSession, email: str) -> None:
    normalized_email = email.strip().lower()

    stmt = (
        pg_insert(NewsletterSubscriber)
        .values(email=normalized_email)
        .on_conflict_do_nothing(index_elements=["email"])
        .returning(NewsletterSubscriber.id)
    )
    result = await db.execute(stmt)
    was_new_insert = result.first() is not None
    await db.commit()

    if was_new_insert:
        await log_action(
            db,
            email=normalized_email,
            description=f"{normalized_email} subscribed to the newsletter",
            type="newsletter",
        )