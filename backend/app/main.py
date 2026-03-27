"""Main FastAPI application"""

import os
import logging
from contextlib import asynccontextmanager

# ==================== ENVIRONMENT SETUP ====================
os.environ['NUMBA_DISABLE_JIT'] = '1'

# ==================== IMPORTS ====================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import otp, resident, visitor, admin
from app.core.database import engine, Base
from app.services.cleanup_service import start_cleanup_scheduler

# ==================== LOGGING SETUP ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== LIFESPAN ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle"""
    
    # Startup
    try:
        logger.info("📊 Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created")
    except Exception as e:
        logger.error(f"❌ Database error: {e}")
    
    try:
        logger.info("⏰ Starting cleanup scheduler...")
        start_cleanup_scheduler()
        logger.info("✅ Cleanup scheduler started")
    except Exception as e:
        logger.error(f"❌ Scheduler error: {e}")
    
    try:
        logger.info("🎤 Initializing voice module...")
        from app.utils.voice import extract_voice_embedding, validate_audio_file
        logger.info("✅ Voice module initialized")
    except Exception as e:
        logger.error(f"❌ Voice module error: {e}")
    
    logger.info("✅ Application ready")
    
    yield
    
    # Shutdown
    try:
        await engine.dispose()
        logger.info("✅ Shutdown complete")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")


# ==================== CREATE APP ====================

app = FastAPI(
    title="Visitor Management System",
    description="Voice-based Visitor Management",
    version="1.0.0",
    lifespan=lifespan
)

# ==================== CORS ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ROUTERS ====================

app.include_router(resident.router)
app.include_router(visitor.router)
app.include_router(admin.router)
app.include_router(otp.router)

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {
        "message": "🎤 Voice-Based Visitor Management System",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "✅ healthy"}

logger.info("✅ Application initialized")