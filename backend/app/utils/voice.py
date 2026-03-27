"""
Voice Processing Utilities - Complete Implementation
Handles MFCC extraction, voice embedding, and voice matching
"""

import os
import sys
import logging
from pathlib import Path
from typing import Optional, List, Union
import json
import numpy as np

# ==================== SETUP LOGGING ====================
logger = logging.getLogger(__name__)

# ==================== CONSTANTS ====================
SAMPLE_RATE = 16000
N_MFCC = 13
N_FFT = 2048
HOP_LENGTH = 512
VOICE_MATCH_THRESHOLD = 0.75
MIN_AUDIO_DURATION = 1.0
MAX_AUDIO_DURATION = 60.0

# ==================== ENVIRONMENT CONFIGURATION ====================

# Disable numba JIT to avoid pkg_resources issues
os.environ['NUMBA_DISABLE_JIT'] = '1'

# Ensure setuptools is available
try:
    import setuptools
    import pkg_resources
    logger.debug("✅ pkg_resources available")
except ImportError:
    logger.warning("⚠️ pkg_resources not available, attempting to install...")
    try:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "setuptools", "--quiet"])
        logger.info("✅ setuptools installed")
    except Exception as e:
        logger.error(f"❌ Failed to install setuptools: {e}")


# ==================== LAZY IMPORTS WITH ERROR HANDLING ====================

def _get_librosa():
    """
    Lazy import librosa with comprehensive error handling.
    
    Returns:
        librosa module
    
    Raises:
        ImportError: If librosa cannot be imported
    """
    try:
        # Set environment variables before import
        os.environ['NUMBA_DISABLE_JIT'] = '1'
        
        import librosa
        logger.debug("✅ Librosa imported successfully")
        return librosa
    
    except ImportError as e:
        logger.error(f"❌ Failed to import librosa: {str(e)}")
        logger.error("   Run: pip install librosa")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error importing librosa: {str(e)}")
        raise


def _get_soundfile():
    """
    Lazy import soundfile for alternative audio loading.
    
    Returns:
        soundfile module
    
    Raises:
        ImportError: If soundfile cannot be imported
    """
    try:
        import soundfile as sf
        logger.debug("✅ Soundfile imported successfully")
        return sf
    except ImportError as e:
        logger.error(f"❌ Failed to import soundfile: {str(e)}")
        logger.error("   Run: pip install soundfile")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error importing soundfile: {str(e)}")
        raise


def _get_cosine_similarity():
    """
    Lazy import cosine similarity from sklearn.
    
    Returns:
        cosine_similarity function
    
    Raises:
        ImportError: If sklearn cannot be imported
    """
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        logger.debug("✅ Cosine similarity imported successfully")
        return cosine_similarity
    except ImportError as e:
        logger.error(f"❌ Failed to import sklearn: {str(e)}")
        logger.error("   Run: pip install scikit-learn")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error importing sklearn: {str(e)}")
        raise


# ==================== MAIN FUNCTIONS ====================

