"""Schemas for Notification model"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationCreate(BaseModel):
    """Schema for creating a notification"""
    resident_id: int
    visitor_name: str
    visitor_phone: str
    purpose: str
    apartment_no: str
    visitor_id: Optional[int] = None
    notification_type: str = "visitor_arrival"

class NotificationRead(BaseModel):
    """Schema for reading notification data"""
    id: int
    resident_id: int
    visitor_name: str
    visitor_phone: str
    purpose: str
    apartment_no: str
    visitor_id: Optional[int]
    is_read: bool
    notification_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    """Schema for updating notification"""
    is_read: Optional[bool] = None