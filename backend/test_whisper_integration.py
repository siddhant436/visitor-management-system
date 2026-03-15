"""Test Whisper API integration for voice-to-text and info extraction"""

import requests
import numpy as np
import soundfile as sf
import json

def create_sample_audio(filename: str = "visitor_intro.wav"):
    """
    Create a sample audio file.
    For real testing, you should record your own voice saying:
    "Hi, my name is John Doe, my phone is 1234567890, I'm here for a meeting at apartment 301"
    """
    print("🎤 Creating sample audio file...")
    
    # Generate a simple sine wave (for testing)
    sample_rate = 16000
    duration = 3.0
    frequency = 440
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = 0.5 * np.sin(2 * np.pi * frequency * t)
    
    sf.write(filename, audio, sample_rate)
    print(f"✅ Sample audio created: {filename}")
    return filename

def test_voice_checkin(audio_file: str):
    """Test the voice check-in endpoint"""
    print("\n🎯 Testing Voice Check-In Endpoint...")
    
    url = "http://localhost:8000/visitors/voice-checkin"
    
    with open(audio_file, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
    
    print(f"\n📊 Response Status: {response.status_code}")
    
    try:
        result = response.json()
        print(f"📝 Response Body:")
        print(json.dumps(result, indent=2))
        return result
    except:
        print(f"❌ Error: {response.text}")
        return None

def main():
    print("=" * 60)
    print("🎤 Whisper API Integration Test")
    print("=" * 60)
    
    # Step 1: Create sample audio
    audio_file = create_sample_audio("visitor_intro.wav")
    
    # Step 2: Test voice check-in
    result = test_voice_checkin(audio_file)
    
    if result:
        if result.get("status") == "success":
            print("\n✅ Voice check-in successful!")
            print(f"   Visitor ID: {result.get('visitor_id')}")
            print(f"   Name: {result.get('extracted_info', {}).get('name')}")
            print(f"   Phone: {result.get('extracted_info', {}).get('phone')}")
            print(f"   Purpose: {result.get('extracted_info', {}).get('purpose')}")
            print(f"   Apartment: {result.get('extracted_info', {}).get('apartment_no')}")
        elif result.get("status") == "partial_success":
            print("\n⚠️ Partial Success - Some information was missing")
            print(f"   Transcribed: {result.get('transcribed_text')}")
            print(f"   Extracted: {json.dumps(result.get('extracted_info'), indent=2)}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()