def extract_voice_embedding(audio_file_path: str) -> Optional[List[float]]:
    """
    Extract MFCC (Mel-Frequency Cepstral Coefficients) features from audio file.
    
    Complete pipeline:
    1. Validate file existence and size
    2. Load audio with librosa or soundfile
    3. Validate audio content and duration
    4. Extract MFCC features
    5. Compute mean to create embedding vector
    6. Normalize embedding
    7. Return as JSON-serializable list
    
    Args:
        audio_file_path (str): Path to audio file (.wav, .mp3, .ogg, .m4a, .flac, .aac, .wma)
    
    Returns:
        Optional[List[float]]: List of 13 MFCC coefficients, or None if extraction fails
    
    Example:
        >>> embedding = extract_voice_embedding("voice_sample.wav")
        >>> if embedding:
        ...     print(f"Extracted {len(embedding)} coefficients")
        ... else:
        ...     print("Extraction failed")
    """
    
    try:
        logger.info(f"🎤 Voice Embedding Extraction Started")
        logger.info(f"   File: {Path(audio_file_path).name}")
        
        # ==================== STEP 1: FILE VALIDATION ====================
        
        logger.debug("Step 1: Validating file...")
        
        if not os.path.exists(audio_file_path):
            logger.error(f"   ❌ File not found: {audio_file_path}")
            return None
        
        file_size = os.path.getsize(audio_file_path)
        logger.debug(f"   📁 File size: {file_size:,} bytes")
        
        if file_size == 0:
            logger.error("   ❌ File is empty")
            return None
        
        if file_size > 100 * 1024 * 1024:  # 100 MB limit
            logger.error(f"   ❌ File too large: {file_size:,} bytes (max 100 MB)")
            return None
        
        file_ext = Path(audio_file_path).suffix.lower()
        logger.debug(f"   📄 Extension: {file_ext}")
        
        supported_formats = {'.wav', '.mp3', '.ogg', '.m4a', '.flac', '.aac', '.wma'}
        if file_ext not in supported_formats:
            logger.error(f"   ❌ Unsupported format: {file_ext}")
            logger.error(f"   Supported: {', '.join(supported_formats)}")
            return None
        
        logger.info("   ✅ File validation passed")
        
        # ==================== STEP 2: LOAD AUDIO FILE ====================
        
        logger.debug("Step 2: Loading audio file...")
        
        audio = None
        sr = None
        
        # Try primary loading with librosa
        try:
            logger.debug("   Attempting librosa.load()...")
            librosa = _get_librosa()
            
            # Disable JIT before loading
            os.environ['NUMBA_DISABLE_JIT'] = '1'
            
            audio, sr = librosa.load(
                audio_file_path,
                sr=SAMPLE_RATE,
                mono=True
            )
            logger.debug(f"   ✅ Librosa loaded: shape={audio.shape}, sr={sr}Hz")
        
        except Exception as librosa_error:
            logger.warning(f"   ⚠️ Librosa failed: {str(librosa_error)}")
            logger.debug("   Attempting soundfile.read() as fallback...")
            
            try:
                sf = _get_soundfile()
                audio_data, sr_original = sf.read(audio_file_path)
                
                # Convert stereo to mono if needed
                if len(audio_data.shape) > 1:
                    logger.debug("   🔄 Converting stereo to mono...")
                    audio = np.mean(audio_data, axis=1)
                else:
                    audio = audio_data
                
                # Resample if needed
                if sr_original != SAMPLE_RATE:
                    logger.debug(f"   🔄 Resampling {sr_original}Hz → {SAMPLE_RATE}Hz...")
                    librosa = _get_librosa()
                    audio = librosa.resample(audio, orig_sr=sr_original, target_sr=SAMPLE_RATE)
                    sr = SAMPLE_RATE
                else:
                    sr = sr_original
                
                logger.debug(f"   ✅ Soundfile loaded: shape={audio.shape}, sr={sr}Hz")
            
            except Exception as sf_error:
                logger.error(f"   ❌ Soundfile failed: {str(sf_error)}")
                return None
        
        if audio is None or sr is None:
            logger.error("   ❌ Failed to load audio")
            return None
        
        logger.info("   ✅ Audio loading passed")
        
        # ==================== STEP 3: VALIDATE AUDIO CONTENT ====================
        
        logger.debug("Step 3: Validating audio content...")
        
        if len(audio) == 0:
            logger.error("   ❌ Audio array is empty")
            return None
        
        # Check duration
        audio_duration = len(audio) / sr
        logger.debug(f"   ⏱️ Duration: {audio_duration:.2f}s")
        
        if audio_duration < MIN_AUDIO_DURATION:
            logger.error(f"   ❌ Audio too short: {audio_duration:.2f}s (min {MIN_AUDIO_DURATION}s)")
            return None
        
        if audio_duration > MAX_AUDIO_DURATION:
            logger.warning(f"   ⚠️ Audio too long: {audio_duration:.2f}s, trimming to {MAX_AUDIO_DURATION}s...")
            trim_samples = int(MAX_AUDIO_DURATION * sr)
            audio = audio[:trim_samples]
        
        # Check for silence
        if np.all(audio == 0):
            logger.error("   ❌ Audio contains only silence")
            return None
        
        # Check amplitude
        max_amplitude = np.max(np.abs(audio))
        logger.debug(f"   📊 Max amplitude: {max_amplitude:.4f}")
        
        if max_amplitude < 0.001:
            logger.error(f"   ❌ Audio amplitude too low: {max_amplitude:.4f}")
            return None
        
        if max_amplitude < 0.01:
            logger.warning(f"   ⚠️ Audio amplitude low: {max_amplitude:.4f}")
        
        logger.info("   ✅ Audio content validation passed")
        
        # ==================== STEP 4: EXTRACT MFCC FEATURES ====================
        
        logger.debug(f"Step 4: Extracting MFCC features (n_mfcc={N_MFCC})...")
        
        try:
            os.environ['NUMBA_DISABLE_JIT'] = '1'
            librosa = _get_librosa()
            
            mfccs = librosa.feature.mfcc(
                y=audio,
                sr=sr,
                n_mfcc=N_MFCC,
                n_fft=N_FFT,
                hop_length=HOP_LENGTH,
                fmin=50,
                fmax=8000
            )
            
            logger.debug(f"   ✅ MFCC shape: {mfccs.shape} ({N_MFCC} features, {mfccs.shape[1]} frames)")
        
        except Exception as mfcc_error:
            logger.error(f"   ❌ MFCC extraction failed: {str(mfcc_error)}")
            import traceback
            traceback.print_exc()
            return None
        
        logger.info("   ✅ MFCC extraction passed")
        
        # ==================== STEP 5: COMPUTE EMBEDDING VECTOR ====================
        
        logger.debug("Step 5: Computing embedding vector...")
        
        # Calculate mean across time frames
        mfcc_mean = np.mean(mfccs, axis=1)
        logger.debug(f"   📊 Mean shape: {mfcc_mean.shape}")
        logger.debug(f"   📊 Mean values: {[round(x, 4) for x in mfcc_mean]}")
        
        # ==================== STEP 6: NORMALIZE EMBEDDING ====================
        
        logger.debug("Step 6: Normalizing embedding...")
        
        embedding_norm = np.linalg.norm(mfcc_mean)
        logger.debug(f"   📐 L2 norm: {embedding_norm:.4f}")
        
        if embedding_norm > 0:
            mfcc_mean = mfcc_mean / embedding_norm
            logger.debug("   ✅ Embedding normalized (L2)")
        else:
            logger.warning("   ⚠️ Embedding norm is zero, skipping normalization")
        
        # ==================== STEP 7: CONVERT TO LIST ====================
        
        logger.debug("Step 7: Converting to JSON-serializable list...")
        
        embedding_list = mfcc_mean.tolist()
        logger.debug(f"   ✅ Converted: {len(embedding_list)} coefficients")
        
        # ==================== SUCCESS ====================
        
        logger.info("🎤 Voice Embedding Extraction Successful!")
        logger.info(f"   ✅ Generated {len(embedding_list)} MFCC coefficients")
        logger.debug(f"   Preview: {[round(x, 4) for x in embedding_list]}")
        
        return embedding_list
    
    except Exception as e:
        logger.error(f"❌ Unexpected error in voice embedding extraction: {str(e)}")
        import traceback
        logger.error("Traceback:")
        for line in traceback.format_exc().split('\n'):
            logger.error(f"   {line}")
        return None


