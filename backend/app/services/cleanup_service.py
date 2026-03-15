"""Background service for cleanup tasks"""

import logging
from datetime import datetime, timedelta
from sqlalchemy.future import select
from sqlalchemy import delete
import asyncio

from app.core.database import SessionLocal
from app.models.visitor import Visitor

logger = logging.getLogger(__name__)

async def delete_old_visitors(days: int = 30) -> dict:
    """
    Delete visitors older than specified days (default 30 days).
    Also archives analytics data before deletion.
    
    Returns:
        Dictionary with deletion stats
    """
    try:
        async with SessionLocal() as session:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get visitors to be deleted
            result = await session.execute(
                select(Visitor).where(Visitor.created_at < cutoff_date)
            )
            old_visitors = result.scalars().all()
            
            visitor_count = len(old_visitors)
            
            if visitor_count == 0:
                logger.info("✅ No old visitors to delete")
                return {
                    "status": "success",
                    "deleted_count": 0,
                    "message": "No visitors older than 30 days found"
                }
            
            logger.info(f"🗑️  Preparing to delete {visitor_count} visitors older than {days} days")
            
            # Archive analytics data (optional - store in separate table if needed)
            # For now, we'll just log the data
            for visitor in old_visitors:
                logger.info(f"   📊 Archiving: {visitor.name} (Apt {visitor.apartment_no}) - {visitor.created_at}")
            
            # Delete old visitors
            await session.execute(
                delete(Visitor).where(Visitor.created_at < cutoff_date)
            )
            await session.commit()
            
            logger.info(f"✅ Successfully deleted {visitor_count} old visitors")
            
            return {
                "status": "success",
                "deleted_count": visitor_count,
                "cutoff_date": cutoff_date.isoformat(),
                "message": f"Deleted {visitor_count} visitors older than {days} days"
            }
    
    except Exception as e:
        logger.error(f"❌ Error deleting old visitors: {e}")
        return {
            "status": "error",
            "deleted_count": 0,
            "message": f"Error deleting old visitors: {str(e)}"
        }

async def start_cleanup_scheduler():
    """
    Start background scheduler to delete old visitors daily.
    Runs at 2:00 AM every day.
    """
    import time
    
    logger.info("🔄 Cleanup scheduler started")
    
    while True:
        try:
            # Get current time
            now = datetime.utcnow()
            
            # Calculate seconds until 2:00 AM
            next_run = now.replace(hour=2, minute=0, second=0, microsecond=0)
            
            # If 2:00 AM has passed, schedule for next day
            if now >= next_run:
                next_run += timedelta(days=1)
            
            wait_seconds = (next_run - now).total_seconds()
            
            logger.info(f"⏰ Next cleanup scheduled for: {next_run}")
            
            # Wait until next scheduled time
            await asyncio.sleep(wait_seconds)
            
            # Run cleanup
            logger.info("🧹 Running scheduled cleanup...")
            result = await delete_old_visitors(days=30)
            logger.info(f"✅ Cleanup result: {result}")
            
        except Exception as e:
            logger.error(f"❌ Error in cleanup scheduler: {e}")
            # Wait 1 hour before retrying
            await asyncio.sleep(3600)