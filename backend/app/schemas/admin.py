"""Admin schemas"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AdminBase(BaseModel):
    """Base admin schema"""
    username: str
    email: str
    full_name: str

class AdminCreate(AdminBase):
    """Admin creation schema"""
    password: str

class AdminRead(AdminBase):
    """Admin read schema"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True