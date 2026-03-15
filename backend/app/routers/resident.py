"""Router for resident operations"""

import logging
import json
import os
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.resident import Resident
from app.schemas.resident import ResidentCreate, ResidentRead, ResidentLogin
from app.utils.voice import extract_voice_embedding, compare_voice_embeddings
from app.services.validation_service import validator, ValidationError
from app.services.rate_limit_service import check_rate_limit
from app.services.otp_service import request_otp, verify_otp, is_email_otp_verified
from app.services.email_service import send_otp_email

logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    """Login request schema"""
    email: str
    password: str


class OTPRequest(BaseModel):
    """Request body for sending an OTP"""
    email: str


class OTPVerify(BaseModel):
    """Request body for verifying an OTP"""
    email: str
    otp_code: str


router = APIRouter(prefix="/residents", tags=["Residents"])

# ============ OTP ENDPOINTS ============

@router.post("/request-otp", status_code=status.HTTP_200_OK)
async def request_resident_otp(
    body: OTPRequest,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Send a 6-digit OTP to the given email for resident registration verification."""
    try:
        client_ip = request.client.host if request else "unknown"
        check_rate_limit(body.email, "otp_request", client_ip)

        validated_email = validator.validate_email(body.email)

        otp_code = await request_otp(validated_email, db)
        email_sent = await send_otp_email(validated_email, otp_code)

        return {
            "message": "OTP sent to your email address. It expires in 5 minutes.",
            "email_sent": email_sent,
        }

    except HTTPException:
        raise
    except ValidationError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        logger.error(f"Error sending OTP to {body.email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sending OTP. Please try again.",
        )


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_resident_otp(
    body: OTPVerify,
    db: AsyncSession = Depends(get_db)
):
    """Verify the OTP submitted by the user."""
    try:
        validated_email = validator.validate_email(body.email)
        await verify_otp(validated_email, body.otp_code, db)
        return {"message": "OTP verified successfully. You may now complete registration."}

    except HTTPException:
        raise
    except ValidationError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        logger.error(f"Error verifying OTP for {body.email}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying OTP. Please try again.",
        )

# ============ RESIDENT REGISTRATION & LOGIN ============

@router.post("/register", response_model=ResidentRead, status_code=status.HTTP_201_CREATED)
async def register_resident(
    resident: ResidentCreate,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Register a new resident"""
    try:
        # Get client IP
        client_ip = request.client.host if request else "unknown"
        
        # Check rate limit
        check_rate_limit("anonymous", "resident_register", client_ip)
        
        logger.info(f"Registering resident: {resident.email}")
        
        # Validate inputs
        try:
            validated_email = validator.validate_email(resident.email)
            validated_password = validator.validate_password(resident.password)
            validated_name = validator.validate_name(resident.name)
            validated_phone = validator.validate_phone(resident.phone)
            validated_apartment = validator.validate_apartment_number(resident.apartment_no)
        except ValidationError as ve:
            logger.warning(f"Validation error: {ve}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(ve)
            )

        # Require OTP verification before registration
        otp_verified = await is_email_otp_verified(validated_email, db)
        if not otp_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not verified. Please verify your email with OTP before registering."
            )

        # Check if email already exists
        result = await db.execute(select(Resident).where(Resident.email == validated_email))
        if result.scalars().first():
            logger.warning(f"Email already registered: {validated_email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        logger.info("Hashing password...")
        hashed_password = hash_password(validated_password)
        
        # Create resident
        new_resident = Resident(
            email=validated_email,
            password_hash=hashed_password,
            name=validated_name,
            phone=validated_phone,
            apartment_no=validated_apartment,
            email_verified=True,
            otp_verified_email=validated_email,
        )
        db.add(new_resident)
        await db.commit()
        await db.refresh(new_resident)
        
        logger.info(f"✅ Resident registered: {new_resident.id}")
        
        return new_resident
    
    except HTTPException:
        raise
    except ValidationError as ve:
        logger.error(f"❌ Validation error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error registering resident: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registering resident"
        )

@router.post("/login")
async def login_resident(
    login_data: LoginRequest,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Login a resident and return an access token"""
    try:
        # Get client IP
        client_ip = request.client.host if request else "unknown"
        
        # Check rate limit
        check_rate_limit(login_data.email, "resident_login", client_ip)
        
        logger.info(f"Login attempt: {login_data.email}")
        
        # Find resident by email
        result = await db.execute(select(Resident).where(Resident.email == login_data.email))
        resident = result.scalars().first()
        
        if not resident or not verify_password(login_data.password, resident.password_hash):
            logger.warning(f"❌ Failed login attempt for: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
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
        logger.error(f"❌ Error during login: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login"
        )

# ============ RESIDENT CRUD OPERATIONS ============

@router.get("/{resident_id}", response_model=ResidentRead)
async def get_resident(
    resident_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a resident by their ID"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resident not found"
            )
        
        return resident
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching resident: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching resident"
        )

@router.get("/")
async def list_residents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all residents"""
    try:
        logger.info(f"📋 list_residents called with skip={skip}, limit={limit}")
        
        # Execute query
        result = await db.execute(
            select(Resident)
            .order_by(Resident.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        residents = result.scalars().all()
        
        logger.info(f"✅ Found {len(residents)} residents in database")
        
        if not residents:
            logger.warning("⚠️ No residents found in database")
            return []
        
        # Convert to dictionaries for JSON serialization
        residents_list = []
        for r in residents:
            resident_dict = {
                'id': r.id,
                'name': r.name,
                'email': r.email,
                'phone': r.phone,
                'apartment_no': r.apartment_no,
                'voice_registered': getattr(r, 'voice_registered', False),
                'created_at': r.created_at.isoformat() if hasattr(r, 'created_at') and r.created_at else None,
                'updated_at': r.updated_at.isoformat() if hasattr(r, 'updated_at') and r.updated_at else None,
            }
            residents_list.append(resident_dict)
            logger.debug(f"  - Resident: {resident_dict['name']} (apt {resident_dict['apartment_no']})")
        
        logger.info(f"✅ Returning {len(residents_list)} residents")
        return residents_list
        
    except Exception as e:
        logger.error(f"❌ Error listing residents: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing residents: {str(e)}"
        )
@router.put("/{resident_id}", response_model=ResidentRead)
async def update_resident(
    resident_id: int,
    name: str = None,
    phone: str = None,
    apartment_no: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Update a resident's information"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resident not found"
            )
        
        # Validate inputs if provided
        if name:
            try:
                resident.name = validator.validate_name(name)
            except ValidationError as ve:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        
        if phone:
            try:
                resident.phone = validator.validate_phone(phone)
            except ValidationError as ve:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        
        if apartment_no:
            try:
                resident.apartment_no = validator.validate_apartment_number(apartment_no)
            except ValidationError as ve:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        
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
        logger.error(f"❌ Error updating resident: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating resident"
        )

@router.delete("/{resident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resident(
    resident_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a resident by their ID"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resident not found"
            )
        
        await db.delete(resident)
        await db.commit()
        
        logger.info(f"✅ Resident deleted: {resident_id}")
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error deleting resident: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting resident"
        )

# ============ VOICE OPERATIONS ============

@router.post("/{resident_id}/upload-voice")
async def upload_voice_sample(
    resident_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a voice sample for speaker verification"""
    temp_file_path = f"temp_voice_{resident_id}.wav"
    
    try:
        logger.info(f"Uploading voice sample for resident: {resident_id}")
        
        # Find resident
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resident not found"
            )
        
        # Save uploaded file temporarily
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"Extracting voice embedding...")
        
        # Extract voice embedding
        embedding = extract_voice_embedding(temp_file_path)
        
        if not embedding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process voice sample"
            )
        
        # Store voice embedding
        resident.voice_embedding = json.dumps(embedding) if isinstance(embedding, list) else embedding
        resident.voice_registered = 1
        resident.updated_at = datetime.utcnow()
        
        db.add(resident)
        await db.commit()
        await db.refresh(resident)
        
        logger.info(f"✅ Voice sample uploaded for resident: {resident_id}")
        
        return {
            "status": "success",
            "message": "Voice sample uploaded successfully",
            "resident_id": resident.id,
            "voice_registered": resident.voice_registered
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error uploading voice sample: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading voice sample: {str(e)}"
        )
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass

@router.post("/{resident_id}/authenticate-voice")
async def authenticate_resident_voice(
    resident_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate a resident using their voice.
    Compares the provided voice sample with the resident's registered voice.
    """
    temp_file_path = f"temp_auth_voice_{resident_id}.wav"
    
    try:
        logger.info(f"Voice authentication attempt for resident: {resident_id}")
        
        # Step 1: Find resident
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resident not found"
            )
        
        if not resident.voice_registered or not resident.voice_embedding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resident has not registered a voice sample yet"
            )
        
        # Step 2: Save uploaded voice sample temporarily
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        # Step 3: Extract embedding from the voice sample
        logger.info("Extracting voice embedding from provided sample...")
        provided_embedding = extract_voice_embedding(temp_file_path)
        
        if not provided_embedding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process voice sample"
            )
        
        # Step 4: Compare embeddings
        logger.info("Comparing voice embeddings...")
        
        # Parse resident embedding if it's JSON string
        resident_embedding = resident.voice_embedding
        if isinstance(resident_embedding, str):
            try:
                resident_embedding = json.loads(resident_embedding)
            except:
                pass
        
        similarity_score = compare_voice_embeddings(resident_embedding, provided_embedding)
        
        is_authenticated = similarity_score >= 0.75
        
        # Step 5: Return authentication result
        if is_authenticated:
            # Create access token for authenticated resident
            access_token = create_access_token(
                data={
                    "user_id": resident.id,
                    "user_type": "resident",
                    "email": resident.email
                }
            )
            
            logger.info(f"✅ Voice authentication successful for resident: {resident_id}")
            
            return {
                "status": "success",
                "message": "Voice authentication successful",
                "resident_id": resident.id,
                "resident_name": resident.name,
                "apartment_no": resident.apartment_no,
                "similarity_score": round(float(similarity_score), 4),
                "access_token": access_token,
                "token_type": "bearer"
            }
        else:
            logger.warning(f"❌ Voice authentication failed for resident: {resident_id}")
            
            return {
                "status": "failed",
                "message": "Voice authentication failed - voice does not match",
                "resident_id": resident.id,
                "similarity_score": round(float(similarity_score), 4),
                "threshold": 0.75,
                "note": f"Similarity score {round(float(similarity_score), 4)} is below threshold 0.75"
            }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"❌ Error in voice authentication: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing voice authentication: {str(e)}"
        )
    
    finally:
        # Cleanup temporary file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass

