"""Voice processing utilities"""

import numpy as np
import librosa
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

SAMPLE_RATE = 16000
N_MFCC = 13
VOICE_MATCH_THRESHOLD = 0.75

def extract_voice_embedding(audio_file_path: str) -> list:
    """
    Extract MFCC features from audio file.
    Returns a list of MFCC coefficients that can be compared.
    """
    try:
        print(f"   📊 Extracting MFCC features from {audio_file_path}...")
        
        # Load audio file
        audio, sr = librosa.load(audio_file_path, sr=SAMPLE_RATE)
        
        # Extract MFCC features
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)
        
        # Compute mean of each MFCC coefficient
        mfcc_mean = np.mean(mfccs, axis=1).tolist()
        
        print(f"   ✅ Extracted {len(mfcc_mean)} MFCC coefficients")
        return mfcc_mean
    
    except Exception as e:
        logger.error(f"Error extracting voice embedding: {e}")
        return None

def compare_voice_embeddings(embedding1: list, embedding2: list) -> float:
    """
    Compare two voice embeddings using cosine similarity.
    Returns similarity score between 0 and 1.
    
    - 1.0 = Perfect match (same person)
    - 0.75+ = Strong match (likely same person)
    - 0.5-0.75 = Weak match (possibly same person)
    - <0.5 = Different person
    """
    try:
        if not embedding1 or not embedding2:
            return 0.0
        
        # Convert to numpy arrays
        emb1 = np.array(embedding1).reshape(1, -1)
        emb2 = np.array(embedding2).reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(emb1, emb2)[0][0]
        
        # Ensure similarity is between 0 and 1
        similarity = max(0.0, min(1.0, float(similarity)))
        
        return similarity
    
    except Exception as e:
        logger.error(f"Error comparing voice embeddings: {e}")
        return 0.0

def is_voice_match(similarity_score: float, threshold: float = VOICE_MATCH_THRESHOLD) -> bool:
    """
    Check if similarity score indicates a voice match.
    Default threshold is 0.75 (75% similarity)
    """
    return similarity_score >= threshold

def voice_match_confidence(similarity_score: float) -> str:
    """
    Return confidence level based on similarity score.
    """
    if similarity_score >= 0.85:
        return "very_high"
    elif similarity_score >= 0.75:
        return "high"
    elif similarity_score >= 0.65:
        return "medium"
    elif similarity_score >= 0.55:
        return "low"
    else:
        return "none"