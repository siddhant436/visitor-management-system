"""Resident model"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from datetime import datetime
from app.core.database import Base


class Resident(Base):
    """Resident model"""
    __tablename__ = "residents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=False)
    apartment_no = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Email verification status
    email_verified = Column(Boolean, default=False, nullable=False)  # ✅ ADDED
    
    # Voice authentication
    voice_sample = Column(Text, nullable=True)  # Store audio file path
    voice_embedding = Column(Text, nullable=True)  # Store as JSON string
    voice_registered = Column(Integer, default=0)  # 0 or 1
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Resident(id={self.id}, name={self.name}, email={self.email}, apartment={self.apartment_no}, verified={self.email_verified})>"