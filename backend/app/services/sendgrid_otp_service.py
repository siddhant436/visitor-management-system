"""OTP service using SendGrid for direct email sending"""

import logging
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.models.otp import OTP

logger = logging.getLogger(__name__)


class SendGridOTPService:
    """OTP service using SendGrid for email sending"""
    
    # Configuration
    OTP_LENGTH = 6
    OTP_EXPIRATION_MINUTES = 10
    MAX_ATTEMPTS = 5
    RATE_LIMIT_MINUTES = 15
    RATE_LIMIT_REQUESTS = 3
    
    def __init__(
        self,
        sendgrid_api_key: str,
        from_email: str = "noreply@visitormanagement.com"
    ):
        """
        Initialize SendGrid OTP service
        
        Args:
            sendgrid_api_key: SendGrid API Key
            from_email: Email address to send from
        """
        self.sendgrid_api_key = sendgrid_api_key
        self.from_email = from_email
        
        # Validate API Key
        if not sendgrid_api_key or not sendgrid_api_key.startswith('SG.'):
            logger.error("❌ Invalid SendGrid API Key format. Must start with 'SG.'")
            raise ValueError("Invalid SendGrid API Key format")
        
        try:
            self.sg = SendGridAPIClient(sendgrid_api_key)
            logger.info("✅ SendGrid OTP Service initialized")
            logger.info(f"📧 From Email: {from_email}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize SendGrid: {str(e)}")
            raise ValueError(f"Failed to initialize SendGrid: {str(e)}")
    
    async def request_otp(
        self,
        db: AsyncSession,
        email: str
    ) -> dict:
        """
        Request OTP via SendGrid email
        
        Args:
            db: Database session
            email: Email address
        
        Returns:
            Dictionary with status and expiration
        """
        try:
            logger.info(f"📧 OTP request for: {email}")
            
            # Check rate limit
            await self._check_rate_limit(db, email)
            
            # Generate OTP
            otp_code = self._generate_otp()
            expires_at = datetime.utcnow() + timedelta(minutes=self.OTP_EXPIRATION_MINUTES)
            
            logger.info(f"🔐 Generated OTP: {otp_code} for {email}")
            
            # Send email via SendGrid
            try:
                subject = "Your OTP for Visitor Management System"
                html_content = f"""
                <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h1 style="color: #667eea; text-align: center; margin-top: 0;">🔐 Email Verification</h1>
                            <p style="font-size: 16px; color: #333; text-align: center;">
                                Your OTP for Visitor Management System is:
                            </p>
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0;">
                                <h2 style="margin: 0; font-size: 36px; letter-spacing: 3px; font-weight: bold;">{otp_code}</h2>
                            </div>
                            <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0;">
                                ⏱️ This code will expire in <strong>{self.OTP_EXPIRATION_MINUTES} minutes</strong>.
                            </p>
                            <p style="font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                                Do not share this code with anyone.
                            </p>
                            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
                                If you didn't request this code, please ignore this email.
                            </p>
                        </div>
                    </body>
                </html>
                """
                
                logger.info(f"📧 Preparing email message for {email}")
                
                message = Mail(
                    from_email=self.from_email,
                    to_emails=email,
                    subject=subject,
                    html_content=html_content
                )
                
                logger.info(f"📤 Sending email via SendGrid...")
                response = self.sg.send(message)
                
                logger.info(f"✅ Email sent successfully!")
                logger.info(f"📊 Status Code: {response.status_code}")
                
                if response.status_code not in [200, 201, 202]:
                    raise ValueError(f"SendGrid returned status code: {response.status_code}")
                
            except Exception as e:
                logger.error(f"❌ Email Send Error: {str(e)}")
                raise ValueError(f"Failed to send email: {str(e)}")
            
            # Store OTP in database
            try:
                new_otp = OTP(
                    email=email,
                    otp_code=otp_code,
                    expires_at=expires_at,
                    is_verified=False,
                    attempt_count=0
                )
                db.add(new_otp)
                await db.commit()
                logger.info(f"✅ OTP stored in database for {email}")
            except Exception as db_error:
                logger.error(f"❌ Database error: {str(db_error)}")
                await db.rollback()
                raise ValueError(f"Error storing OTP: {str(db_error)}")
            
            return {
                "status": "success",
                "message": f"OTP sent to {email}",
                "method": "email",
                "expires_at": expires_at
            }
        
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
        Verify OTP code
        
        Args:
            db: Database session
            email: Email address
            otp_code: OTP code to verify
        
        Returns:
            Dictionary with verification status
        """
        try:
            logger.info(f"🔍 Verifying OTP for: {email}")
            
            # Find the most recent OTP for this email
            result = await db.execute(
                select(OTP)
                .where(OTP.email == email)
                .order_by(OTP.created_at.desc())
            )
            otp = result.scalars().first()
            
            if not otp:
                logger.warning(f"❌ No OTP found for {email}")
                raise ValueError("No OTP found. Please request a new one.")
            
            # Check if OTP is expired
            if otp.is_expired():
                logger.warning(f"❌ OTP expired for {email}")
                raise ValueError("OTP has expired. Please request a new one.")
            
            # Check if already verified
            if otp.is_verified:
                logger.warning(f"❌ OTP already verified for {email}")
                raise ValueError("OTP has already been verified.")
            
            # Check attempt count
            if otp.attempt_count >= self.MAX_ATTEMPTS:
                logger.warning(f"❌ Max attempts exceeded for {email}")
                raise ValueError("Too many failed attempts. Please request a new OTP.")
            
            # Verify OTP code
            if otp.otp_code != otp_code.strip():
                otp.attempt_count += 1
                db.add(otp)
                await db.commit()
                
                remaining_attempts = self.MAX_ATTEMPTS - otp.attempt_count
                logger.warning(f"❌ Invalid OTP for {email}. Attempts remaining: {remaining_attempts}")
                raise ValueError(f"Invalid OTP. {remaining_attempts} attempts remaining.")
            
            # Mark as verified
            otp.is_verified = True
            otp.updated_at = datetime.utcnow()
            db.add(otp)
            await db.commit()
            
            logger.info(f"✅ OTP verified successfully for {email}")
            
            return {
                "status": "success",
                "message": "OTP verified successfully",
                "verified_identifier": email
            }
        
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
                # Check if not expired
                if not otp.is_expired():
                    logger.info(f"✅ Email {email} is verified and not expired")
                    return True
                else:
                    logger.info(f"⚠️ Email {email} is verified but OTP expired")
                    return False
            else:
                logger.info(f"❌ Email {email} is NOT verified")
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
            identifier: Email
        
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
    
    def _generate_otp(self) -> str:
        """Generate random OTP code"""
        otp_code = ''.join(random.choices(string.digits, k=self.OTP_LENGTH))
        return otp_code