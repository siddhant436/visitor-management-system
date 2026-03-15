"""Visitor model"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from datetime import datetime
from app.core.database import Base

class Visitor(Base):
    """Visitor model"""
    
    __tablename__ = "visitors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    purpose = Column(String(50), nullable=False)
    apartment_no = Column(String(20), nullable=False, index=True)
    
    # Approval fields
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey("residents.id"), nullable=True)
    approval_timestamp = Column(DateTime, nullable=True)
    rejection_reason = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_read = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<Visitor {self.id}: {self.name} for {self.apartment_no} - {self.status}>"