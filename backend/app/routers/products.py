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

    out = []
    for p in products:
        hist_stmt = (
            select(PriceHistory.price)
            .where(PriceHistory.product_id == p.id)
            .order_by(PriceHistory.checked_at.desc())
            .limit(2)
        )
        hist_result = await db.execute(hist_stmt)
        recent_prices = hist_result.scalars().all()

        price_change = None
        if len(recent_prices) >= 2:
            price_change = recent_prices[0] - recent_prices[1]

        product_dict = ProductOut.model_validate(p).model_dump()
        product_dict["price_change"] = price_change
        out.append(ProductOut(**product_dict))

    return out


@router.post("/products", response_model=ProductOut)
async def add_product(body: ProductCreate, db: AsyncSession = Depends(get_db)):
    existing_stmt = select(Product).where(Product.url == body.url)
    existing = await db.execute(existing_stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Product already tracked")

    page = await fetch_product_page(body.url)
    if not page or page.get("price") is None:
        raise HTTPException(
            status_code=422,
            detail="Could not extract product data from the URL. Make sure it's a valid Amazon product page.",
        )

    product = Product(
        name=page["name"] or "Unknown Product",
        url=body.url,
        current_price=page["price"],
        original_price=page["price"],
        target_price=body.target_price,
        rating=page.get("rating"),
        review_count=page.get("review_count"),
        image_url=page.get("image_url"),
        category=body.category,
        is_tracked=True,
    )
    db.add(product)
    await db.flush()

    history = PriceHistory(product_id=product.id, price=page["price"])
    db.add(history)

    await db.commit()
    await db.refresh(product)
    return product


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
