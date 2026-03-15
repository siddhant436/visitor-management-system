"""Pydantic schemas for the Visitor model"""

from pydantic import BaseModel
from datetime import datetime

class VisitorBase(BaseModel):
    name: str
    phone: str
    purpose: str
    apartment_no: str

class VisitorCreate(VisitorBase):
    """Schema for creating a visitor"""
    pass

class VisitorRead(VisitorBase):
    """Schema for reading visitor details"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Changed from orm_mode to from_attributes