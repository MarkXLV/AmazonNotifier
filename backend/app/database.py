import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings

logger = logging.getLogger(__name__)

SQLITE_FALLBACK_URL = "sqlite+aiosqlite:///./pricewatch.db"

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# Indexes that speed up the hot dashboard/stats/search queries. `create_all`
# only builds these on a fresh DB, so we also (idempotently) create them at
# startup to cover databases that already have the tables.
# `CREATE INDEX IF NOT EXISTS` is supported by both SQLite and PostgreSQL.
_INDEX_STATEMENTS = (
    "CREATE INDEX IF NOT EXISTS ix_products_tracked_updated "
    "ON products (is_tracked, updated_at)",
    "CREATE INDEX IF NOT EXISTS ix_price_history_product_checked "
    "ON price_history (product_id, checked_at)",
    "CREATE INDEX IF NOT EXISTS ix_price_alerts_created "
    "ON price_alerts (created_at)",
    "CREATE INDEX IF NOT EXISTS ix_price_alerts_product "
    "ON price_alerts (product_id)",
)


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with async_session() as session:
        yield session


async def _create_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for statement in _INDEX_STATEMENTS:
            await conn.execute(text(statement))


async def init_db() -> None:
    global engine

    try:
        await _create_schema()
        return
    except Exception as exc:  # connection/resolution failure, bad credentials, etc.
        if settings.database_url.startswith("sqlite"):
            raise
        # A configured external database (e.g. Postgres) is unreachable. Rather
        # than crash-loop the whole service, fall back to a self-contained SQLite
        # database so the app still boots. (Set a working DATABASE_URL to use a
        # persistent database instead.)
        logger.warning(
            "Database at configured DATABASE_URL is unavailable (%s: %s); "
            "falling back to SQLite.",
            type(exc).__name__,
            exc,
        )

    await engine.dispose()
    engine = create_async_engine(SQLITE_FALLBACK_URL, echo=False)
    async_session.configure(bind=engine)
    await _create_schema()
