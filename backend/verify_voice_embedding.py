"""Script to verify voice embedding extraction and storage"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import SessionLocal
from app.models.resident import Resident
import json

async def verify_embedding():
    """Verify that voice embedding is stored in the database"""
    async with SessionLocal() as session:
        # Query the resident
        result = await session.execute(select(Resident).where(Resident.id == 1))
        resident = result.scalars().first()
        
        if not resident:
            print("❌ Resident not found")
            return
        
        print(f"✅ Resident Found: {resident.name}")
        print(f"   Email: {resident.email}")
        print(f"   Voice Registered: {resident.voice_registered}")
        print(f"   Voice Sample Size: {len(resident.voice_sample)} bytes" if resident.voice_sample else "   Voice Sample: None")
        
        if resident.voice_embedding:
            embedding = json.loads(resident.voice_embedding)
            print(f"\n✅ Voice Embedding Extracted Successfully!")
            print(f"   Embedding Length: {len(embedding)}")
            print(f"   Embedding Values (first 5): {embedding[:5]}")
            print(f"   Full Embedding:\n   {embedding}")
        else:
            print("\n❌ Voice Embedding NOT found in database")

# Run the async function
asyncio.run(verify_embedding())