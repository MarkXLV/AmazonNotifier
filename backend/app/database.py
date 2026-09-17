from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# Indexes that speed up the hot dashboard/stats/search queries. `create_all`
# only builds these on a fresh DB, so we also (idempotently) create them at
# startup to cover databases that already have the tables (e.g. Render prod).
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


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for statement in _INDEX_STATEMENTS:
            await conn.execute(text(statement))
