import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("BREVO_SMTP_SERVER")
SMTP_PORT = int(os.getenv("BREVO_SMTP_PORT", "587"))
SMTP_LOGIN = os.getenv("BREVO_SMTP_LOGIN")
SMTP_KEY = os.getenv("BREVO_SMTP_KEY")

SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", os.getenv("BREVO_SMTP_LOGIN"))
SENDER_NAME = "Network Digital Twin"


def send_verification_email(to_email: str, code: str) -> None:
    if not all([SMTP_SERVER, SMTP_PORT, SMTP_LOGIN, SMTP_KEY]):
        raise RuntimeError(
            "Email service is not configured. Check your .env file."
        )

    message = MIMEMultipart("alternative")
    message["Subject"] = "Verify your Network Digital Twin account"
    message["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    message["To"] = to_email

    text_body = (
        f"Welcome to Network Digital Twin!\n\n"
        f"Your verification code is: {code}\n\n"
        f"Enter this code in the app to activate your account.\n"
        f"This code expires in 15 minutes."
    )

    html_body = f"""
    <div style="font-family: Arial, sans-serif; background: #07111f; padding: 32px; color: #e5e7eb;">
      <div style="max-width: 420px; margin: 0 auto; background: #0d1b2d; border-radius: 16px; padding: 32px; border: 1px solid #1e334d;">
        <h2 style="color: #f8fafc; margin-top: 0;">🌐 Network Digital Twin</h2>
        <p>Welcome! Please verify your email address to activate your account.</p>
        <div style="background: #091827; border: 1px solid #29415d; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38bdf8;">{code}</span>
        </div>
        <p style="color: #7f8ea3; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
    """

    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_LOGIN, SMTP_KEY)
        server.sendmail(SENDER_EMAIL, to_email, message.as_string())