"""Pydantic schemas for the Resident model"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


from pydantic import BaseModel

class ResidentLogin(BaseModel):
    """Schema for resident login"""
    email: str
    password: str
class ResidentBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    apartment_no: str

class ResidentCreate(ResidentBase):
    """Schema for creating a resident"""
    password: str

class ResidentUpdate(BaseModel):
    """Schema for updating a resident"""
    name: Optional[str] = None
    phone: Optional[str] = None

class ResidentRead(ResidentBase):
    """Schema for reading resident details"""
    id: int
    voice_registered: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Changed from orm_mode to from_attributes

