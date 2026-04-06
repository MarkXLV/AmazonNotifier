import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import NotificationSettings, PriceAlert, PriceHistory, Product
from ..schemas import PriceCheckResult
from .email import send_price_drop_email
from .scraper import fetch_product_page

logger = logging.getLogger(__name__)


async def _get_notification_email(db: AsyncSession) -> str:
    stmt = select(NotificationSettings).limit(1)
    result = await db.execute(stmt)
    ns = result.scalar_one_or_none()
    return ns.email if ns and ns.email else ""


async def check_price_for_product(product: Product, db: AsyncSession) -> PriceCheckResult:
    try:
        page_data = await fetch_product_page(product.url)
    except Exception as exc:
        logger.error("Failed to fetch %s: %s", product.url, exc)
        return PriceCheckResult(
            product_id=product.id,
            name=product.name,
            old_price=product.current_price,
            new_price=None,
            status="error",
            message=f"Could not fetch product page: {exc}",
        )

    if not page_data or page_data.get("price") is None:
        return PriceCheckResult(
            product_id=product.id,
            name=product.name,
            old_price=product.current_price,
            new_price=None,
            status="error",
            message="Could not extract price from product page",
        )

    new_price = page_data["price"]
    old_price = product.current_price

    history = PriceHistory(product_id=product.id, price=new_price)
    db.add(history)
    product.current_price = new_price

    target_reached = (
        product.target_price is not None
        and new_price <= product.target_price
        and old_price > product.target_price
    )

    if new_price < old_price:
        savings = old_price - new_price
        if target_reached:
            status = "target_reached"
            message = f"Target price reached! ₹{new_price:,.0f} is at or below your target of ₹{product.target_price:,.0f}"
        else:
            status = "dropped"
            message = f"Price dropped by ₹{savings:,.0f}! Go buy {product.name}!"

        alert = PriceAlert(product_id=product.id, old_price=old_price, new_price=new_price)
        db.add(alert)
        await db.flush()

        notify_email = await _get_notification_email(db)
        if notify_email:
            sent = await send_price_drop_email(
                to_email=notify_email,
                product_name=product.name,
                old_price=old_price,
                new_price=new_price,
                product_url=product.url,
                target_reached=target_reached,
            )
            if sent:
                alert.email_sent = True

    elif new_price > old_price:
        status = "increased"
        message = f"Price increased by ₹{new_price - old_price:,.0f}"
    else:
        status = "same"
        message = "Price hasn't changed"

    await db.commit()

    return PriceCheckResult(
        product_id=product.id,
        name=product.name,
        old_price=old_price,
        new_price=new_price,
        status=status,
        message=message,
    )


async def check_all_tracked(db: AsyncSession) -> list[PriceCheckResult]:
    stmt = select(Product).where(Product.is_tracked.is_(True))
    result = await db.execute(stmt)
    products = result.scalars().all()

    results: list[PriceCheckResult] = []
    for product in products:
        r = await check_price_for_product(product, db)
        results.append(r)

    return results
