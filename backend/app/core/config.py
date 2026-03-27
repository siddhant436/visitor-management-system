"""Application configuration"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # ============ DATABASE ============
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./visitor_management.db"
    )
    
    # ============ SECURITY ============
    secret_key: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-change-in-production-12345678901234567890"
    )
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )
    
    # ============ OTP CONFIGURATION ============
    otp_method: str = os.getenv("OTP_METHOD", "console")
    # Options: console, email, twilio_sms, twilio_email, twilio_verify_api
    
    sendgrid_api_key: Optional[str] = os.getenv("SENDGRID_API_KEY")
    otp_expiration_minutes: int = int(
        os.getenv("OTP_EXPIRATION_MINUTES", "5")
    )
    otp_length: int = int(os.getenv("OTP_LENGTH", "6"))
    max_otp_attempts: int = int(os.getenv("MAX_OTP_ATTEMPTS", "5"))
    rate_limit_otp_requests: int = int(
        os.getenv("RATE_LIMIT_OTP_REQUESTS", "3")
    )
    rate_limit_window_minutes: int = int(
        os.getenv("RATE_LIMIT_WINDOW_MINUTES", "15")
    )
    
    # ============ TWILIO CONFIGURATION ============
    twilio_account_sid: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone_number: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")
    twilio_verify_service_id: Optional[str] = os.getenv("TWILIO_VERIFY_SERVICE_ID")
    twilio_from_email: Optional[str] = os.getenv("TWILIO_FROM_EMAIL")
    
    # ============ SMTP EMAIL CONFIGURATION (Fallback) ============
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: Optional[str] = os.getenv("SMTP_USERNAME")
    smtp_password: Optional[str] = os.getenv("SMTP_PASSWORD")
    sender_email: str = os.getenv(
        "SENDER_EMAIL",
        "noreply@visitormanagement.com"
    )
    
    # ============ LOGGING ============
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # ============ ENVIRONMENT ============
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # ============ PYDANTIC CONFIGURATION ============
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # ✅ Allow extra fields from .env
    )


# Create global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings"""
    return settings