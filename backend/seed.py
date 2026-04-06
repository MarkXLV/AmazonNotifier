"""Populate the database with sample products and price history for demo purposes."""

import asyncio
import datetime
import random

from sqlalchemy import select

from app.database import async_session, init_db
from app.models import NotificationSettings, PriceAlert, PriceHistory, Product

PRODUCTS = [
    {
        "name": "Apple iPhone 16 Pro Max 256 GB: 17.43 cm (6.9\u2033) Super Retina XDR Display, A18 Pro Chip, Advanced Camera System; Desert Titanium",
        "url": "https://www.amazon.in/dp/B0DGHSMX43",
        "image_url": "https://m.media-amazon.com/images/I/61v2pjMOHgL._SL1500_.jpg",
        "current_price": 144900,
        "original_price": 149900,
        "rating": 4.5,
        "review_count": 8234,
        "category": "Smartphones",
    },
    {
        "name": "Samsung Galaxy S25 Ultra 5G AI Smartphone (Titanium Black, 12GB RAM, 256GB Storage), 200MP Camera, S Pen",
        "url": "https://www.amazon.in/dp/B0DSKMV3ZC",
        "image_url": "https://m.media-amazon.com/images/I/7109g7msDqL._SL1500_.jpg",
        "current_price": 118999,
        "original_price": 131999,
        "rating": 4.4,
        "review_count": 3421,
        "category": "Smartphones",
    },
    {
        "name": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones, 30hr Battery, Multipoint, Alexa; Black",
        "url": "https://www.amazon.in/dp/B0BX4HWKNS",
        "image_url": "https://m.media-amazon.com/images/I/51aXvjzcukL._SL1500_.jpg",
        "current_price": 22990,
        "original_price": 29990,
        "rating": 4.5,
        "review_count": 12543,
        "category": "Headphones",
    },
    {
        "name": "Apple MacBook Air Laptop M3 chip, 15.3-inch Liquid Retina Display, 8GB RAM, 256GB SSD; Midnight",
        "url": "https://www.amazon.in/dp/B0CX22ZW1T",
        "image_url": "https://m.media-amazon.com/images/I/61RYGnMoYWL._SL1500_.jpg",
        "current_price": 114990,
        "original_price": 134900,
        "rating": 4.7,
        "review_count": 5602,
        "category": "Laptops",
    },
    {
        "name": "boAt Airdopes 141 TWS Earbuds with 42H Playtime, Low Latency Mode, ENx Tech, IWP, IPX4, Bluetooth v5.3; Cyan",
        "url": "https://www.amazon.in/dp/B0BFJ7N54H",
        "image_url": "https://m.media-amazon.com/images/I/51sVi+KSdtL._SL1500_.jpg",
        "current_price": 1099,
        "original_price": 4490,
        "rating": 4.1,
        "review_count": 189432,
        "category": "Earbuds",
    },
    {
        "name": "Dyson V12 Detect Slim Cordless Vacuum Cleaner, Laser Slim Fluffy Cleaner Head, 0.35L Dust Bin",
        "url": "https://www.amazon.in/dp/B0BXZ6LPJV",
        "image_url": "https://m.media-amazon.com/images/I/51SCeAh+LBL._SL1500_.jpg",
        "current_price": 44900,
        "original_price": 52900,
        "rating": 4.3,
        "review_count": 1876,
        "category": "Home",
    },
]


def _random_price_around(base: float, pct: float = 0.12) -> float:
    delta = base * pct
    return round(base + random.uniform(-delta, delta), -1)


async def seed() -> None:
    await init_db()

    async with async_session() as db:
        existing = (await db.execute(select(Product).limit(1))).scalar_one_or_none()
        if existing:
            print("Database already has products -- skipping seed.")
            return

        now = datetime.datetime.now(datetime.timezone.utc)

        for data in PRODUCTS:
            product = Product(
                name=data["name"],
                url=data["url"],
                image_url=data["image_url"],
                current_price=data["current_price"],
                original_price=data["original_price"],
                target_price=round(data["current_price"] * 0.85, -2),
                rating=data["rating"],
                review_count=data["review_count"],
                category=data["category"],
                is_tracked=True,
            )
            db.add(product)
            await db.flush()

            # Generate 14 days of price history
            prices = []
            for day in range(14, -1, -1):
                ts = now - datetime.timedelta(days=day)
                if day == 0:
                    price = data["current_price"]
                else:
                    price = _random_price_around(data["original_price"])
                prices.append((price, ts))

                db.add(PriceHistory(product_id=product.id, price=price, checked_at=ts))

            # Create a price drop alert for the most recent drop
            if data["current_price"] < data["original_price"]:
                alert_time = now - datetime.timedelta(hours=random.randint(1, 48))
                db.add(
                    PriceAlert(
                        product_id=product.id,
                        old_price=data["original_price"],
                        new_price=data["current_price"],
                        is_read=False,
                        email_sent=False,
                        created_at=alert_time,
                    )
                )

        # Notification settings
        db.add(NotificationSettings(email="", notify_on_drop=True, notify_on_target=True))

        await db.commit()
        print(f"Seeded {len(PRODUCTS)} products with price history and alerts.")


if __name__ == "__main__":
    asyncio.run(seed())
