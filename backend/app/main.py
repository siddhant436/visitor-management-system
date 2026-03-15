"""Main FastAPI application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import resident, visitor, admin
from app.core.database import engine, Base
from app.services.cleanup_service import start_cleanup_scheduler
import app.models.otp  # noqa: F401 – registers OTPRecord with Base metadata

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created")
    
    # Start cleanup scheduler
    start_cleanup_scheduler()
    logger.info("✅ Cleanup scheduler started")
    
    yield
    
    # Shutdown
    await engine.dispose()
    logger.info("✅ Application shutdown complete")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Visitor Management System API",
    description="API for managing visitors and residents",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(resident.router)
app.include_router(visitor.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Visitor Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}

logger.info("✅ Application initialized")