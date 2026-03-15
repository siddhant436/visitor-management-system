"""Script to create an admin user"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.database import DATABASE_URL, Base
from app.models.admin import Admin
from app.core.security import hash_password

async def create_admin():
    """Create a new admin user"""
    
    # Create engine
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Create admin
            admin = Admin(
                username="admin",
                email="admin@example.com",
                full_name="System Administrator",
                password_hash=hash_password("Admin@12345"),
                is_active=True
            )
            
            session.add(admin)
            await session.commit()
            
            print(f"✅ Admin created successfully!")
            print(f"   Email: admin@example.com")
            print(f"   Password: Admin@12345")
            print(f"   Username: admin")
        except Exception as e:
            await session.rollback()
            print(f"❌ Error creating admin: {str(e)}")
            import traceback
            traceback.print_exc()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_admin())
    