"""Populate the database with sample products for local development.

The same seeding runs automatically on app startup (see app/seed.py); this
script lets you seed manually, e.g. `python seed.py`.
"""

import asyncio

from app.database import init_db
from app.seed import seed_if_empty


async def main() -> None:
    await init_db()
    await seed_if_empty()
    print("Seed complete (skipped if the database already had products).")


if __name__ == "__main__":
    asyncio.run(main())
