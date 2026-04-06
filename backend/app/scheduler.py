import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .config import settings
from .database import async_session
from .services.price_checker import check_all_tracked

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def _scheduled_price_check() -> None:
    logger.info("Scheduled price check starting...")
    async with async_session() as db:
        results = await check_all_tracked(db)
        drops = [r for r in results if r.status in ("dropped", "target_reached")]
        logger.info(
            "Scheduled check complete: %d products checked, %d price drops",
            len(results),
            len(drops),
        )


def start_scheduler() -> None:
    interval = settings.price_check_interval_minutes
    scheduler.add_job(
        _scheduled_price_check,
        trigger=IntervalTrigger(minutes=interval),
        id="price_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started: checking prices every %d minutes", interval)


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
