"""OTP service using Twilio Verify API"""

import logging
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.models.otp import OTP

logger = logging.getLogger(__name__)


class TwilioOTPService:
    """OTP service using Twilio Verify API"""
    
    # Configuration
    OTP_LENGTH = 6
    OTP_EXPIRATION_MINUTES = 5
    MAX_ATTEMPTS = 5
    RATE_LIMIT_MINUTES = 15
    RATE_LIMIT_REQUESTS = 3
    
    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        verify_service_id: str,
        twilio_phone: str = None,
        from_email: str = None
    ):
        """
        Initialize Twilio OTP service
        
        Args:
            account_sid: Twilio Account SID
            auth_token: Twilio Auth Token
            verify_service_id: Twilio Verify Service ID
            twilio_phone: Twilio phone for SMS fallback
            from_email: Email for Email fallback
        """
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.verify_service_id = verify_service_id
        self.twilio_phone = twilio_phone
        self.from_email = from_email
        
        # Initialize Twilio client
        self.client = Client(account_sid, auth_token)
        
        logger.info("✅ Twilio OTP Service initialized")
        logger.info(f"📱 Verify Service ID: {verify_service_id[:10]}...")
    
    async def request_otp(
        self,
        db: AsyncSession,
        email: str,
        method: str = "email"
    ) -> dict:
        """
        Request OTP via Twilio Verify API
        
        Args:
            db: Database session
            email: Email or phone number (depending on method)
            method: 'sms' or 'email'
        
        Returns:
            Dictionary with status and expiration
        """
        try:
            logger.info(f"📧 OTP request via {method} for: {email}")
            
            # Check rate limit
            await self._check_rate_limit(db, email)
            
            # Request OTP via Twilio Verify API
            try:
                verification = self.client.verify.services(self.verify_service_id).verifications.create(
                    to=email,
                    channel=method  # 'sms' or 'email'
                )
                
                logger.info(f"✅ OTP request sent via {method} to {email}")
                logger.info(f"📧 Verification Status: {verification.status}")
                
                # Calculate expiration time (Twilio default is 10 minutes for Verify)
                expires_at = datetime.utcnow() + timedelta(minutes=10)
                
                return {
                    "status": "success",
                    "message": f"OTP sent to {email} via {method.upper()}",
                    "method": method,
                    "expires_at": expires_at,
                    "sid": verification.sid
                }
            
            except TwilioRestException as e:
                logger.error(f"❌ Twilio Error: {e.msg}")
                
                # Handle specific errors
                if "Invalid parameter" in str(e):
                    raise ValueError("Invalid email or phone number format")
                elif "Rate limit" in str(e):
                    raise ValueError("Too many requests. Please try again later.")
                else:
                    raise ValueError(f"Twilio Error: {e.msg}")
        
        except ValueError:
            raise
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
        Verify OTP using Twilio Verify API
        
        Args:
            db: Database session
            email: Email or phone number
            otp_code: OTP code to verify
        
        Returns:
            Dictionary with verification status
        """
        try:
            logger.info(f"🔍 Verifying OTP for: {email}")
            
            # Verify with Twilio Verify API
            try:
                verification_check = self.client.verify.services(self.verify_service_id).verification_checks.create(
                    to=email,
                    code=otp_code.strip()
                )
                
                logger.info(f"🔍 Verification Status: {verification_check.status}")
                
                if verification_check.status == 'approved':
                    logger.info(f"✅ OTP verified successfully for: {email}")
                    
                    # ✅ IMPORTANT: Store verification in database for later checking
                    try:
                        # First, check if there's already a verified OTP for this email
                        result = await db.execute(
                            select(OTP).where(
                                and_(
                                    OTP.email == email,
                                    OTP.is_verified == True
                                )
                            )
                        )
                        existing_otp = result.scalars().first()
                        
                        if existing_otp:
                            # Update existing record
                            existing_otp.is_verified = True
                            existing_otp.updated_at = datetime.utcnow()
                            db.add(existing_otp)
                            logger.info(f"✅ Updated existing OTP record for {email}")
                        else:
                            # Create new verification record
                            new_otp = OTP(
                                email=email,
                                otp_code=otp_code.strip(),
                                expires_at=datetime.utcnow() + timedelta(days=30),  # Valid for 30 days
                                is_verified=True,
                                attempt_count=0
                            )
                            db.add(new_otp)
                            logger.info(f"✅ Created new OTP verification record for {email}")
                        
                        await db.commit()
                        logger.info(f"✅ OTP verification committed to database")
                    
                    except Exception as db_error:
                        logger.error(f"❌ Database error storing verification: {str(db_error)}")
                        await db.rollback()
                        raise ValueError(f"Error storing verification: {str(db_error)}")
                    
                    return {
                        "status": "success",
                        "message": "OTP verified successfully",
                        "verified_identifier": email
                    }
                else:
                    logger.warning(f"❌ OTP verification failed: {verification_check.status}")
                    raise ValueError("Invalid OTP. Please try again.")
            
            except TwilioRestException as e:
                logger.error(f"❌ Twilio Verification Error: {e.msg}")
                
                if "code incorrect" in str(e).lower():
                    raise ValueError("Invalid OTP. Please check and try again.")
                elif "expired" in str(e).lower():
                    raise ValueError("OTP has expired. Please request a new one.")
                elif "not found" in str(e).lower():
                    raise ValueError("No OTP found. Please request a new one.")
                else:
                    raise ValueError(f"Verification Error: {e.msg}")
        
        except ValueError:
            raise
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
            email: Email to check
        
        Returns:
            True if verified, False otherwise
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
            
            if otp:
                logger.info(f"✅ Email {email} is verified in database")
                return True
            else:
                logger.info(f"❌ Email {email} is NOT verified in database")
                return False
        except Exception as e:
            logger.error(f"❌ Error checking verification: {str(e)}")
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
    
    async def _check_rate_limit(self, db: AsyncSession, identifier: str) -> None:
        """
        Check if identifier has exceeded rate limit
        
        Args:
            db: Database session
            identifier: Email or phone
        
        Raises:
            ValueError: If rate limit exceeded
        """
        try:
            cutoff_time = datetime.utcnow() - timedelta(minutes=self.RATE_LIMIT_MINUTES)
            
            result = await db.execute(
                select(OTP).where(
                    and_(
                        OTP.email == identifier,
                        OTP.created_at >= cutoff_time
                    )
                )
            )
            recent_otps = result.scalars().all()
            
            if len(recent_otps) >= self.RATE_LIMIT_REQUESTS:
                logger.warning(f"⚠️ Rate limit exceeded for {identifier}")
                raise ValueError(
                    f"Too many OTP requests. Please wait {self.RATE_LIMIT_MINUTES} minutes before requesting again"
                )
        
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"❌ Error checking rate limit: {str(e)}")
            raise