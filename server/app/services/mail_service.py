import asyncio

import resend

from app.config import settings
from app.templates import render_magic_link_email

resend.api_key = settings.resend_api_key


async def send_magic_link_email(to_email: str, token: str) -> None:
    link = f"{settings.magic_link_base_url}?token={token}"

    params = {
        "from": settings.mail_from,
        "to": [to_email],
        "subject": "MindBlow sign-in link",
        "html": render_magic_link_email(
            link=link,
            expire_minutes=settings.magic_link_expire_minutes,
        ),
    }
    # resend's client is synchronous, so run it in a thread to keep the event loop free.
    await asyncio.to_thread(resend.Emails.send, params)