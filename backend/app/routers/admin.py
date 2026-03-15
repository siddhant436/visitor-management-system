"""Router for admin operations"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.admin import Admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admins", tags=["admins"])

# ============ SCHEMAS ============

class AdminLogin(BaseModel):
    """Admin login request schema"""
    email: str
    password: str


# ============ ENDPOINTS ============

@router.post("/login")
async def login_admin(
    login_data: AdminLogin,
    request: Request = None,
    db: AsyncSession = Depends(get_db)
):
    """Login an admin and return an access token"""
    try:
        # Get client IP
        client_ip = request.client.host if request else "unknown"
        
        logger.info(f"Admin login attempt: {login_data.email} from {client_ip}")
        
        # Find admin by email
        result = await db.execute(select(Admin).where(Admin.email == login_data.email))
        admin = result.scalars().first()
        
        if not admin or not verify_password(login_data.password, admin.password_hash):
            logger.warning(f"❌ Failed admin login attempt for: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token = create_access_token(
            data={
                "user_id": admin.id,
                "user_type": "admin",
                "email": admin.email
            }
        )
        
        logger.info(f"✅ Admin logged in: {admin.id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": admin.id,
            "name": admin.full_name,
            "email": admin.email
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error during admin login: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login"
        )


@router.get("/")
async def list_admins(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """List all admins"""
    try:
        result = await db.execute(select(Admin).offset(skip).limit(limit))
        admins = result.scalars().all()
        return admins
    except Exception as e:
        logger.error(f"❌ Error listing admins: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing admins"
        )


@router.get("/{admin_id}")
async def get_admin(
    admin_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get admin by ID"""
    try:
        result = await db.execute(select(Admin).where(Admin.id == admin_id))
        admin = result.scalars().first()
        
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found"
            )
        
        return admin
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting admin: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting admin"
        )