"""Router for OTP operations using SendGrid"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.config import get_settings
from app.services.sendgrid_otp_service import SendGridOTPService
from app.services.rate_limit_service import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/otp", tags=["OTP"])

# Get settings
settings = get_settings()

# Initialize SendGrid OTP service
if settings.sendgrid_api_key:
    sendgrid_otp_service = SendGridOTPService(
        sendgrid_api_key=settings.sendgrid_api_key,
        from_email=settings.twilio_from_email or "noreply@visitormanagement.com"
    )
    logger.info("✅ SendGrid OTP Service initialized successfully")
else:
    logger.warning("⚠️ SendGrid API Key not configured - OTP verification will not work")
    sendgrid_otp_service = None


# ============ SCHEMAS ============

class OTPRequest(BaseModel):
    """OTP request schema"""
    email: EmailStr


class OTPVerify(BaseModel):
    """OTP verification schema"""
    email: EmailStr
    otp_code: str


class OTPResponse(BaseModel):
    """OTP response schema"""
    email: str
    message: str
    expires_at: str = None


# ============ ENDPOINTS ============

@router.post("/request", response_model=OTPResponse, status_code=status.HTTP_200_OK)
async def request_otp(
    otp_request: OTPRequest,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Request OTP for email verification
    
    Sends OTP via SendGrid email
    
    Args:
        otp_request: Request body with email
        request: HTTP request object for rate limiting
        db: Database session
    
    Returns:
        OTPResponse with message and expiration time
    """
    try:
        # Check if SendGrid is configured
        if not sendgrid_otp_service:
            logger.error("❌ SendGrid service not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OTP service not configured. Please contact support."
            )
        
        # Get client IP for rate limiting
        client_ip = request.client.host if request else "unknown"
        
        # Check general rate limit
        check_rate_limit(otp_request.email, "otp_request", client_ip)
        
        logger.info(f"📧 OTP request received for: {otp_request.email}")
        
        # Request OTP via SendGrid
        result = await sendgrid_otp_service.request_otp(
            db,
            otp_request.email
        )
        
        logger.info(f"✅ OTP request successful for: {otp_request.email}")
        
        return OTPResponse(
            email=otp_request.email,
            message=result["message"],
            expires_at=result["expires_at"].isoformat() if result.get("expires_at") else None
        )
    
    except ValueError as ve:
        logger.warning(f"❌ Validation error: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"❌ Error requesting OTP: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sending OTP. Please try again."
        )


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_otp(
    otp_verify: OTPVerify,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP code
    
    Validates OTP using database
    
    Args:
        otp_verify: Request body with email and OTP code
        request: HTTP request object for rate limiting
        db: Database session
    
    Returns:
        Dictionary with verification status
    """
    try:
        # Check if SendGrid is configured
        if not sendgrid_otp_service:
            logger.error("❌ SendGrid service not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OTP service not configured. Please contact support."
            )
        
        # Get client IP for rate limiting
        client_ip = request.client.host if request else "unknown"
        
        # Check rate limit for verification attempts
        check_rate_limit(otp_verify.email, "otp_verify", client_ip)
        
        logger.info(f"🔍 OTP verification attempt for: {otp_verify.email}")
        logger.info(f"📧 Email: {otp_verify.email}")
        logger.info(f"🔐 OTP Code: {otp_verify.otp_code}")
        
        # Verify OTP
        result = await sendgrid_otp_service.verify_otp(
            db,
            otp_verify.email,
            otp_verify.otp_code
        )
        
        logger.info(f"✅ OTP verification successful for: {otp_verify.email}")
        
        # Verify it was stored in database
        is_verified = await sendgrid_otp_service.is_email_verified(db, otp_verify.email)
        logger.info(f"✅ Database verification check: {is_verified}")
        
        return {
            "status": "success",
            "message": result["message"],
            "verified_email": result["verified_identifier"],
            "is_stored": is_verified
        }
    
    except ValueError as ve:
        logger.warning(f"❌ Verification error: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"❌ Error verifying OTP: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying OTP. Please try again."
        )


@router.post("/check-verification")
async def check_email_verification(
    otp_request: OTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if an email has been verified with OTP
    
    Args:
        otp_request: Request body with email
        db: Database session
    
    Returns:
        Dictionary with verification status
    """
    try:
        # Check if SendGrid is configured
        if not sendgrid_otp_service:
            logger.error("❌ SendGrid service not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OTP service not configured. Please contact support."
            )
        
        logger.info(f"🔍 Checking verification status for: {otp_request.email}")
        
        is_verified = await sendgrid_otp_service.is_email_verified(db, otp_request.email)
        
        return {
            "email": otp_request.email,
            "is_verified": is_verified
        }
    
    except Exception as e:
        logger.error(f"❌ Error checking verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking verification status"
        )