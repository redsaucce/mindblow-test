import asyncio
import logging

import nh3
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.announcement_log import AnnouncementLog
from app.models.newsletter_subscriber import NewsletterSubscriber
from app.models.user_data import User
from app.services.activity_log_service import log_action
from app.services.mail_service import send_announcement_email

logger = logging.getLogger(__name__)

MAX_CONCURRENT_SENDS = 10


async def _get_recipient_emails(db: AsyncSession) -> list[str]:
    opted_in_result = await db.execute(
        select(User.email).where(User.opted_in_marketing.is_(True))
    )
    opted_in_emails = {row[0] for row in opted_in_result.all()}

    subscriber_result = await db.execute(select(NewsletterSubscriber.email))
    subscriber_emails = {row[0] for row in subscriber_result.all()}

    return list(opted_in_emails | subscriber_emails)


async def send_announcement(
    db: AsyncSession, admin_email: str, title: str, subject: str, message: str
) -> str:
    clean_title = nh3.clean(title)
    clean_subject = nh3.clean(subject)
    clean_message = nh3.clean(message)

    recipient_emails = await _get_recipient_emails(db)

    semaphore = asyncio.Semaphore(MAX_CONCURRENT_SENDS)

    async def send_one(email: str) -> bool:
        async with semaphore:
            try:
                await send_announcement_email(
                    to_email=email, subject=clean_subject, message=clean_message
                )
                return True
            except Exception:
                logger.exception("Failed to send announcement to %s", email)
                return False

    results = await asyncio.gather(*(send_one(email) for email in recipient_emails))
    succeeded = sum(1 for ok in results if ok)
    total = len(results)

    log_entry = AnnouncementLog(title=clean_title, subject=clean_subject, message=clean_message)
    db.add(log_entry)
    await db.commit()

    await log_action(
        db,
        email=admin_email,
        description=f'Sent announcement "{clean_title}"',
        type="announcement_sent",
    )

    if total == 0:
        return "Announcement saved. No recipients to send to yet."
    return f"Announcement sent to {succeeded} of {total} recipients."