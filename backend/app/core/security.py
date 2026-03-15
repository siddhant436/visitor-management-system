"""Security utilities for password hashing and JWT token creation"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# JWT configuration
SECRET_KEY = "your-secret-key-change-in-production-12345678901234567890"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
    
    Returns:
        Hashed password as string
    """
    try:
        logger.info(f"Hashing password (length: {len(password)})")
        
        # Encode password to bytes
        password_bytes = password.encode('utf-8')
        
        # Generate salt and hash
        salt = bcrypt.gensalt(rounds=12)
        hashed_bytes = bcrypt.hashpw(password_bytes, salt)
        
        # Decode back to string
        hashed_password = hashed_bytes.decode('utf-8')
        
        logger.info("✅ Password hashed successfully")
        return hashed_password
    
    except Exception as e:
        logger.error(f"❌ Error hashing password: {str(e)}")
        raise

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against
    
    Returns:
        True if password matches, False otherwise
    """
    try:
        # Encode plain password to bytes
        plain_bytes = plain_password.encode('utf-8')
        
        # Encode hashed password to bytes if it's a string
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode('utf-8')
        else:
            hashed_bytes = hashed_password
        
        # Compare
        result = bcrypt.checkpw(plain_bytes, hashed_bytes)
        return result
    
    except Exception as e:
        logger.error(f"❌ Error verifying password: {str(e)}")
        return False

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing data to encode
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token
    """
    try:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.info("✅ Access token created")
        return encoded_jwt
    
    except Exception as e:
        logger.error(f"❌ Error creating access token: {str(e)}")
        raise

def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
    
    Returns:
        Dictionary containing token data
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"❌ Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"❌ Error verifying token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_from_token(token: str) -> dict:
    """
    Extract user information from token.
    
    Args:
        token: JWT token
    
    Returns:
        Dictionary with user_id and user_type
    
    Raises:
        HTTPException: If token is invalid
    """
    try:
        payload = verify_token(token)
        user_id: int = payload.get("user_id")
        user_type: str = payload.get("user_type")  # 'resident' or 'admin'
        
        if user_id is None or user_type is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        return {"user_id": user_id, "user_type": user_type}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error extracting user from token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )