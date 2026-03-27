"""Schemas for OTP operations"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class OTPRequest(BaseModel):
    """Schema for requesting OTP"""
    email: EmailStr


class OTPVerify(BaseModel):
    """Schema for verifying OTP"""
    email: EmailStr
    otp_code: str


class OTPResponse(BaseModel):
    """Schema for OTP response"""
    email: str
    message: str
    expires_at: datetime
    
    class Config:
        from_attributes = True


class OTPCreate(BaseModel):
    """Schema for creating OTP in database"""
    email: str
    otp_code: str
    expires_at: datetime