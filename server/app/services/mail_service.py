import resend

from app.config import settings

resend.api_key = settings.resend_api_key


async def send_magic_link_email(to_email: str, token: str) -> None:
    link = f"{settings.magic_link_base_url}?token={token}"

    resend.Emails.send(
        {
            "from": settings.mail_from,
            "to": [to_email],
            "subject": "Your MindBlow sign-in link",
            "html": (
                f"<p>Click the link below to sign in to MindBlow:</p>"
                f'<p><a href="{link}">{link}</a></p>'
                f"<p>This link will expire in {settings.magic_link_expire_minutes} minutes. "
                f"If you didn't request this, you can safely ignore this email.</p>"
            ),
        }
    )

async def send_announcement_email(to_email: str, subject: str, message: str) -> None:
    resend.Emails.send(
        {
            "from": settings.mail_from,
            "to": [to_email],
            "subject": subject,
            "html": f"<p>{message}</p>",
        }
    )