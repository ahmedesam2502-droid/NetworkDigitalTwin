import os
import requests

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
SENDER_NAME = "Network Digital Twin"

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_verification_email(to_email: str, code: str) -> None:
    if not BREVO_API_KEY or not SENDER_EMAIL:
        raise RuntimeError(
            "Email service is not configured. Check your .env file."
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

    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email}],
        "subject": "Verify your Network Digital Twin account",
        "htmlContent": html_body,
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    response = requests.post(
        BREVO_API_URL,
        json=payload,
        headers=headers,
        timeout=10,
    )

    if response.status_code not in (200, 201):
        raise RuntimeError(
            f"Brevo API error ({response.status_code}): {response.text}"
        )