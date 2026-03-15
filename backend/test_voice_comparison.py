"""Script to test voice embedding comparison"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import SessionLocal
from app.models.resident import Resident
from app.utils.voice import compare_voice_embeddings, is_voice_match
import json

async def test_voice_comparison():
    """Test comparing voice embeddings of the same resident"""
    async with SessionLocal() as session:
        # Query the resident
        result = await session.execute(select(Resident).where(Resident.id == 1))
        resident = result.scalars().first()
        
        if not resident or not resident.voice_embedding:
            print("❌ Resident or voice embedding not found")
            return
        
        print(f"🎤 Testing Voice Comparison for {resident.name}")
        print(f"   Resident ID: {resident.id}")
        print(f"   Email: {resident.email}\n")
        
        # Compare the same embedding with itself (should be very similar)
        embedding1 = resident.voice_embedding
        embedding2 = resident.voice_embedding
        
        similarity = compare_voice_embeddings(embedding1, embedding2)
        is_match = is_voice_match(similarity, threshold=0.75)
        
        print(f"✅ Comparing voice embedding with itself:")
        print(f"   Similarity Score: {similarity:.4f}")
        print(f"   Threshold: 0.75")
        print(f"   Is Match: {is_match} {'✅' if is_match else '❌'}")
        
        # Test with a slightly different embedding (simulated)
        import numpy as np
        original = np.array(json.loads(embedding1))
        # Add small noise to simulate a different person
        noisy = original + np.random.normal(0, 0.5, original.shape)
        noisy_embedding = json.dumps(noisy.tolist())
        
        similarity_different = compare_voice_embeddings(embedding1, noisy_embedding)
        is_match_different = is_voice_match(similarity_different, threshold=0.75)
        
        print(f"\n✅ Comparing with slightly different embedding:")
        print(f"   Similarity Score: {similarity_different:.4f}")
        print(f"   Threshold: 0.75")
        print(f"   Is Match: {is_match_different} {'✅' if is_match_different else '❌'}")

# Run the async function
asyncio.run(test_voice_comparison())