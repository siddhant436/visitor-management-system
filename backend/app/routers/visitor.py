"""Router for performing CRUD operations on Visitor model"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy import func, and_
from datetime import datetime
from app.services.validation_service import validator, ValidationError
from app.services.rate_limit_service import check_rate_limit
from fastapi import Request
from app.core.database import SessionLocal
from app.models.visitor import Visitor
from app.models.resident import Resident
from app.schemas.visitor import VisitorCreate, VisitorRead
from app.utils.whisper import transcribe_audio, extract_visitor_info
from app.utils.voice import extract_voice_embedding, compare_voice_embeddings
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)

# Dependency to get the database session
async def get_db():
    async with SessionLocal() as session:
        yield session

router = APIRouter(prefix="/visitors", tags=["Visitors"])

# ============ MANUAL VISITOR CHECK-IN ============

    
@router.post("/", response_model=VisitorRead, status_code=status.HTTP_201_CREATED)
async def create_visitor(
    visitor: VisitorCreate,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new visitor (manual check-in)"""
    try:
        # Get client IP
        client_ip = request.client.host if request else "unknown"
        
        # Check rate limit
        check_rate_limit("anonymous", "visitor_checkin", client_ip)
        
        logger.info(f"Creating visitor: {visitor.name}")
        
        # Validate inputs
        try:
            validated_name = validator.validate_name(visitor.name)
            validated_phone = validator.validate_phone(visitor.phone)
            validated_purpose = validator.validate_purpose(visitor.purpose)
            validated_apartment = validator.validate_apartment_number(visitor.apartment_no)
        except ValidationError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(ve)
            )
        
        new_visitor = Visitor(
            name=validated_name,
            phone=validated_phone,
            purpose=validated_purpose,
            apartment_no=validated_apartment
        )
        db.add(new_visitor)
        await db.commit()
        await db.refresh(new_visitor)
        logger.info(f"✅ Visitor created: {new_visitor.id}")
        
        # Create notification
        try:
            resident_result = await db.execute(
                select(Resident).where(Resident.apartment_no == validated_apartment)
            )
            target_resident = resident_result.scalars().first()
            
            if target_resident:
                notification = await create_notification(
                    db,
                    resident_id=target_resident.id,
                    visitor_name=new_visitor.name,
                    visitor_phone=new_visitor.phone,
                    purpose=new_visitor.purpose,
                    apartment_no=new_visitor.apartment_no,
                    visitor_id=new_visitor.id,
                    notification_type="visitor_arrival"
                )
                logger.info(f"🔔 Notification created")
        except Exception as e:
            logger.error(f"⚠️ Could not create notification: {e}")
        
        return new_visitor
    
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
        logger.error(f"❌ Error creating visitor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating visitor"
        )

@router.get("/")
async def list_visitors(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: AsyncSession = Depends(get_db)
):
    """List all visitors"""
    try:
        logger.info(f"📋 list_visitors called with skip={skip}, limit={limit}, status={status_filter}")
        
        query = select(Visitor).order_by(Visitor.created_at.desc())
        
        if status_filter:
            query = query.where(Visitor.status == status_filter)
        
        result = await db.execute(query.offset(skip).limit(limit))
        visitors = result.scalars().all()
        
        logger.info(f"✅ Found {len(visitors)} visitors in database")
        
        if not visitors:
            logger.warning("⚠️ No visitors found in database")
            return []
        
        # Convert to dictionaries for JSON serialization
        visitors_list = []
        for v in visitors:
            visitor_dict = {
                'id': v.id,
                'name': v.name,
                'phone': v.phone,
                'purpose': v.purpose,
                'apartment_no': v.apartment_no,
                'status': v.status,
                'approval_timestamp': v.approval_timestamp.isoformat() if v.approval_timestamp else None,
                'rejection_reason': v.rejection_reason,
                'created_at': v.created_at.isoformat() if v.created_at else None,
                'updated_at': v.updated_at.isoformat() if v.updated_at else None,
                'is_read': getattr(v, 'is_read', False)
            }
            visitors_list.append(visitor_dict)
            logger.debug(f"  - Visitor: {visitor_dict['name']} (apt {visitor_dict['apartment_no']}) - {visitor_dict['status']}")
        
        logger.info(f"✅ Returning {len(visitors_list)} visitors")
        return visitors_list
        
    except Exception as e:
        logger.error(f"❌ Error listing visitors: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing visitors: {str(e)}"
        )

