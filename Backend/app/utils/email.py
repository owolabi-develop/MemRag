import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

load_dotenv(override=True)

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "email-templates"

APP_NAME = os.getenv("APP_NAME", "YourApp")




@dataclass
class EmailData:
    template_name: str
    subject: str
    context: dict


conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD"),
    MAIL_FROM=os.getenv("EMAILS_FROM_EMAIL"),
    MAIL_FROM_NAME=os.getenv("EMAILS_FROM_NAME", APP_NAME),
    MAIL_PORT=int(os.getenv("SMTP_PORT")),
    MAIL_SERVER=os.getenv("SMTP_HOST"),
    MAIL_STARTTLS = False,
    MAIL_SSL_TLS = True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=TEMPLATES_DIR,
)


fm = FastMail(conf)


def _base_context(extra: dict) -> dict:
    return {
        "app_name": APP_NAME,
        "current_year": datetime.now(timezone.utc).year,
        **extra,
    }


async def send_templated_email(email_data: "EmailData", email_to: str) -> None:
    message = MessageSchema(
        subject=email_data.subject,
        recipients=[email_to],
        template_body=email_data.context,
        subtype=MessageType.html,
    )
    await fm.send_message(message, template_name=email_data.template_name)


def generate_password_reset_email(
    *, email_to: str, token: str, first_name: str | None = None
) -> EmailData:
    frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5173")
    expire_minutes = os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30")
    reset_link = f"{frontend_host}/reset-password?token={token}"

    return EmailData(
        template_name="reset_password.html",
        subject=f"Reset your {APP_NAME} password",
        context=_base_context(
            {
                "email": email_to,
                "first_name": first_name,
                "reset_link": reset_link,
                "expire_minutes": expire_minutes,
            }
        ),
    )


def generate_password_changed_email(
    *, email_to: str, first_name: str | None = None
) -> EmailData:
    return EmailData(
        template_name="password_changed.html",
        subject=f"Your {APP_NAME} password was changed",
        context=_base_context(
            {
                "email": email_to,
                "first_name": first_name,
                "changed_at": datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC"),
            }
        ),
    )
    
def generate_invite_email(
    *, email_to: str, temp_password: str, first_name: str | None = None
) -> EmailData:
    frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5173")
    login_link = f"{frontend_host}/login"

    return EmailData(
        template_name="invite_user.html",
        subject=f"You've been invited to {APP_NAME}",
        context=_base_context(
            {
                "email": email_to,
                "first_name": first_name,
                "temp_password": temp_password,
                "login_link": login_link,
            }
        ),
    )
    
    
def generate_welcome_email(
    *, email_to: str, first_name: str | None = None
) -> EmailData:
    frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5173")
    login_link = f"{frontend_host}/login"

    return EmailData(
        template_name="welcome_user.html",
        subject=f"Welcome to {APP_NAME}!",
        context=_base_context(
            {
                "email": email_to,
                "first_name": first_name,
                "login_link": login_link,
            }
        ),
    )

def generate_department_added_email(
    *,
    email_to: str,
    department_name: str,
    first_name: str | None = None,
    added_by_name: str | None = None,
) -> EmailData:
    frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5173")
    dashboard_link = f"{frontend_host}/dashboard"

    return EmailData(
        template_name="department_added.html",
        subject=f"You've been added to {department_name}",
        context=_base_context(
            {
                "email": email_to,
                "first_name": first_name,
                "department_name": department_name,
                "added_by_name": added_by_name,
                "dashboard_link": dashboard_link,
            }
        ),
    )

def generate_department_removed_email(
    *,
    email_to: str,
    department_name: str,
    first_name: str | None = None,
    removed_by_name: str | None = None,
) -> EmailData:
    frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5173")
    dashboard_link = f"{frontend_host}/dashboard"

    return EmailData(
        template_name="department_removed.html",
        subject=f"You've been removed from {department_name}",
        context=_base_context(
            {
                "email": email_to,
                "first_name": first_name,
                "department_name": department_name,
                "removed_by_name": removed_by_name,
                "dashboard_link": dashboard_link,
            }
        ),
    )

if os.getenv("ENVIRONMENT") == "local":
    conf.SUPPRESS_SEND = 1