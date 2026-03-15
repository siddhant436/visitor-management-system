# """Whisper API utilities for speech-to-text conversion"""

# import whisper
# from openai import OpenAI
# from app.core.config import get_settings
# import json
# import os

# settings = get_settings()

# # Try to use local Whisper first, fallback to API
# USE_LOCAL_WHISPER = True

# if not USE_LOCAL_WHISPER:
#     client = OpenAI(api_key=settings.OPENAI_API_KEY)

# # Load Whisper model (downloads on first use, ~140MB)
# try:
#     whisper_model = whisper.load_model("base")
#     print("✅ Local Whisper model loaded")
# except Exception as e:
#     print(f"⚠️ Failed to load local Whisper: {e}")
#     whisper_model = None

# def transcribe_audio(audio_file_path: str) -> str:
#     """
#     Transcribe audio file to text using local Whisper or OpenAI API.
    
#     Args:
#         audio_file_path: Path to the audio file (WAV, MP3, etc.)
    
#     Returns:
#         Transcribed text
#     """
#     try:
#         # Try local Whisper first
#         if whisper_model:
#             print("Using local Whisper for transcription...")
#             result = whisper_model.transcribe(audio_file_path, language="en")
#             return result["text"]
        
#         # Fallback to OpenAI API
#         print("Using OpenAI API for transcription...")
#         with open(audio_file_path, 'rb') as audio_file:
#             transcript = client.audio.transcriptions.create(
#                 model="whisper-1",
#                 file=audio_file,
#                 language="en"
#             )
#         return transcript.text
    
#     except Exception as e:
#         print(f"Error transcribing audio: {e}")
#         return None

# def extract_visitor_info(transcribed_text: str) -> dict:
#     """
#     Extract visitor information from transcribed text using ChatGPT.
    
#     Args:
#         transcribed_text: The transcribed visitor introduction
    
#     Returns:
#         Dictionary with extracted visitor info
#     """
#     try:
#         # Check if we have OpenAI API key
#         if not settings.OPENAI_API_KEY:
#             print("⚠️ OpenAI API key not configured. Using basic extraction.")
#             return basic_extract_visitor_info(transcribed_text)
        
#         client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
#         response = client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": """You are a helpful assistant that extracts visitor information from spoken introductions.
#                     Extract the following information if present: name, phone number, purpose of visit, and apartment/suite number.
#                     Return the response as JSON with keys: name, phone, purpose, apartment_no.
#                     If any information is missing, use null for that field."""
#                 },
#                 {
#                     "role": "user",
#                     "content": f"Extract visitor information from this text: {transcribed_text}"
#                 }
#             ]
#         )
        
#         # Parse the response
#         content = response.choices[0].message.content
        
#         # Try to extract JSON from response
#         try:
#             start = content.find('{')
#             end = content.rfind('}') + 1
#             if start != -1 and end != 0:
#                 json_str = content[start:end]
#                 return json.loads(json_str)
#         except:
#             pass
        
#         return {
#             "name": None,
#             "phone": None,
#             "purpose": None,
#             "apartment_no": None,
#             "raw_text": transcribed_text
#         }
    
#     except Exception as e:
#         print(f"Error extracting visitor info with GPT: {e}")
#         # Fallback to basic extraction
#         return basic_extract_visitor_info(transcribed_text)

# def basic_extract_visitor_info(transcribed_text: str) -> dict:
#     """
#     Basic visitor info extraction using pattern matching (no API needed).
#     Fallback when ChatGPT is unavailable.
#     """
#     import re
    
#     text = transcribed_text.lower()
    
#     # Try to extract name (usually after "name is" or "I'm")
#     name_match = re.search(r'(?:name is |my name is |i\'m |i am )([a-z\s]+?)(?:,|my|phone|and|\.|$)', text)
#     name = name_match.group(1).strip().title() if name_match else None
    
#     # Try to extract phone (10 digits)
#     phone_match = re.search(r'\b(\d{10}|\d{3}[-\s]?\d{3}[-\s]?\d{4})\b', text)
#     phone = phone_match.group(1) if phone_match else None
    
#     # Try to extract apartment (usually "apartment" or "apt" followed by number)
#     apt_match = re.search(r'(?:apartment|apt|suite|room|unit)\s*#?(\d+[a-z]?)', text)
#     apartment_no = apt_match.group(1) if apt_match else None
    
#     # Try to extract purpose (common visit reasons)
#     purpose = None
#     purposes = ['delivery', 'meeting', 'visit', 'pickup', 'appointment', 'interview', 'inspection']
#     for p in purposes:
#         if p in text:
#             purpose = p
#             break
    
