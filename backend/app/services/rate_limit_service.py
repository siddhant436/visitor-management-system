"""Rate limiting service to prevent abuse"""

import logging
from datetime import datetime, timedelta
from typing import Dict
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Simple in-memory rate limiter.
    For production, use Redis or similar.
    """
    
    def __init__(self):
        self.requests: Dict[str, list] = {}
    
    def is_allowed(
        self,
        identifier: str,
        max_requests: int = 10,
        window_seconds: int = 60
    ) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            identifier: Unique identifier (IP, user_id, email, etc.)
            max_requests: Maximum requests allowed in time window
            window_seconds: Time window in seconds
        
        Returns:
            True if request is allowed, False if rate limited
        """
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)
        
        # Initialize if not exists
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Remove old requests outside the window
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > window_start
        ]
        
        # Check if limit exceeded
        if len(self.requests[identifier]) >= max_requests:
            logger.warning(f"⚠️ Rate limit exceeded for {identifier}")
            return False
        
        # Add current request
        self.requests[identifier].append(now)
        return True
    
    def get_remaining_requests(
        self,
        identifier: str,
        max_requests: int = 10,
        window_seconds: int = 60
    ) -> int:
        """Get remaining requests for identifier"""
        if identifier not in self.requests:
            return max_requests
        
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)
        
        recent_requests = [
            req_time for req_time in self.requests[identifier]
            if req_time > window_start
        ]
        
        return max(0, max_requests - len(recent_requests))

# Create singleton instance
rate_limiter = RateLimiter()

# Rate limit configurations
RATE_LIMITS = {
    "visitor_checkin": {"max_requests": 30, "window_seconds": 3600},  # 30 per hour
    "visitor_voice_checkin": {"max_requests": 20, "window_seconds": 3600},  # 20 per hour
    "gate_entry": {"max_requests": 50, "window_seconds": 3600},  # 50 per hour
    "resident_register": {"max_requests": 5, "window_seconds": 86400},  # 5 per day
    "resident_login": {"max_requests": 10, "window_seconds": 300},  # 10 per 5 minutes
    "admin_login": {"max_requests": 5, "window_seconds": 300},  # 5 per 5 minutes
    "otp_request": {"max_requests": 3, "window_seconds": 900},  # 3 per 15 minutes
}

def check_rate_limit(identifier: str, endpoint: str, client_ip: str = None):
    """
    Check rate limit for an endpoint.
    
    Args:
        identifier: User ID, email, or other unique identifier
        endpoint: Endpoint name from RATE_LIMITS
        client_ip: Client IP address for additional tracking
    
    Raises:
        HTTPException: If rate limit exceeded
    """
    if endpoint not in RATE_LIMITS:
        return
    
    config = RATE_LIMITS[endpoint]
    
    # Use combination of identifier and client_ip if available
    key = f"{endpoint}:{identifier}"
    if client_ip:
        key = f"{endpoint}:{client_ip}:{identifier}"
    
    if not rate_limiter.is_allowed(key, config["max_requests"], config["window_seconds"]):
        remaining = rate_limiter.get_remaining_requests(key, config["max_requests"], config["window_seconds"])
        
        logger.warning(f"❌ Rate limit exceeded: {key}")
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please try again later. Limit: {config['max_requests']} requests per {config['window_seconds']} seconds."
        )