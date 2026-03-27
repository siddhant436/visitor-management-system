"""Service for handling OTP operations"""

import logging
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from app.models.otp import OTP
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class OTPService:
    """Service for OTP operations"""
    
    # Configuration
    OTP_LENGTH = 6
    OTP_EXPIRATION_MINUTES = 5
    MAX_ATTEMPTS = 5
    RATE_LIMIT_MINUTES = 15
    RATE_LIMIT_REQUESTS = 3
    
    def __init__(self, email_service: EmailService):
        """
        Initialize OTP service
        
        Args:
            email_service: Email service instance
        """
        self.email_service = email_service
    
    async def request_otp(
        self,
        db: AsyncSession,
        email: str
    ) -> dict:
        """
        Request OTP for an email address
        
        Args:
            db: Database session
            email: Email address to send OTP to
        
        Returns:
            Dictionary with status and message
        
        Raises:
            Exception: If rate limit exceeded or other errors
        """
        try:
            logger.info(f"📧 OTP request for: {email}")
            
            # Check rate limit
            await self._check_rate_limit(db, email)
            
            # Generate OTP
            otp_code = self._generate_otp()
            expires_at = datetime.utcnow() + timedelta(minutes=self.OTP_EXPIRATION_MINUTES)
            
            # Create OTP record
            new_otp = OTP(
                email=email,
                otp_code=otp_code,
                expires_at=expires_at,
                is_verified=False,
                attempt_count=0
            )
            
            db.add(new_otp)
            await db.commit()
            await db.refresh(new_otp)
            
            # Send email
            email_sent = self.email_service.send_otp_email(
                recipient_email=email,
                otp_code=otp_code,
                expires_in_minutes=self.OTP_EXPIRATION_MINUTES
            )
            
            if not email_sent:
                logger.warning("⚠️ OTP generated but email send failed")
                # Still return success as OTP is generated
            
            logger.info(f"✅ OTP sent to {email}")
            
            return {
                "status": "success",
                "message": f"OTP sent to {email}",
                "expires_at": expires_at
            }
        
        except Exception as e:
            logger.error(f"❌ Error requesting OTP: {str(e)}")
            raise
    
    async def verify_otp(
        self,
        db: AsyncSession,
        email: str,
        otp_code: str
    ) -> dict:
        """
        Verify OTP for an email address
        
        Args:
            db: Database session
            email: Email address
            otp_code: OTP code to verify
        
        Returns:
            Dictionary with status and message
        
        Raises:
            Exception: If OTP is invalid, expired, or other errors
        """
        try:
            logger.info(f"🔍 Verifying OTP for: {email}")
            
            # Get the latest OTP for this email
            result = await db.execute(
                select(OTP)
                .where(OTP.email == email)
                .order_by(OTP.created_at.desc())
            )
            otp = result.scalars().first()
            
            if not otp:
                logger.warning(f"❌ No OTP found for {email}")
                raise ValueError("No OTP found for this email")
            
            # Check if OTP is expired
            if otp.is_expired():
                logger.warning(f"❌ OTP expired for {email}")
                raise ValueError("OTP has expired. Please request a new one")
            
            # Check if already verified
            if otp.is_verified:
                logger.warning(f"❌ OTP already verified for {email}")
                raise ValueError("OTP has already been verified")
            
            # Check attempt count
            if otp.attempt_count >= self.MAX_ATTEMPTS:
                logger.warning(f"❌ Max attempts exceeded for {email}")
                raise ValueError("Too many failed attempts. Please request a new OTP")
            
            # Verify OTP code
            if otp.otp_code != otp_code.strip():
                otp.attempt_count += 1
                db.add(otp)
                await db.commit()
                
                remaining_attempts = self.MAX_ATTEMPTS - otp.attempt_count
                logger.warning(f"❌ Invalid OTP for {email}. Attempts remaining: {remaining_attempts}")
                raise ValueError(f"Invalid OTP. {remaining_attempts} attempts remaining")
            
            # Mark as verified
            otp.is_verified = True
            db.add(otp)
            await db.commit()
            
            logger.info(f"✅ OTP verified for {email}")
            
            return {
                "status": "success",
                "message": "OTP verified successfully",
                "verified_email": email
            }
        
        except Exception as e:
            logger.error(f"❌ Error verifying OTP: {str(e)}")
            raise
    
    async def is_email_verified(
        self,
        db: AsyncSession,
        email: str
    ) -> bool:
        """
        Check if email has been verified with OTP
        
        Args:
            db: Database session
            email: Email address to check
        
        Returns:
            True if email is verified, False otherwise
        """
        try:
            result = await db.execute(
                select(OTP)
                .where(
                    and_(
                        OTP.email == email,
                        OTP.is_verified == True
                    )
                )
                .order_by(OTP.created_at.desc())
            )
            otp = result.scalars().first()
            return otp is not None
        except Exception as e:
            logger.error(f"❌ Error checking email verification: {str(e)}")
            return False
    
    async def cleanup_expired_otps(self, db: AsyncSession) -> int:
        """
        Delete expired OTP records
        
        Args:
            db: Database session
        
        Returns:
            Number of OTPs deleted
        """
        try:
            result = await db.execute(
                select(OTP).where(OTP.expires_at < datetime.utcnow())
            )
            expired_otps = result.scalars().all()
            
            for otp in expired_otps:
                await db.delete(otp)
            
            await db.commit()
            logger.info(f"🗑️ Deleted {len(expired_otps)} expired OTPs")
            return len(expired_otps)
        
        except Exception as e:
            logger.error(f"❌ Error cleaning up expired OTPs: {str(e)}")
            return 0
    
    def _generate_otp(self) -> str:
        """
        Generate a random OTP code
        
        Returns:
            Random OTP code as string
        """
        otp_code = ''.join(random.choices(string.digits, k=self.OTP_LENGTH))
        logger.debug(f"Generated OTP: {otp_code}")
        return otp_code
    
    async def _check_rate_limit(self, db: AsyncSession, email: str) -> None:
        """
        Check if email has exceeded rate limit for OTP requests
        
        Args:
            db: Database session
            email: Email address to check
        
        Raises:
            ValueError: If rate limit exceeded
        """
        try:
            # Get OTPs from last RATE_LIMIT_MINUTES
            cutoff_time = datetime.utcnow() - timedelta(minutes=self.RATE_LIMIT_MINUTES)
            
            result = await db.execute(
                select(OTP).where(
                    and_(
                        OTP.email == email,
                        OTP.created_at >= cutoff_time
                    )
                )
            )
            recent_otps = result.scalars().all()
            
            if len(recent_otps) >= self.RATE_LIMIT_REQUESTS:
                logger.warning(f"⚠️ Rate limit exceeded for {email}")
                raise ValueError(
                    f"Too many OTP requests. Please wait {self.RATE_LIMIT_MINUTES} minutes before requesting again"
                )
        
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"❌ Error checking rate limit: {str(e)}")
            raise