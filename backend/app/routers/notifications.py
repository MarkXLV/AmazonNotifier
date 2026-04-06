from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import NotificationSettings
from ..schemas import NotificationSettingsIn, NotificationSettingsOut

router = APIRouter(tags=["notifications"])


async def _get_or_create(db: AsyncSession) -> NotificationSettings:
    stmt = select(NotificationSettings).limit(1)
    result = await db.execute(stmt)
    ns = result.scalar_one_or_none()
    if not ns:
        ns = NotificationSettings(email="", notify_on_drop=True, notify_on_target=True)
        db.add(ns)
        await db.flush()
        await db.refresh(ns)
    return ns


@router.get("/notifications/settings", response_model=NotificationSettingsOut)
async def get_notification_settings(db: AsyncSession = Depends(get_db)):
    ns = await _get_or_create(db)
    return NotificationSettingsOut(
        id=ns.id,
        email=ns.email,
        notify_on_drop=ns.notify_on_drop,
        notify_on_target=ns.notify_on_target,
        email_configured=settings.email_enabled,
        updated_at=ns.updated_at,
    )


@router.put("/notifications/settings", response_model=NotificationSettingsOut)
async def update_notification_settings(
    body: NotificationSettingsIn,
    db: AsyncSession = Depends(get_db),
):
    ns = await _get_or_create(db)
    ns.email = body.email
    ns.notify_on_drop = body.notify_on_drop
    ns.notify_on_target = body.notify_on_target
    await db.commit()
    await db.refresh(ns)
    return NotificationSettingsOut(
        id=ns.id,
        email=ns.email,
        notify_on_drop=ns.notify_on_drop,
        notify_on_target=ns.notify_on_target,
        email_configured=settings.email_enabled,
        updated_at=ns.updated_at,
    )
