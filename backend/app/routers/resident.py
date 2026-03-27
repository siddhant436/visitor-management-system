"""Router for resident operations - Voice-focused"""

import logging
import os
import json
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.resident import Resident
from app.schemas.resident import ResidentCreate, ResidentRead, ResidentLogin
from app.utils.voice import (
    extract_voice_embedding,
    compare_voice_embeddings,
    validate_audio_file
)
from app.services.validation_service import validator, ValidationError
from app.services.rate_limit_service import check_rate_limit
from app.services.sendgrid_otp_service import SendGridOTPService

logger = logging.getLogger(__name__)

# ==================== INITIALIZE SERVICES ====================

settings = get_settings()

if settings.sendgrid_api_key:
    otp_service = SendGridOTPService(
        sendgrid_api_key=settings.sendgrid_api_key,
        from_email=settings.twilio_from_email or "noreply@visitormanagement.com"
    )
    logger.info("✅ SendGrid OTP Service initialized")
else:
    otp_service = None
    logger.warning("⚠️ SendGrid API Key not configured")

# ==================== SCHEMAS ====================

class LoginRequest(BaseModel):
    """Login request"""
    email: str
    password: str


class ResidentCreateSchema(BaseModel):
    """Resident creation"""
    name: str
    email: str
    phone: str
    apartment_no: str
    password: str


# ==================== ROUTER ====================

router = APIRouter(prefix="/residents", tags=["Residents"])

# ==================== REGISTRATION & LOGIN ====================