def compare_voice_embeddings(
    embedding1: Union[List[float], np.ndarray, str],
    embedding2: Union[List[float], np.ndarray, str],
    threshold: float = VOICE_MATCH_THRESHOLD
) -> dict:
    """
    Compare two voice embeddings using cosine similarity.
    
    Args:
        embedding1: First voice embedding (list, array, or JSON string)
        embedding2: Second voice embedding (list, array, or JSON string)
        threshold: Threshold for considering as match (default 0.75)
    
    Returns:
        dict: {
            'similarity': float (0-1),
            'is_match': bool,
            'confidence': str,
            'percentage': float
        }
    
    Example:
        >>> result = compare_voice_embeddings(emb1, emb2)
        >>> if result['is_match']:
        ...     print("Voice matched!")
    """
    
    try:
        logger.info("🔍 Starting Voice Comparison")
        
        # ==================== PARSE EMBEDDINGS ====================
        
        logger.debug("   Parsing embeddings...")
        emb1 = _parse_embedding(embedding1)
        emb2 = _parse_embedding(embedding2)
        
        if emb1 is None or emb2 is None:
            logger.error("   ❌ Failed to parse embeddings")
            return {
                'similarity': 0.0,
                'is_match': False,
                'confidence': 'none',
                'percentage': 0.0,
                'error': 'Failed to parse embeddings'
            }
        
        if len(emb1) == 0 or len(emb2) == 0:
            logger.error("   ❌ One or both embeddings are empty")
            return {
                'similarity': 0.0,
                'is_match': False,
                'confidence': 'none',
                'percentage': 0.0,
                'error': 'Empty embeddings'
            }
        
        # ==================== HANDLE DIFFERENT LENGTHS ====================
        
        if len(emb1) != len(emb2):
            logger.warning(f"   ⚠️ Different lengths: {len(emb1)} vs {len(emb2)}")
            min_len = min(len(emb1), len(emb2))
            emb1 = emb1[:min_len]
            emb2 = emb2[:min_len]
            logger.debug(f"   Truncated to {min_len} dimensions")
        
        # ==================== CONVERT TO NUMPY ARRAYS ====================
        
        logger.debug("   Converting to numpy arrays...")
        
        try:
            emb1_array = np.array(emb1, dtype=np.float32).reshape(1, -1)
            emb2_array = np.array(emb2, dtype=np.float32).reshape(1, -1)
            logger.debug(f"   ✅ Array shapes: {emb1_array.shape} vs {emb2_array.shape}")
        except Exception as e:
            logger.error(f"   ❌ Error converting arrays: {str(e)}")
            return {
                'similarity': 0.0,
                'is_match': False,
                'confidence': 'none',
                'percentage': 0.0,
                'error': 'Array conversion failed'
            }
        
        # ==================== CALCULATE COSINE SIMILARITY ====================
        
        logger.debug("   Computing cosine similarity...")
        
        try:
            cosine_similarity = _get_cosine_similarity()
            similarity_matrix = cosine_similarity(emb1_array, emb2_array)
            similarity = float(similarity_matrix[0][0])
            logger.debug(f"   Raw similarity: {similarity:.6f}")
        except Exception as e:
            logger.error(f"   ❌ Error calculating similarity: {str(e)}")
            return {
                'similarity': 0.0,
                'is_match': False,
                'confidence': 'none',
                'percentage': 0.0,
                'error': 'Similarity calculation failed'
            }
        
        # ==================== CLAMP RESULT ====================
        
        similarity = max(0.0, min(1.0, similarity))
        logger.debug(f"   Clamped similarity: {similarity:.4f}")
        
        # ==================== DETERMINE MATCH ====================
        
        is_match = similarity >= threshold
        confidence = _get_confidence_level(similarity)
        percentage = round(similarity * 100, 2)
        
        logger.info(f"🔍 Voice Comparison Result:")
        logger.info(f"   ✅ Similarity: {similarity:.4f} ({percentage}%)")
        logger.info(f"   ✅ Threshold: {threshold}")
        logger.info(f"   ✅ Is Match: {is_match}")
        logger.info(f"   ✅ Confidence: {confidence}")
        
        return {
            'similarity': round(similarity, 4),
            'is_match': is_match,
            'confidence': confidence,
            'percentage': percentage,
            'threshold': threshold
        }
    
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        import traceback
        for line in traceback.format_exc().split('\n'):
            logger.error(f"   {line}")
        
        return {
            'similarity': 0.0,
            'is_match': False,
            'confidence': 'none',
            'percentage': 0.0,
            'error': str(e)
        }


