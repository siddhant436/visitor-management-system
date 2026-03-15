"""Database model for residents"""

from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
from datetime import datetime
from app.core.database import Base

class Resident(Base):
    __tablename__ = "residents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    apartment_no = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Voice-related fields
    voice_sample = Column(LargeBinary, nullable=True)
    voice_embedding = Column(String, nullable=True)
    voice_registered = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)