@router.get("/{visitor_id}", response_model=VisitorRead)
async def get_visitor(visitor_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific visitor by ID"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        if not visitor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")
        return visitor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching visitor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching visitor"
        )

@router.put("/{visitor_id}", response_model=VisitorRead)
async def update_visitor(
    visitor_id: int,
    visitor_update: VisitorCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update a visitor's information"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        
        if not visitor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")
        
        visitor.name = visitor_update.name
        visitor.phone = visitor_update.phone
        visitor.purpose = visitor_update.purpose
        visitor.apartment_no = visitor_update.apartment_no
        visitor.updated_at = datetime.utcnow()
        
        db.add(visitor)
        await db.commit()
        await db.refresh(visitor)
        return visitor
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error updating visitor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating visitor"
        )

@router.delete("/{visitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visitor(visitor_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a visitor by their ID"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        
        if not visitor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found")
        
        await db.delete(visitor)
        await db.commit()
        logger.info(f"✅ Visitor {visitor_id} deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error deleting visitor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting visitor"
        )

# ============ VOICE-BASED VISITOR CHECK-IN ============

@router.post("/voice-checkin")
async def voice_checkin_visitor(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    🎤 Voice-based visitor check-in (NO AUTHENTICATION REQUIRED).
    1. Transcribe audio to text using Whisper
    2. Extract visitor info from transcribed text
    3. Create visitor record
    """
    temp_file_path = "temp_voice_checkin.wav"
    
    try:
        print("\n" + "="*60)
        print("🎤 VOICE CHECK-IN STARTED")
        print("="*60)
        
        # Step 1: Save uploaded audio file temporarily
        print("Step 1: Saving audio file...")
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        print(f"✅ Audio file saved: {len(contents)} bytes")
        
        # Step 2: Transcribe audio to text
        print("Step 2: Transcribing audio with Whisper...")
        transcribed_text = transcribe_audio(temp_file_path)
        
        if not transcribed_text:
            print("❌ Failed to transcribe audio")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to transcribe audio"
            )
        
        print(f"✅ Transcribed text: {transcribed_text}")
        
        # Step 3: Extract visitor information
        print("Step 3: Extracting visitor information...")
        visitor_info = extract_visitor_info(transcribed_text)
        
        print(f"✅ Extracted info: {visitor_info}")
        
        # Step 4: Validate extracted information
        has_all_info = all([
            visitor_info.get("name"), 
            visitor_info.get("phone"), 
            visitor_info.get("purpose"), 
            visitor_info.get("apartment_no")
        ])
        
        if not has_all_info:
            print("⚠️ Partial extraction - some information missing")
            return {
                "status": "partial_success",
                "message": "Some information was missing or unclear",
                "transcribed_text": transcribed_text,
                "extracted_info": visitor_info,
                "note": "Please provide complete information"
            }
        
        # Step 5: Create visitor record in database
        print("Step 5: Creating visitor record in database...")
        new_visitor = Visitor(
            name=visitor_info["name"],
            phone=visitor_info["phone"],
            purpose=visitor_info["purpose"],
            apartment_no=visitor_info["apartment_no"]
        )
        db.add(new_visitor)
        await db.commit()
        await db.refresh(new_visitor)
        
        print(f"✅ Visitor created successfully!")
        print(f"   ID: {new_visitor.id}")
        print(f"   Name: {new_visitor.name}")
        print(f"   Apartment: {new_visitor.apartment_no}")
        
        # Step 6: Create notification for resident
        try:
            target_apt = visitor_info["apartment_no"]
            resident_result = await db.execute(
                select(Resident).where(Resident.apartment_no == target_apt)
            )
            target_resident = resident_result.scalars().first()
            
            if target_resident:
                # Create notification
                notification = await create_notification(
                    db,
                    resident_id=target_resident.id,
                    visitor_name=new_visitor.name,
                    visitor_phone=new_visitor.phone,
                    purpose=new_visitor.purpose,
                    apartment_no=new_visitor.apartment_no,
                    visitor_id=new_visitor.id,
                    notification_type="visitor_arrival"
                )
                print(f"🔔 Notification created for {target_resident.name} about visitor {new_visitor.name}")
            else:
                print(f"⚠️ No resident found for apartment {target_apt}")
        except Exception as e:
            print(f"⚠️ Could not create notification: {e}")
        
        print("="*60 + "\n")
        
        return {
            "status": "success",
            "message": "Visitor checked in successfully via voice",
            "transcribed_text": transcribed_text,
            "extracted_info": visitor_info,
            "visitor_id": new_visitor.id
        }
    
    except HTTPException as e:
        print(f"❌ HTTP Exception: {e.detail}")
        raise e
    except Exception as e:
        print(f"❌ Error in voice check-in: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing voice check-in: {str(e)}"
        )
    
    finally:
        # Cleanup temporary file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"✅ Cleaned up temporary file")
            except:
                pass

# ============ VOICE-BASED GATE ENTRY WITH RESIDENT RECOGNITION ============

@router.post("/voice-gate-entry")
async def voice_gate_entry(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    🎤 Voice-based gate entry with resident recognition.
    
    Flow:
    1. Transcribe voice
    2. Extract visitor information
    3. Check if voice matches any registered resident
    4. If match: Grant entry to resident
    5. If no match: Register as new visitor and notify resident
    """
    temp_file_path = "temp_gate_voice.wav"
    
    try:
        print("\n" + "="*70)
        print("🎤 VOICE GATE ENTRY STARTED")
        print("="*70)
        
        # Step 1: Save uploaded audio file
        print("\nStep 1: Saving audio file...")
        contents = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(contents)
        print(f"✅ Audio file saved: {len(contents)} bytes")
        
        # Step 2: Transcribe audio
        print("\nStep 2: Transcribing audio...")
        transcribed_text = transcribe_audio(temp_file_path)
        
        if not transcribed_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to transcribe audio"
            )
        
        print(f"✅ Transcribed: {transcribed_text}")
        
        # Step 3: Extract visitor information
        print("\nStep 3: Extracting visitor information...")
        visitor_info = extract_visitor_info(transcribed_text)
        print(f"✅ Extracted info: {visitor_info}")
        
        # Step 4: Extract voice embedding for recognition
        print("\nStep 4: Extracting voice embedding...")
        voice_embedding = extract_voice_embedding(temp_file_path)
        if not voice_embedding:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to extract voice embedding"
            )
        print(f"✅ Voice embedding extracted")
        
        # Step 5: Check if voice matches any registered resident
        print("\nStep 5: Checking voice against registered residents...")
        
        result = await db.execute(
            select(Resident).where(Resident.voice_registered == 1)
        )
        registered_residents = result.scalars().all()
        print(f"📋 Found {len(registered_residents)} registered residents with voice")
        
        matched_resident = None
        max_similarity = 0
        
        for resident in registered_residents:
            if resident.voice_embedding:
                try:
                    import json
                    resident_embedding = json.loads(resident.voice_embedding)
                    similarity = compare_voice_embeddings(voice_embedding, resident_embedding)
                    print(f"   - {resident.name} (Apt {resident.apartment_no}): {similarity:.2f}")
                    
                    if similarity > max_similarity:
                        max_similarity = similarity
                        matched_resident = resident
                except Exception as e:
                    print(f"   ❌ Error comparing with {resident.name}: {e}")
                    continue
        
        # Step 6: Make decision based on voice match
        print(f"\n⭐ Best match similarity: {max_similarity:.2f}")
        VOICE_MATCH_THRESHOLD = 0.75
        
        if matched_resident and max_similarity >= VOICE_MATCH_THRESHOLD:
            # MATCH FOUND - Resident recognized
            print(f"\n✅ VOICE MATCH FOUND!")
            print(f"   Resident: {matched_resident.name}")
            print(f"   Apartment: {matched_resident.apartment_no}")
            print(f"   Similarity: {max_similarity:.2f}")
            
            # Update resident's last access time
            matched_resident.updated_at = datetime.utcnow()
            db.add(matched_resident)
            await db.commit()
            
            print("="*70 + "\n")
            
            return {
                "status": "resident_recognized",
                "message": f"Welcome {matched_resident.name}! Entry granted.",
                "entry_type": "resident",
                "resident_id": matched_resident.id,
                "resident_name": matched_resident.name,
                "apartment_no": matched_resident.apartment_no,
                "similarity_score": max_similarity,
                "transcribed_text": transcribed_text
            }
        
        else:
            # NO MATCH - Register as new visitor
            print(f"\n❌ NO VOICE MATCH")
            print(f"   Max similarity: {max_similarity:.2f} (threshold: {VOICE_MATCH_THRESHOLD})")
            print(f"   Registering as new visitor...")
            
            # Validate extracted information
            has_all_info = all([
                visitor_info.get("name"), 
                visitor_info.get("phone"), 
                visitor_info.get("purpose"), 
                visitor_info.get("apartment_no")
            ])
            
            if not has_all_info:
                print("⚠️ Partial extraction - some information missing")
                return {
                    "status": "partial_info",
                    "message": "Could not fully identify visitor. Please provide complete information.",
                    "entry_type": "unknown",
                    "transcribed_text": transcribed_text,
                    "extracted_info": visitor_info,
                    "note": "Name, phone, purpose, and apartment number are required"
                }
            
            # Create visitor record
            print("\n✅ Creating visitor record in database...")
            new_visitor = Visitor(
                name=visitor_info["name"],
                phone=visitor_info["phone"],
                purpose=visitor_info["purpose"],
                apartment_no=visitor_info["apartment_no"]
            )
            db.add(new_visitor)
            await db.commit()
            await db.refresh(new_visitor)
            
            print(f"✅ Visitor created successfully!")
            print(f"   ID: {new_visitor.id}")
            print(f"   Name: {new_visitor.name}")
            print(f"   Apartment: {new_visitor.apartment_no}")
            
            # Notify resident if visiting someone
            try:
                target_apt = visitor_info["apartment_no"]
                resident_result = await db.execute(
                    select(Resident).where(Resident.apartment_no == target_apt)
                )
                target_resident = resident_result.scalars().first()
                
                if target_resident:
                    # Create notification
                    notification = await create_notification(
                        db,
                        resident_id=target_resident.id,
                        visitor_name=new_visitor.name,
                        visitor_phone=new_visitor.phone,
                        purpose=new_visitor.purpose,
                        apartment_no=new_visitor.apartment_no,
                        visitor_id=new_visitor.id,
                        notification_type="visitor_arrival"
                    )
                    print(f"🔔 Notification created for {target_resident.name} about visitor {new_visitor.name}")
            except Exception as e:
                print(f"⚠️ Could not create notification: {e}")
            
            print("="*70 + "\n")
            
            return {
                "status": "new_visitor_registered",
                "message": f"Visitor {visitor_info['name']} registered. Notifying resident.",
                "entry_type": "visitor",
                "visitor_id": new_visitor.id,
                "visitor_name": new_visitor.name,
                "apartment_no": new_visitor.apartment_no,
                "purpose": new_visitor.purpose,
                "transcribed_text": transcribed_text,
                "extracted_info": visitor_info
            }
    
    except HTTPException as e:
        print(f"❌ HTTP Exception: {e.detail}")
        raise e
    except Exception as e:
        print(f"❌ Error in voice gate entry: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing voice gate entry: {str(e)}"
        )
    
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"✅ Cleaned up temporary file")
            except:
                pass