# ==================== HELPER FUNCTIONS ====================

def _parse_embedding(embedding: Union[List, np.ndarray, str]) -> Optional[List[float]]:
    """Parse embedding from various formats to list of floats"""
    try:
        # If already a list
        if isinstance(embedding, list):
            logger.debug(f"      Embedding is list with {len(embedding)} elements")
            return [float(x) for x in embedding]
        
        # If numpy array
        if isinstance(embedding, np.ndarray):
            logger.debug(f"      Embedding is numpy array with shape {embedding.shape}")
            return embedding.flatten().tolist()
        
        # If JSON string
        if isinstance(embedding, str):
            logger.debug("      Embedding is JSON string, parsing...")
            try:
                parsed = json.loads(embedding)
            except json.JSONDecodeError as je:
                logger.error(f"      ❌ Invalid JSON: {str(je)}")
                return None
            
            if isinstance(parsed, list):
                logger.debug(f"      ✅ Parsed list with {len(parsed)} elements")
                return [float(x) for x in parsed]
            else:
                logger.error(f"      ❌ JSON is {type(parsed)}, not list")
                return None
        
        logger.error(f"      ❌ Unknown type: {type(embedding)}")
        return None
    
    except Exception as e:
        logger.error(f"      ❌ Error parsing: {str(e)}")
        return None


