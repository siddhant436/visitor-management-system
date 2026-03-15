"""Service for handling notifications"""

import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.models.notification import Notification
from app.models.resident import Resident

logger = logging.getLogger(__name__)

async def create_notification(
    db: AsyncSession,
    resident_id: int,
    visitor_name: str,
    visitor_phone: str,
    purpose: str,
    apartment_no: str,
    visitor_id: int = None,
    notification_type: str = "visitor_arrival"
) -> Notification:
    """
    Create a new notification for a resident.
    
    Args:
        db: Database session
        resident_id: ID of the resident being notified
        visitor_name: Name of the visitor
        visitor_phone: Phone of the visitor
        purpose: Purpose of visit
        apartment_no: Apartment number being visited
        visitor_id: Optional visitor ID from database
        notification_type: Type of notification
    
    Returns:
        Created notification object
    """
    try:
        notification = Notification(
            resident_id=resident_id,
            visitor_name=visitor_name,
            visitor_phone=visitor_phone,
            purpose=purpose,
            apartment_no=apartment_no,
            visitor_id=visitor_id,
            notification_type=notification_type
        )
        
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        
        logger.info(f"✅ Notification created for resident {resident_id}: {visitor_name}")
        return notification
    
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error creating notification: {e}")
        raise

async def get_resident_notifications(
    db: AsyncSession,
    resident_id: int,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 10
) -> list:
    """
    Get notifications for a specific resident.
    
    Args:
        db: Database session
        resident_id: ID of the resident
        unread_only: If True, return only unread notifications
        skip: Number of records to skip
        limit: Number of records to return
    
    Returns:
        List of notifications
    """
    try:
        query = select(Notification).where(Notification.resident_id == resident_id)
        
        if unread_only:
            query = query.where(Notification.is_read == False)
        
        query = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        notifications = result.scalars().all()
        
        logger.info(f"✅ Retrieved {len(notifications)} notifications for resident {resident_id}")
        return notifications
    
    except Exception as e:
        logger.error(f"❌ Error getting notifications: {e}")
        raise

async def mark_notification_as_read(
    db: AsyncSession,
    notification_id: int
) -> Notification:
    """Mark a notification as read"""
    try:
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalars().first()
        
        if not notification:
            raise ValueError(f"Notification {notification_id} not found")
        
        notification.is_read = True
        notification.updated_at = datetime.utcnow()
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        
        logger.info(f"✅ Notification {notification_id} marked as read")
        return notification
    
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error marking notification as read: {e}")
        raise

async def mark_all_notifications_as_read(
    db: AsyncSession,
    resident_id: int
) -> int:
    """Mark all unread notifications as read for a resident"""
    try:
        result = await db.execute(
            select(Notification).where(
                (Notification.resident_id == resident_id) & 
                (Notification.is_read == False)
            )
        )
        notifications = result.scalars().all()
        
        for notification in notifications:
            notification.is_read = True
            notification.updated_at = datetime.utcnow()
            db.add(notification)
        
        await db.commit()
        
        logger.info(f"✅ Marked {len(notifications)} notifications as read for resident {resident_id}")
        return len(notifications)
    
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error marking all notifications as read: {e}")
        raise

async def delete_notification(
    db: AsyncSession,
    notification_id: int
) -> bool:
    """Delete a notification"""
    try:
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notification = result.scalars().first()
        
        if not notification:
            return False
        
        await db.delete(notification)
        await db.commit()
        
        logger.info(f"✅ Notification {notification_id} deleted")
        return True
    
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error deleting notification: {e}")
        raise

async def get_unread_count(
    db: AsyncSession,
    resident_id: int
) -> int:
    """Get count of unread notifications for a resident"""
    try:
        from sqlalchemy import func
        
        result = await db.execute(
            select(func.count(Notification.id)).where(
                (Notification.resident_id == resident_id) & 
                (Notification.is_read == False)
            )
        )
        count = result.scalar()
        
        logger.info(f"✅ Unread notifications for resident {resident_id}: {count}")
        return count or 0
    
    except Exception as e:
        logger.error(f"❌ Error getting unread count: {e}")
        raise