@router.post("/quick-register")
async def quick_register_visitor(
    name: str = Query(...),
    phone: str = Query(...),
    purpose: str = Query(...),
    apartment_no: str = Query(...),
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """
    ⚡ Quick visitor registration (bypass voice processing).
    Used by residents/admins to quickly register known visitors.
    """
    try:
        # Get client IP
        client_ip = request.client.host if request else "unknown"
        
        # Check rate limit
        check_rate_limit("anonymous", "visitor_checkin", client_ip)
        
        logger.info(f"Quick registering visitor: {name}")
        
        # Validate inputs
        try:
            validated_name = validator.validate_name(name)
            validated_phone = validator.validate_phone(phone)
            validated_purpose = validator.validate_purpose(purpose)
            validated_apartment = validator.validate_apartment_number(apartment_no)
        except ValidationError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(ve)
            )
        
        # Create visitor
        new_visitor = Visitor(
            name=validated_name,
            phone=validated_phone,
            purpose=validated_purpose,
            apartment_no=validated_apartment
        )
        db.add(new_visitor)
        await db.commit()
        await db.refresh(new_visitor)
        
        logger.info(f"✅ Quick registered visitor: {new_visitor.id}")
        
        # Create notification for resident
        try:
            resident_result = await db.execute(
                select(Resident).where(Resident.apartment_no == validated_apartment)
            )
            target_resident = resident_result.scalars().first()
            
            if target_resident:
                notification = await create_notification(
                    db,
                    resident_id=target_resident.id,
                    visitor_name=new_visitor.name,
                    visitor_phone=new_visitor.phone,
                    purpose=new_visitor.purpose,
                    apartment_no=new_visitor.apartment_no,
                    visitor_id=new_visitor.id,
                    notification_type="visitor_arrival"
                )
                logger.info(f"🔔 Notification created for {target_resident.name}")
        except Exception as e:
            logger.error(f"⚠️ Could not create notification: {e}")
        
        return {
            "status": "success",
            "message": "Visitor registered successfully",
            "visitor_id": new_visitor.id,
            "visitor_name": new_visitor.name
        }
    
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
        logger.error(f"❌ Error quick registering visitor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registering visitor"
        )
    


