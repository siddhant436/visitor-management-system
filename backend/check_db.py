"""Check database contents"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.core.database import DATABASE_URL
from app.models.resident import Resident
from app.models.visitor import Visitor
from app.models.admin import Admin

async def check_database():
    """Check what's in the database"""
    
    print(f"\n🔍 Checking database: {DATABASE_URL}\n")
    
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check admins
            print("=" * 60)
            print("📋 CHECKING ADMINS TABLE")
            print("=" * 60)
            result = await session.execute(select(Admin))
            admins = result.scalars().all()
            print(f"✅ Total admins: {len(admins)}")
            if admins:
                for a in admins:
                    print(f"  - ID: {a.id}, Username: {a.username}, Email: {a.email}, Name: {a.full_name}")
            else:
                print("  ⚠️ No admins found")
            
            # Check residents
            print("\n" + "=" * 60)
            print("📋 CHECKING RESIDENTS TABLE")
            print("=" * 60)
            result = await session.execute(select(Resident))
            residents = result.scalars().all()
            print(f"✅ Total residents: {len(residents)}")
            if residents:
                for r in residents:
                    print(f"  - ID: {r.id}")
                    print(f"    Name: {r.name}")
                    print(f"    Email: {r.email}")
                    print(f"    Phone: {r.phone}")
                    print(f"    Apartment: {r.apartment_no}")
                    print(f"    Voice Registered: {getattr(r, 'voice_registered', False)}")
                    print(f"    Created: {r.created_at}")
                    print()
            else:
                print("  ⚠️ No residents found")
            
            # Check visitors
            print("=" * 60)
            print("📋 CHECKING VISITORS TABLE")
            print("=" * 60)
            result = await session.execute(select(Visitor))
            visitors = result.scalars().all()
            print(f"✅ Total visitors: {len(visitors)}")
            if visitors:
                for v in visitors:
                    print(f"  - ID: {v.id}")
                    print(f"    Name: {v.name}")
                    print(f"    Phone: {v.phone}")
                    print(f"    Purpose: {v.purpose}")
                    print(f"    Apartment: {v.apartment_no}")
                    print(f"    Created: {v.created_at}")
                    print()
            else:
                print("  ⚠️ No visitors found")
            
            # Summary
            print("=" * 60)
            print("📊 SUMMARY")
            print("=" * 60)
            print(f"Total Admins: {len(admins)}")
            print(f"Total Residents: {len(residents)}")
            print(f"Total Visitors: {len(visitors)}")
            print("=" * 60 + "\n")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
    
    await engine.dispose()

if __name__ == "__main__":
    print("\n🚀 Starting database check...\n")
    asyncio.run(check_database())
    print("✅ Check complete!")