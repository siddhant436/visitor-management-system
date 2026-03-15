"""Notification model for database"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=False, index=True)
    visitor_name = Column(String, nullable=False)
    visitor_phone = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    apartment_no = Column(String, nullable=False)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=True)
    
    # Notification status
    is_read = Column(Boolean, default=False)
    notification_type = Column(String, default="visitor_arrival")  # visitor_arrival, entry_granted, etc.
    
    # Resident relationship
    resident = relationship("Resident", backref="notifications")
    visitor = relationship("Visitor", backref="notifications")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Notification(id={self.id}, resident_id={self.resident_id}, visitor_name={self.visitor_name})>"