def _get_confidence_level(similarity: float) -> str:
    """Get confidence level based on similarity score"""
    if similarity >= 0.85:
        return "very_high"
    elif similarity >= 0.75:
        return "high"
    elif similarity >= 0.65:
        return "medium"
    elif similarity >= 0.55:
        return "low"
    else:
        return "none"


def validate_audio_file(file_path: str) -> dict:
    """
    Validate if audio file is suitable for voice processing.
    
    Returns:
        dict: {
            'valid': bool,
            'duration': float,
            'sample_rate': int,
            'file_size': int,
            'max_amplitude': float,
            'error': str (if invalid)
        }
    """
    try:
        logger.info(f"🔍 Validating audio file: {Path(file_path).name}")
        
        if not os.path.exists(file_path):
            logger.error("   ❌ File not found")
            return {"valid": False, "error": "File not found"}
        
        file_size = os.path.getsize(file_path)
        logger.debug(f"   File size: {file_size:,} bytes")
        
        if file_size == 0:
            logger.error("   ❌ File is empty")
            return {"valid": False, "error": "File is empty"}
        
        if file_size > 100 * 1024 * 1024:
            logger.error("   ❌ File too large")
            return {"valid": False, "error": "File too large (max 100 MB)"}
        
        logger.debug("   Loading audio...")
        
        try:
            os.environ['NUMBA_DISABLE_JIT'] = '1'
            librosa = _get_librosa()
            audio, sr = librosa.load(file_path, sr=SAMPLE_RATE, mono=True)
            logger.debug(f"   Loaded: shape={audio.shape}, sr={sr}")
        except Exception as e:
            logger.error(f"   ❌ Cannot load: {str(e)}")
            return {"valid": False, "error": f"Cannot load audio: {str(e)}"}
        
        duration = len(audio) / sr
        max_amplitude = np.max(np.abs(audio))
        
        logger.debug(f"   Duration: {duration:.2f}s")
        logger.debug(f"   Max amplitude: {max_amplitude:.4f}")
        
        if duration < MIN_AUDIO_DURATION:
            logger.error(f"   ❌ Too short: {duration:.2f}s")
            return {"valid": False, "error": f"Audio too short: {duration:.2f}s"}
        
        if duration > MAX_AUDIO_DURATION:
            logger.error(f"   ❌ Too long: {duration:.2f}s")
            return {"valid": False, "error": f"Audio too long: {duration:.2f}s"}
        
        if np.all(audio == 0):
            logger.error("   ❌ Only silence")
            return {"valid": False, "error": "Audio contains only silence"}
        
        if max_amplitude < 0.001:
            logger.error(f"   ❌ Amplitude too low: {max_amplitude:.4f}")
            return {"valid": False, "error": f"Amplitude too low: {max_amplitude:.4f}"}
        
        logger.info(f"   ✅ Valid: {duration:.2f}s at {sr}Hz")
        
        return {
            "valid": True,
            "duration": round(duration, 2),
            "sample_rate": sr,
            "file_size": file_size,
            "max_amplitude": round(max_amplitude, 4)
        }
    
    except Exception as e:
        logger.error(f"   ❌ Validation error: {str(e)}")
        return {"valid": False, "error": str(e)}


# ==================== UTILITY FUNCTIONS ====================

def is_voice_match(similarity_score: float, threshold: float = VOICE_MATCH_THRESHOLD) -> bool:
    """Quick check if similarity indicates a match"""
    return similarity_score >= threshold


def get_embedding_stats(embedding: Union[List[float], np.ndarray, str]) -> dict:
    """Get statistics about an embedding"""
    try:
        emb = _parse_embedding(embedding)
        if emb is None or len(emb) == 0:
            return {"error": "Invalid embedding"}
        
        arr = np.array(emb)
        return {
            "size": len(emb),
            "mean": round(float(np.mean(arr)), 4),
            "std": round(float(np.std(arr)), 4),
            "min": round(float(np.min(arr)), 4),
            "max": round(float(np.max(arr)), 4),
            "norm": round(float(np.linalg.norm(arr)), 4),
        }
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return {"error": str(e)}