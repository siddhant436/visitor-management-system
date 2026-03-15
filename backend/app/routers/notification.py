"""Router for notification operations"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import SessionLocal
from app.models.notification import Notification
from app.schemas.notification import NotificationRead, NotificationUpdate
from app.services.notification_service import (
    get_resident_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification,
    get_unread_count
)

logger = logging.getLogger(__name__)

async def get_db():
    async with SessionLocal() as session:
        yield session

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/resident/{resident_id}")
async def get_notifications(
    resident_id: int,
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get notifications for a resident"""
    try:
        notifications = await get_resident_notifications(
            db, resident_id, unread_only, skip, limit
        )
        
        return {
            "status": "success",
            "count": len(notifications),
            "notifications": [
                {
                    "id": n.id,
                    "visitor_name": n.visitor_name,
                    "visitor_phone": n.visitor_phone,
                    "purpose": n.purpose,
                    "apartment_no": n.apartment_no,
                    "is_read": n.is_read,
                    "notification_type": n.notification_type,
                    "created_at": n.created_at
                } for n in notifications
            ]
        }
    
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching notifications"
        )

@router.get("/resident/{resident_id}/unread-count")
async def get_unread_notifications_count(
    resident_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get count of unread notifications for a resident"""
    try:
        count = await get_unread_count(db, resident_id)
        
        return {
            "status": "success",
            "resident_id": resident_id,
            "unread_count": count
        }
    
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting unread count"
        )

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read"""
    try:
        notification = await mark_notification_as_read(db, notification_id)
        
        return {
            "status": "success",
            "message": "Notification marked as read",
            "notification": {
                "id": notification.id,
                "visitor_name": notification.visitor_name,
                "is_read": notification.is_read
            }
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error marking notification as read"
        )

@router.put("/resident/{resident_id}/read-all")
async def mark_all_as_read(
    resident_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Mark all unread notifications as read for a resident"""
    try:
        count = await mark_all_notifications_as_read(db, resident_id)
        
        return {
            "status": "success",
            "message": f"Marked {count} notifications as read",
            "count": count
        }
    
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error marking notifications as read"
        )

@router.delete("/{notification_id}")
async def delete_notification_endpoint(
    notification_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a notification"""
    try:
        deleted = await delete_notification(db, notification_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {
            "status": "success",
            "message": "Notification deleted"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting notification"
        )