@router.post("/{resident_id}/verify-visitor-voice")
async def verify_visitor_voice(
    resident_id: int,
    visitor_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify if a visitor's voice matches a resident's registered voice.
    Used for voice-based visitor verification/authentication.
    """
    temp_file_path = f"temp_visitor_verify_{resident_id}_{visitor_id}.wav"
    
    try:
        logger.info(f"Verifying visitor {visitor_id} voice for resident {resident_id}")
        
        # Step 1: Find resident
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resident not found"
            )
        
        if not resident.voice_registered or not resident.voice_embedding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resident has not registered a voice sample"
            )
        
        # Step 2: Save visitor voice sample temporarily
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        
        # Step 3: Extract embedding from visitor voice
        logger.info("Extracting voice embedding from visitor...")
        visitor_embedding = extract_voice_embedding(temp_file_path)
        
        if not visitor_embedding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process visitor voice sample"
            )
        
        # Step 4: Compare with resident's voice
        logger.info("Comparing visitor voice with resident's registered voice...")
        
        # Parse resident embedding if it's JSON string
        resident_embedding = resident.voice_embedding
        if isinstance(resident_embedding, str):
            try:
                resident_embedding = json.loads(resident_embedding)
            except:
                pass
        
        similarity_score = compare_voice_embeddings(resident_embedding, visitor_embedding)
        
        is_match = similarity_score >= 0.75
        
        logger.info(f"Voice verification result: {'Match' if is_match else 'No Match'} (Score: {similarity_score:.4f})")
        
        # Step 5: Return verification result
        return {
            "status": "match" if is_match else "no_match",
            "resident_id": resident_id,
            "resident_name": resident.name,
            "visitor_id": visitor_id,
            "similarity_score": round(float(similarity_score), 4),
            "threshold": 0.75,
            "is_voice_match": is_match,
            "message": f"Visitor voice {'matches' if is_match else 'does not match'} resident's voice"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"❌ Error in visitor voice verification: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing visitor voice verification: {str(e)}"
        )
    
    finally:
        # Cleanup temporary file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass



# ============ SCHEMAS ============

class ResidentCreate(BaseModel):
    """Resident creation schema"""
    name: str
    email: str
    phone: str
    apartment_no: str
    password: str

# ============ MANAGEMENT ENDPOINTS ============

@router.post("/register")
async def register_resident_admin(
    resident_data: ResidentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new resident (admin endpoint)"""
    try:
        # Check if email already exists
        result = await db.execute(select(Resident).where(Resident.email == resident_data.email))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if phone already exists
        result = await db.execute(select(Resident).where(Resident.phone == resident_data.phone))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Phone already registered")
        
        from app.core.security import hash_password
        
        # Create resident
        resident = Resident(
            name=resident_data.name,
            email=resident_data.email,
            phone=resident_data.phone,
            apartment_no=resident_data.apartment_no,
            password_hash=hash_password(resident_data.password)
        )
        
        db.add(resident)
        await db.commit()
        await db.refresh(resident)
        
        logger.info(f"✅ Resident registered: {resident.id} - {resident.name}")
        
        return {
            'id': resident.id,
            'name': resident.name,
            'email': resident.email,
            'apartment_no': resident.apartment_no
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering resident: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resident_id}")
async def delete_resident(
    resident_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a resident"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        await db.delete(resident)
        await db.commit()
        
        logger.info(f"Deleted resident: {resident_id}")
        
        return {"message": "Resident deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting resident: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{resident_id}")
async def update_resident(
    resident_id: int,
    resident_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Update a resident"""
    try:
        result = await db.execute(select(Resident).where(Resident.id == resident_id))
        resident = result.scalars().first()
        
        if not resident:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        # Update fields
        if 'name' in resident_data:
            resident.name = resident_data['name']
        if 'phone' in resident_data:
            resident.phone = resident_data['phone']
        if 'apartment_no' in resident_data:
            resident.apartment_no = resident_data['apartment_no']
        
        await db.commit()
        await db.refresh(resident)
        
        logger.info(f"Updated resident: {resident_id}")
        
        return resident
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating resident: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))