@router.post("/register", response_model=ResidentRead, status_code=status.HTTP_201_CREATED)
async def register_resident(
    resident: ResidentCreate,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Register a new resident"""
    try:
        client_ip = request.client.host if request else "unknown"
        check_rate_limit("anonymous", "resident_register", client_ip)
        
        logger.info(f"🔐 Registering resident: {resident.email}")
        
        # Check OTP verification
        if otp_service:
            is_email_verified = await otp_service.is_email_verified(db, resident.email)
            if not is_email_verified:
                logger.warning(f"❌ Email not verified: {resident.email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email must be verified with OTP first"
                )
        
        # Validate inputs
        try:
            validated_email = validator.validate_email(resident.email)
            validated_password = validator.validate_password(resident.password)
            validated_name = validator.validate_name(resident.name)
            validated_phone = validator.validate_phone(resident.phone)
            validated_apartment = validator.validate_apartment_number(resident.apartment_no)
        except ValidationError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        
        # Check duplicates
        result = await db.execute(select(Resident).where(Resident.email == validated_email))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create resident
        hashed_password = hash_password(validated_password)
        new_resident = Resident(
            email=validated_email,
            password_hash=hashed_password,
            name=validated_name,
            phone=validated_phone,
            apartment_no=validated_apartment,
            email_verified=True
        )
        db.add(new_resident)
        await db.commit()
        await db.refresh(new_resident)
        
        logger.info(f"✅ Resident registered: {new_resident.id}")
        return new_resident
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error registering resident")


@router.post("/login")
async def login_resident(
    login_data: LoginRequest,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Login a resident"""
    try:
        client_ip = request.client.host if request else "unknown"
        check_rate_limit(login_data.email, "resident_login", client_ip)
        
        logger.info(f"🔐 Login attempt: {login_data.email}")
        
        result = await db.execute(select(Resident).where(Resident.email == login_data.email))
        resident = result.scalars().first()
        
        if not resident or not verify_password(login_data.password, resident.password_hash):
            logger.warning(f"❌ Failed login: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        access_token = create_access_token(
            data={
                "user_id": resident.id,
                "user_type": "resident",
                "email": resident.email
            }
        )
        
        logger.info(f"✅ Resident logged in: {resident.id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": resident.id,
            "name": resident.name,
            "email": resident.email,
            "apartment_no": resident.apartment_no
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during login")


# ==================== VOICE UPLOAD - MAIN FUNCTIONALITY ====================

@router.post("/{resident_id}/upload-voice")
async def upload_voice_sample(
    resident_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and process voice sample for resident.
    
    This endpoint:
    1. Receives voice file upload
    2. Validates audio file
    3. Extracts MFCC voice embedding
    4. Stores embedding in database
    5. Sets voice_registered flag
    """
    temp_file_path = None
    
    try:
        logger.info(f"🎤 Voice upload initiated for resident: {resident_id}")
        
        # ==================== FIND RESIDENT ====================
        
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            logger.error(f"❌ Resident not found: {resident_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resident not found"
            )
        
        logger.info(f"✅ Resident found: {resident.name} (ID: {resident_id})")
        
        # ==================== VALIDATE FILE ====================
        
        if not file or not file.filename:
            logger.error("❌ No file provided")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        logger.info(f"📁 File received: {file.filename}")
        
        allowed_extensions = {'.wav', '.mp3', '.ogg', '.m4a', '.flac', '.aac'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            logger.error(f"❌ Unsupported format: {file_ext}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        logger.info(f"✅ File format supported: {file_ext}")
        
        # ==================== SAVE TEMPORARY FILE ====================
        
        temp_file_path = f"temp_voice_{resident_id}{file_ext}"
        logger.info(f"💾 Saving temporary file: {temp_file_path}")
        
        try:
            contents = await file.read()
            
            if not contents:
                logger.error("❌ Uploaded file is empty")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is empty"
                )
            
            with open(temp_file_path, "wb") as f:
                f.write(contents)
            
            logger.info(f"✅ File saved: {len(contents):,} bytes")
        
        except Exception as save_error:
            logger.error(f"❌ Error saving file: {str(save_error)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to save file"
            )
        
        # ==================== VALIDATE AUDIO ====================
        
        logger.info("🔍 Validating audio file...")
        validation_result = validate_audio_file(temp_file_path)
        
        if not validation_result["valid"]:
            logger.error(f"❌ Audio validation failed: {validation_result['error']}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid audio: {validation_result['error']}"
            )
        
        logger.info(f"✅ Audio validation passed: {validation_result}")
        
        # ==================== EXTRACT EMBEDDING ====================
        
        logger.info("🎵 Extracting voice embedding...")
        embedding = extract_voice_embedding(temp_file_path)
        
        if not embedding:
            logger.error("❌ Failed to extract embedding")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to extract voice features"
            )
        
        logger.info(f"✅ Embedding extracted: {len(embedding)} coefficients")
        
        # ==================== STORE IN DATABASE ====================
        
        logger.info("💾 Storing embedding in database...")
        resident.voice_embedding = json.dumps(embedding)
        resident.voice_registered = True
        resident.updated_at = datetime.utcnow()
        
        db.add(resident)
        await db.commit()
        await db.refresh(resident)
        
        logger.info(f"✅ Voice embedding stored successfully for resident: {resident_id}")
        
        return {
            "status": "success",
            "message": "✅ Voice uploaded and processed successfully",
            "resident_id": resident.id,
            "resident_name": resident.name,
            "voice_registered": resident.voice_registered,
            "embedding_size": len(embedding),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Unexpected error: {str(e)}")
        import traceback
        logger.error("Traceback:")
        for line in traceback.format_exc().split('\n'):
            logger.error(f"   {line}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing voice: {str(e)}"
        )
    
    finally:
        # ==================== CLEANUP ====================
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"🗑️ Temporary file removed: {temp_file_path}")
            except Exception as cleanup_err:
                logger.warning(f"⚠️ Could not delete temp file: {str(cleanup_err)}")


# ==================== VOICE AUTHENTICATION ====================

@router.post("/{resident_id}/authenticate-voice")
async def authenticate_resident_voice(
    resident_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate resident using voice biometric.
    Compares provided voice with registered voice.
    """
    temp_file_path = None
    
    try:
        logger.info(f"🔐 Voice authentication for resident: {resident_id}")
        
        # Find resident
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        if not resident.voice_registered or not resident.voice_embedding:
            logger.warning(f"⚠️ No registered voice for resident {resident_id}")
            raise HTTPException(
                status_code=400,
                detail="Resident has no registered voice"
            )
        
        logger.info(f"✅ Resident found with registered voice")
        
        # Save uploaded file
        file_ext = os.path.splitext(file.filename)[1].lower()
        temp_file_path = f"temp_auth_voice_{resident_id}{file_ext}"
        
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"✅ Authentication audio saved")
        
        # Validate audio
        validation_result = validate_audio_file(temp_file_path)
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid audio: {validation_result['error']}"
            )
        
        # Extract embedding
        logger.info("🎵 Extracting authentication voice embedding...")
        provided_embedding = extract_voice_embedding(temp_file_path)
        
        if not provided_embedding:
            raise HTTPException(
                status_code=400,
                detail="Failed to process authentication voice"
            )
        
        logger.info(f"✅ Authentication embedding extracted")
        
        # Compare
        logger.info("🔍 Comparing voice embeddings...")
        resident_embedding = json.loads(resident.voice_embedding)
        comparison_result = compare_voice_embeddings(resident_embedding, provided_embedding)
        
        similarity = comparison_result['similarity']
        is_match = comparison_result['is_match']
        confidence = comparison_result['confidence']
        
        logger.info(f"📊 Similarity: {similarity:.4f}, Is Match: {is_match}")
        
        if is_match:
            logger.info(f"✅ Voice authentication successful for resident: {resident_id}")
            
            access_token = create_access_token(
                data={
                    "user_id": resident.id,
                    "user_type": "resident",
                    "email": resident.email
                }
            )
            
            return {
                "status": "authenticated",
                "message": "✅ Voice authentication successful",
                "resident_id": resident.id,
                "resident_name": resident.name,
                "apartment_no": resident.apartment_no,
                "similarity_score": similarity,
                "confidence": confidence,
                "access_token": access_token,
                "token_type": "bearer"
            }
        else:
            logger.warning(f"❌ Voice authentication failed: {similarity:.4f} < 0.75")
            
            return {
                "status": "rejected",
                "message": "❌ Voice does not match",
                "resident_id": resident.id,
                "similarity_score": similarity,
                "confidence": confidence,
                "threshold": 0.75
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Authentication error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication error")
    
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass


# ==================== CRUD OPERATIONS ====================

@router.get("/{resident_id}", response_model=ResidentRead)
async def get_resident(
    resident_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get resident by ID"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        return resident
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching resident")


@router.get("/")
async def list_residents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all residents"""
    try:
        logger.info(f"📋 Listing residents (skip={skip}, limit={limit})")
        
        result = await db.execute(
            select(Resident)
            .order_by(Resident.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        residents = result.scalars().all()
        
        logger.info(f"✅ Found {len(residents)} residents")
        
        residents_list = []
        for r in residents:
            try:
                resident_dict = {
                    'id': r.id,
                    'name': r.name,
                    'email': r.email,
                    'phone': r.phone,
                    'apartment_no': r.apartment_no,
                    'email_verified': bool(r.email_verified),
                    'voice_registered': bool(r.voice_registered),
                    'created_at': r.created_at.isoformat() if r.created_at else None,
                    'updated_at': r.updated_at.isoformat() if r.updated_at else None,
                }
                residents_list.append(resident_dict)
            except Exception as item_error:
                logger.error(f"❌ Error converting resident {r.id}: {str(item_error)}")
                continue
        
        return residents_list
    
    except Exception as e:
        logger.error(f"❌ Error listing residents: {str(e)}")
        raise HTTPException(status_code=500, detail="Error listing residents")


@router.put("/{resident_id}", response_model=ResidentRead)
async def update_resident(
    resident_id: int,
    name: str = None,
    phone: str = None,
    apartment_no: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Update resident"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        if name:
            resident.name = validator.validate_name(name)
        if phone:
            resident.phone = validator.validate_phone(phone)
        if apartment_no:
            resident.apartment_no = validator.validate_apartment_number(apartment_no)
        
        resident.updated_at = datetime.utcnow()
        db.add(resident)
        await db.commit()
        await db.refresh(resident)
        
        logger.info(f"✅ Resident updated: {resident_id}")
        return resident
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error updating: {e}")
        raise HTTPException(status_code=500, detail="Error updating resident")


@router.delete("/{resident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resident(
    resident_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete resident"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        await db.delete(resident)
        await db.commit()
        
        logger.info(f"✅ Resident deleted: {resident_id}")
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error deleting: {e}")
        raise HTTPException(status_code=500, detail="Error deleting resident")