"""Database model for OTP (One-Time Password)"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.core.database import Base


class OTP(Base):
    """OTP model for email verification"""
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=False, index=True, nullable=False)
    otp_code = Column(String(6), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<OTP(id={self.id}, email={self.email}, verified={self.is_verified})>"
    
    def is_expired(self) -> bool:
        """Check if OTP has expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if OTP is still valid (not expired and not verified)"""
        return not self.is_expired() and not self.is_verified