#     return {
#         "name": name,
#         "phone": phone,
#         "purpose": purpose,
#         "apartment_no": apartment_no,
#         "raw_text": transcribed_text,
#         "extraction_method": "basic_pattern_matching"
#     }




"""Whisper API utilities for speech-to-text conversion"""

import whisper
from openai import OpenAI
from app.core.config import get_settings
import json
import re
from app.utils.voice import extract_voice_embedding
settings = get_settings()

# Try to use local Whisper first
whisper_model = None

try:
    whisper_model = whisper.load_model("base")
    print("✅ Local Whisper model loaded")
except Exception as e:
    print(f"⚠️ Failed to load local Whisper: {e}")

def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribe audio file to text using local Whisper or OpenAI API.
    
    Args:
        audio_file_path: Path to the audio file (WAV, MP3, etc.)
    
    Returns:
        Transcribed text
    """
    try:
        # Try local Whisper first
        if whisper_model:
            print("Using local Whisper for transcription...")
            result = whisper_model.transcribe(audio_file_path, language="en")
            return result["text"]
        
        # Fallback to OpenAI API
        print("Using OpenAI API for transcription...")
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        with open(audio_file_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
        return transcript.text
    
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return None

def extract_visitor_info(transcribed_text: str) -> dict:
    """
    Extract visitor information from transcribed text.
    First tries ChatGPT, then falls back to pattern matching.
    
    Args:
        transcribed_text: The transcribed visitor introduction
    
    Returns:
        Dictionary with extracted visitor info
    """
    try:
        # Check if we have OpenAI API key
        if settings.OPENAI_API_KEY:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a helpful assistant that extracts visitor information from spoken introductions.
                        Extract the following information if present: name, phone number, purpose of visit, and apartment/suite number.
                        Return ONLY a valid JSON object with keys: name, phone, purpose, apartment_no.
                        If any information is missing, use null for that field.
                        Example: {"name": "John Doe", "phone": "1234567890", "purpose": "meeting", "apartment_no": "301"}"""
                    },
                    {
                        "role": "user",
                        "content": f"Extract visitor information from this text: {transcribed_text}"
                    }
                ]
            )
            
            # Parse the response
            content = response.choices[0].message.content
            print(f"GPT Response: {content}")
            
            # Try to extract JSON from response
            try:
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1 and end != 0:
                    json_str = content[start:end]
                    extracted = json.loads(json_str)
                    # Clean up the extracted data
                    return {
                        "name": extracted.get("name"),
                        "phone": extracted.get("phone"),
                        "purpose": extracted.get("purpose"),
                        "apartment_no": extracted.get("apartment_no"),
                        "raw_text": transcribed_text
                    }
            except json.JSONDecodeError:
                print("Failed to parse JSON from GPT response, using pattern matching...")
                return basic_extract_visitor_info(transcribed_text)
        
        # No API key, use pattern matching
        return basic_extract_visitor_info(transcribed_text)
    
    except Exception as e:
        print(f"Error extracting visitor info with GPT: {e}")
        return basic_extract_visitor_info(transcribed_text)

def basic_extract_visitor_info(transcribed_text: str) -> dict:
    """
    Basic visitor info extraction using pattern matching (no API needed).
    Fallback when ChatGPT is unavailable.
    """
    text = transcribed_text.lower()
    
    # Try to extract name (usually after "name is" or "I'm")
    name_match = re.search(r'(?:name\s+is\s+|my\s+name\s+is\s+|i\'m\s+|i\s+am\s+)([a-z\s]+?)(?:,|my|phone|and|apartment|\.|$)', text)
    name = name_match.group(1).strip().title() if name_match else None
    
    # Try to extract phone (10 digits)
    phone_match = re.search(r'\b(\d{10}|\d{3}[-\s]?\d{3}[-\s]?\d{4})\b', text)
    phone = phone_match.group(1) if phone_match else None
    
    # Try to extract apartment (usually "apartment" or "apt" followed by number)
    apt_match = re.search(r'(?:apartment|apt|suite|room|unit)\s*#?(\d+[a-z]?)', text)
    apartment_no = apt_match.group(1) if apt_match else None
    
    # Try to extract purpose (common visit reasons)
    purpose = None
    purposes = ['delivery', 'meeting', 'visit', 'pickup', 'appointment', 'interview', 'inspection', 'maintenance']
    for p in purposes:
        if p in text:
            purpose = p
            break
    
    return {
        "name": name,
        "phone": phone,
        "purpose": purpose,
        "apartment_no": apartment_no,
        "raw_text": transcribed_text,
        "extraction_method": "pattern_matching"
    }