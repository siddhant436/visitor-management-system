"""Application configuration"""

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "Visitor Management System"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Database Settings
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/visitor_db"
    
    # Security Settings
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    
    # OpenAI Settings
    OPENAI_API_KEY: str = ""
    
    # Redis Settings (optional)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Email / SMTP Settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_SENDER_EMAIL: str = "noreply@visitormanagement.com"
    
    # Whisper Settings
    WHISPER_MODEL_SIZE: str = "base"
    
    # Speaker Verification Settings
    SPEAKER_VERIFICATION_THRESHOLD: float = 0.75
    
    # Supported Languages
    SUPPORTED_LANGUAGES: list = ["en", "hi"]
    
    # Directory Settings
    UPLOADS_DIR: str = "./uploads"
    AUDIO_SAMPLES_DIR: str = "./audio_samples"
    MODELS_DIR: str = "./models"

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()