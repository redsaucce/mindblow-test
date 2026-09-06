import resend

from app.config import settings
from app.templates import render_announcement_email, render_magic_link_email

resend.api_key = settings.resend_api_key


async def send_magic_link_email(to_email: str, token: str) -> None:
    link = f"{settings.magic_link_base_url}?token={token}"

    resend.Emails.send(
        {
            "from": settings.mail_from,
            "to": [to_email],
            "subject": "Your MindBlow sign-in link",
            "html": render_magic_link_email(
                link=link,
                expire_minutes=settings.magic_link_expire_minutes,
            ),
        }
    )


async def send_announcement_email(to_email: str, subject: str, message: str) -> None:
    resend.Emails.send(
        {
            "from": settings.mail_from,
            "to": [to_email],
            "subject": subject,
            "html": render_announcement_email(subject=subject, message_html=message),
        }
    )