# ============ ANALYTICS ENDPOINTS ============

@router.get("/analytics/monthly")
async def get_monthly_analytics(
    year: int = None,
    month: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Get monthly visitor analytics"""
    try:
        if year is None:
            year = datetime.now().year
        if month is None:
            month = datetime.now().month
        
        # Get first and last day of month
        first_day = datetime(year, month, 1)
        if month == 12:
            last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = datetime(year, month + 1, 1) - timedelta(days=1)
        
        logger.info(f"Fetching analytics for {year}-{month:02d}")
        
        # Get all visitors for the month
        result = await db.execute(
            select(Visitor).where(
                and_(
                    Visitor.created_at >= first_day,
                    Visitor.created_at <= last_day
                )
            ).order_by(Visitor.created_at)
        )
        visitors = result.scalars().all()
        
        # Group by day
        daily_data = {}
        for visitor in visitors:
            day = visitor.created_at.day
            if day not in daily_data:
                daily_data[day] = {
                    'date': visitor.created_at.strftime('%Y-%m-%d'),
                    'count': 0,
                    'purposes': {}
                }
            daily_data[day]['count'] += 1
            purpose = visitor.purpose
            daily_data[day]['purposes'][purpose] = daily_data[day]['purposes'].get(purpose, 0) + 1
        
        # Group by purpose
        purpose_data = {}
        for visitor in visitors:
            purpose = visitor.purpose
            if purpose not in purpose_data:
                purpose_data[purpose] = 0
            purpose_data[purpose] += 1
        
        # Group by apartment
        apartment_data = {}
        for visitor in visitors:
            apt = visitor.apartment_no
            if apt not in apartment_data:
                apartment_data[apt] = 0
            apartment_data[apt] += 1
        
        return {
            'month': month,
            'year': year,
            'total_visitors': len(visitors),
            'daily_breakdown': dict(sorted(daily_data.items())),
            'purpose_breakdown': purpose_data,
            'apartment_breakdown': apartment_data,
            'average_daily': len(visitors) / max(len(daily_data), 1)
        }
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/yearly")
async def get_yearly_analytics(
    year: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Get yearly visitor analytics"""
    try:
        if year is None:
            year = datetime.now().year
        
        first_day = datetime(year, 1, 1)
        last_day = datetime(year, 12, 31)
        
        logger.info(f"Fetching yearly analytics for {year}")
        
        result = await db.execute(
            select(Visitor).where(
                and_(
                    Visitor.created_at >= first_day,
                    Visitor.created_at <= last_day
                )
            ).order_by(Visitor.created_at)
        )
        visitors = result.scalars().all()
        
        # Group by month
        monthly_data = {}
        for visitor in visitors:
            month = visitor.created_at.month
            if month not in monthly_data:
                monthly_data[month] = 0
            monthly_data[month] += 1
        
        return {
            'year': year,
            'total_visitors': len(visitors),
            'monthly_breakdown': monthly_data,
            'average_monthly': len(visitors) / 12
        }
    except Exception as e:
        logger.error(f"Error getting yearly analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ MANAGEMENT ENDPOINTS ============

@router.delete("/{visitor_id}")
async def delete_visitor(
    visitor_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a visitor"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        await db.delete(visitor)
        await db.commit()
        
        logger.info(f"Deleted visitor: {visitor_id}")
        
        return {"message": "Visitor deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting visitor: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{visitor_id}/export")
async def export_visitor_data(
    visitor_id: int = None,
    month: int = None,
    year: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Export visitor data to CSV format"""
    try:
        if visitor_id:
            # Export single visitor
            result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
            visitors = [result.scalars().first()]
        else:
            # Export by month/year
            if month is None:
                month = datetime.now().month
            if year is None:
                year = datetime.now().year
            
            first_day = datetime(year, month, 1)
            if month == 12:
                last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                last_day = datetime(year, month + 1, 1) - timedelta(days=1)
            
            result = await db.execute(
                select(Visitor).where(
                    and_(
                        Visitor.created_at >= first_day,
                        Visitor.created_at <= last_day
                    )
                ).order_by(Visitor.created_at)
            )
            visitors = result.scalars().all()
        
        # Convert to CSV
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['ID', 'Name', 'Phone', 'Purpose', 'Apartment', 'Check-in Time', 'Status'])
        
        # Data
        for v in visitors:
            writer.writerow([
                v.id,
                v.name,
                v.phone,
                v.purpose,
                v.apartment_no,
                v.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'Checked In'
            ])
        
        csv_data = output.getvalue()
        
        return {
            'data': csv_data,
            'filename': f"visitors_{year}_{month:02d}.csv",
            'count': len(visitors)
        }
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    


# ============ SCHEMAS ============

class VisitorApproval(BaseModel):
    """Visitor approval schema"""
    status: str  # approved or rejected
    rejection_reason: str = None
    

# ============ APPROVAL ENDPOINTS ============

@router.get("/{visitor_id}")
async def get_visitor_details(
    visitor_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get visitor details"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        return {
            'id': visitor.id,
            'name': visitor.name,
            'phone': visitor.phone,
            'purpose': visitor.purpose,
            'apartment_no': visitor.apartment_no,
            'status': visitor.status,
            'rejection_reason': visitor.rejection_reason,
            'created_at': visitor.created_at.isoformat() if visitor.created_at else None,
            'approval_timestamp': visitor.approval_timestamp.isoformat() if visitor.approval_timestamp else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting visitor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{visitor_id}/approve")
async def approve_visitor(
    visitor_id: int,
    resident_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Approve a visitor"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        visitor.status = "approved"
        visitor.approved_by = resident_id
        visitor.approval_timestamp = datetime.utcnow()
        visitor.rejection_reason = None
        
        await db.commit()
        await db.refresh(visitor)
        
        logger.info(f"✅ Visitor {visitor_id} approved")
        
        return {
            'message': 'Visitor approved',
            'visitor_id': visitor.id,
            'status': visitor.status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving visitor: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{visitor_id}/reject")
async def reject_visitor(
    visitor_id: int,
    resident_id: int = None,
    rejection_reason: str = "Not recognized",
    db: AsyncSession = Depends(get_db)
):
    """Reject a visitor"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        visitor.status = "rejected"
        visitor.approved_by = resident_id
        visitor.approval_timestamp = datetime.utcnow()
        visitor.rejection_reason = rejection_reason
        
        await db.commit()
        await db.refresh(visitor)
        
        logger.info(f"❌ Visitor {visitor_id} rejected: {rejection_reason}")
        
        return {
            'message': 'Visitor rejected',
            'visitor_id': visitor.id,
            'status': visitor.status,
            'rejection_reason': rejection_reason
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting visitor: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/pending")
async def get_pending_visitors(
    apartment_no: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get pending visitors for a resident"""
    try:
        query = select(Visitor).where(Visitor.status == "pending")
        
        if apartment_no:
            query = query.where(Visitor.apartment_no == apartment_no)
        
        result = await db.execute(query.order_by(Visitor.created_at.desc()))
        visitors = result.scalars().all()
        
        logger.info(f"Found {len(visitors)} pending visitors for apt {apartment_no}")
        
        return [
            {
                'id': v.id,
                'name': v.name,
                'phone': v.phone,
                'purpose': v.purpose,
                'apartment_no': v.apartment_no,
                'status': v.status,
                'created_at': v.created_at.isoformat() if v.created_at else None,
            }
            for v in visitors
        ]
    except Exception as e:
        logger.error(f"Error getting pending visitors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/{visitor_id}/grant-entry")
async def grant_entry(
    visitor_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Grant entry to a visitor (admin endpoint)"""
    try:
        result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
        visitor = result.scalars().first()
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        if visitor.status != "approved":
            raise HTTPException(
                status_code=400, 
                detail="Can only grant entry to approved visitors"
            )
        
        visitor.is_read = True
        
        await db.commit()
        await db.refresh(visitor)
        
        logger.info(f"🚪 Entry granted to visitor {visitor_id}: {visitor.name}")
        
        return {
            'message': 'Entry granted successfully',
            'visitor_id': visitor.id,
            'visitor_name': visitor.name,
            'timestamp': datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error granting entry: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))