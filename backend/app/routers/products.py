import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import PriceAlert, PriceHistory, Product
from ..schemas import DashboardStats, ProductCreate, ProductOut, ProductUpdate
from ..services.scraper import fetch_product_page

router = APIRouter(tags=["products"])


@router.get("/products", response_model=list[ProductOut])
async def list_products(
    category: str | None = Query(None),
    tracked_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).order_by(Product.updated_at.desc())
    if tracked_only:
        stmt = stmt.where(Product.is_tracked.is_(True))
    if category:
        stmt = stmt.where(Product.category == category)

    result = await db.execute(stmt)
    products = result.scalars().all()

    if not products:
        return []

    # Fetch the two most-recent prices for *all* products in a single query
    # (window function) instead of one query per product. `price_change` is the
    # latest price minus the previous one.
    product_ids = [p.id for p in products]
    row_number = (
        func.row_number()
        .over(
            partition_by=PriceHistory.product_id,
            order_by=PriceHistory.checked_at.desc(),
        )
        .label("rn")
    )
    ranked = (
        select(PriceHistory.product_id, PriceHistory.price, row_number)
        .where(PriceHistory.product_id.in_(product_ids))
        .subquery()
    )
    recent_stmt = (
        select(ranked.c.product_id, ranked.c.price)
        .where(ranked.c.rn <= 2)
        .order_by(ranked.c.product_id, ranked.c.rn)
    )
    recent_rows = (await db.execute(recent_stmt)).all()

    recent_by_product: dict[int, list[float]] = {}
    for product_id, price in recent_rows:
        recent_by_product.setdefault(product_id, []).append(price)

    out = []
    for p in products:
        prices = recent_by_product.get(p.id, [])
        item = ProductOut.model_validate(p)
        item.price_change = prices[0] - prices[1] if len(prices) >= 2 else None
        out.append(item)

    return out


@router.post("/products", response_model=ProductOut)
async def add_product(body: ProductCreate, db: AsyncSession = Depends(get_db)):
    existing_stmt = select(Product).where(Product.url == body.url)
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        # Already in the catalog — re-track (rather than 409) so search results
        # for known products can be tracked with one click.
        existing.is_tracked = True
        if body.target_price is not None:
            existing.target_price = body.target_price
        if body.category is not None:
            existing.category = body.category
        await db.commit()
        await db.refresh(existing)
        return existing

    # Prefer caller-supplied data (e.g. a catalog search result) to avoid a
    # live product-page scrape; fall back to scraping only when price is unknown.
    name = body.name
    price = body.price
    image_url = body.image_url
    rating = body.rating
    review_count = body.review_count

    if price is None:
        page = await fetch_product_page(body.url)
        if not page or page.get("price") is None:
            raise HTTPException(
                status_code=422,
                detail="Could not extract product data from the URL. Make sure it's a valid Amazon product page.",
            )
        name = name or page.get("name")
        price = page["price"]
        image_url = image_url or page.get("image_url")
        rating = rating if rating is not None else page.get("rating")
        review_count = review_count if review_count is not None else page.get("review_count")

    product = Product(
        name=name or "Unknown Product",
        url=body.url,
        current_price=price,
        original_price=price,
        target_price=body.target_price,
        rating=rating,
        review_count=review_count,
        image_url=image_url,
        category=body.category,
        is_tracked=True,
    )
    db.add(product)
    await db.flush()

    history = PriceHistory(product_id=product.id, price=price)
    db.add(history)

    await db.commit()
    await db.refresh(product)
    return product


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id)
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    hist_stmt = (
        select(PriceHistory.price)
        .where(PriceHistory.product_id == product_id)
        .order_by(PriceHistory.checked_at.desc())
        .limit(2)
    )
    recent_prices = (await db.execute(hist_stmt)).scalars().all()

    item = ProductOut.model_validate(product)
    item.price_change = (
        recent_prices[0] - recent_prices[1] if len(recent_prices) >= 2 else None
    )
    return item


@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if body.target_price is not None:
        product.target_price = body.target_price
    if body.category is not None:
        product.category = body.category

    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_tracked = False
    await db.commit()
    return {"detail": "Product untracked"}


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_stmt = select(func.count()).select_from(Product).where(Product.is_tracked.is_(True))
    total = (await db.execute(total_stmt)).scalar() or 0

    today = datetime.datetime.now(datetime.timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    drops_stmt = (
        select(func.count())
        .select_from(PriceAlert)
        .where(PriceAlert.created_at >= today)
    )
    drops = (await db.execute(drops_stmt)).scalar() or 0

    savings_stmt = select(
        func.avg(PriceAlert.old_price - PriceAlert.new_price)
    ).where(PriceAlert.created_at >= today)
    avg_savings = (await db.execute(savings_stmt)).scalar() or 0.0

    return DashboardStats(
        total_tracked=total,
        price_drops_today=drops,
        average_savings=round(float(avg_savings), 2),
        email_enabled=settings.email_enabled,
    )
