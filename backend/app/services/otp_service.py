"""OTP generation, storage, verification, and rate-limiting service"""

import logging
import secrets
import hashlib
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.otp import OTPRecord
from app.services.rate_limit_service import rate_limiter

logger = logging.getLogger(__name__)

# Configuration constants
OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 5
RATE_LIMIT_MAX_REQUESTS = 3
RATE_LIMIT_WINDOW_SECONDS = 15 * 60  # 15 minutes


def _generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return str(secrets.randbelow(900000) + 100000)


def _hash_otp(otp_code: str) -> str:
    """Return SHA-256 hash of the OTP code for safe storage."""
    return hashlib.sha256(otp_code.encode()).hexdigest()


async def request_otp(email: str, db: AsyncSession) -> str:
    """
    Create a new OTP record for *email* and return the plain-text code.

    The code is hashed before being persisted so the database never stores it
    in plain text.  Raises HTTPException 429 when the email has exceeded the
    rate limit.  The returned code should be passed directly to
    :func:`send_otp_email` and never logged.
    """
    # Rate-limit: 3 requests per email per 15 minutes
    rate_key = f"otp_request:{email}"
    if not rate_limiter.is_allowed(rate_key, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_SECONDS):
        logger.warning(f"OTP rate limit exceeded for {email}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting another OTP. "
                   f"Maximum {RATE_LIMIT_MAX_REQUESTS} requests per 15 minutes.",
        )

    otp_code = _generate_otp()
    otp_hash = _hash_otp(otp_code)
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    record = OTPRecord(
        email=email,
        otp_code=otp_hash,
        created_at=now,
        expires_at=expires_at,
        is_verified=False,
        attempt_count=0,
    )
    db.add(record)
    await db.commit()

    logger.info(f"OTP record created for {email} (expires at {expires_at})")
    # Return plain-text code to be emailed – never persisted or logged
    return otp_code


async def verify_otp(email: str, otp_code: str, db: AsyncSession) -> bool:
    """
    Verify *otp_code* for *email*.

    Returns True when valid, otherwise raises an HTTPException with a
    descriptive message.
    """
    now = datetime.utcnow()

    # Fetch the most recent, unverified OTP for this email
    result = await db.execute(
        select(OTPRecord)
        .where(
            OTPRecord.email == email,
            OTPRecord.is_verified == False,  # noqa: E712
        )
        .order_by(OTPRecord.created_at.desc())
    )
    record: OTPRecord | None = result.scalars().first()

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found for this email. Please request a new one.",
        )

    if record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if record.attempt_count >= MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new OTP.",
        )

    # Increment attempt counter before comparing to prevent timing abuse
    record.attempt_count += 1
    await db.commit()

    if record.otp_code != _hash_otp(otp_code):
        remaining = MAX_OTP_ATTEMPTS - record.attempt_count
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OTP is invalid. Please try again. "
                   f"({remaining} attempt{'s' if remaining != 1 else ''} remaining)",
        )

    # Mark as verified
    record.is_verified = True
    await db.commit()

    logger.info(f"OTP verified successfully for {email}")
    return True


async def is_email_otp_verified(email: str, db: AsyncSession) -> bool:
    """Return True if there is a verified (and recent) OTP record for *email*."""
    now = datetime.utcnow()
    # A verified record must have been created within the last 15 minutes
    cutoff = now - timedelta(minutes=15)
    result = await db.execute(
        select(OTPRecord)
        .where(
            OTPRecord.email == email,
            OTPRecord.is_verified == True,  # noqa: E712
            OTPRecord.created_at >= cutoff,
        )
        .order_by(OTPRecord.created_at.desc())
    )
    return result.scalars().first() is not None


async def cleanup_expired_otps(db: AsyncSession) -> int:
    """Delete all expired OTP records. Returns the number of records deleted."""
    from sqlalchemy import delete

    now = datetime.utcnow()
    result = await db.execute(
        delete(OTPRecord).where(OTPRecord.expires_at < now)
    )
    await db.commit()
    count = result.rowcount
    if count:
        logger.info(f"Cleaned up {count} expired OTP record(s)")
    return count
