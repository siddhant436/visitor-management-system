"""Email service for sending OTP and notifications"""

import logging
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _build_otp_html(otp_code: str) -> str:
    """Return an HTML email body for OTP delivery."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background-color:#0f172a;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0"
                           style="background-color:#1e293b;border-radius:12px;
                                  border:1px solid rgba(34,197,94,0.2);padding:40px;">
                        <tr>
                            <td align="center" style="padding-bottom:24px;">
                                <div style="font-size:48px;">🔐</div>
                                <h1 style="color:#f1f5f9;font-size:24px;margin:12px 0 4px;">
                                    Email Verification
                                </h1>
                                <p style="color:#94a3b8;font-size:14px;margin:0;">
                                    Visitor Management System
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom:24px;">
                                <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">
                                    Hello! Use the OTP below to verify your email address and
                                    complete your resident registration.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-bottom:24px;">
                                <div style="background:linear-gradient(135deg,#022c22,#064e3b);
                                            border:2px solid #22c55e;border-radius:12px;
                                            padding:20px 40px;display:inline-block;">
                                    <p style="color:#86efac;font-size:12px;letter-spacing:3px;
                                              text-transform:uppercase;margin:0 0 8px;">
                                        Your OTP Code
                                    </p>
                                    <p style="color:#22c55e;font-size:40px;font-weight:700;
                                              letter-spacing:12px;margin:0;font-family:monospace;">
                                        {otp_code}
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom:24px;">
                                <div style="background:#0f172a;border-radius:8px;padding:16px;
                                            border-left:3px solid #f59e0b;">
                                    <p style="color:#fbbf24;font-size:13px;margin:0;">
                                        ⏰ This OTP expires in <strong>5 minutes</strong>.
                                        Do not share it with anyone.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
                                    If you did not request this OTP, please ignore this email.<br>
                                    &copy; Visitor Management System
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def _send_email_sync(to_email: str, subject: str, html_body: str) -> None:
    """Send email synchronously using smtplib (run in thread pool)."""
    settings = get_settings()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_SENDER_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_SENDER_EMAIL, to_email, msg.as_string())


async def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send OTP code to the given email address.

    Returns True on success, False on failure.
    The OTP code is not logged in plain text.
    """
    settings = get_settings()

    if not all([settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_SERVER]):
        logger.warning("SMTP not configured – skipping OTP email delivery")
        return False

    try:
        subject = "Your OTP Code – Visitor Management System"
        html_body = _build_otp_html(otp_code)

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None, _send_email_sync, to_email, subject, html_body
        )

        logger.info(f"✅ OTP email sent to {to_email}")
        return True

    except Exception as exc:
        logger.error(f"❌ Failed to send OTP email to {to_email}: {exc}")
        return False
