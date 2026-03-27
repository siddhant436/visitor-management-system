"""Test voice upload"""

import requests
import os

# Configuration
RESIDENT_ID = 1
API_URL = "http://localhost:8000"
AUDIO_FILE = "C:\Users\USER\Downloads\Recording_resident.mp3"  # Change this to your file path

def upload_voice():
    """Upload voice sample"""
    
    print("=" * 60)
    print("🎤 Voice Upload Test")
    print("=" * 60)
    
    # Check if file exists
    if not os.path.exists(AUDIO_FILE):
        print(f"❌ File not found: {AUDIO_FILE}")
        print("   Please provide a valid audio file path")
        return
    
    file_size = os.path.getsize(AUDIO_FILE)
    print(f"\n📁 File: {AUDIO_FILE}")
    print(f"   Size: {file_size:,} bytes")
    
    # Prepare upload
    print(f"\n🚀 Uploading to /residents/{RESIDENT_ID}/upload-voice...")
    
    try:
        with open(AUDIO_FILE, 'rb') as f:
            files = {
                'file': (AUDIO_FILE, f, 'audio/wav')
            }
            
            response = requests.post(
                f"{API_URL}/residents/{RESIDENT_ID}/upload-voice",
                files=files,
                headers={"accept": "application/json"}
            )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS!")
            print(f"   Message: {result.get('message')}")
            print(f"   Resident: {result.get('resident_name')}")
            print(f"   Voice Registered: {result.get('voice_registered')}")
            print(f"   Embedding Size: {result.get('embedding_size')} coefficients")
            print(f"   Timestamp: {result.get('timestamp')}")
        else:
            print(f"\n❌ ERROR!")
            print(f"   Response: {response.text}")
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    upload_voice()