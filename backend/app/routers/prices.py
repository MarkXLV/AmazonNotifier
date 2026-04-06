from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import PriceAlert, PriceHistory, Product
from ..schemas import PriceAlertOut, PriceCheckResult, PriceHistoryOut
from ..services.price_checker import check_all_tracked, check_price_for_product

router = APIRouter(tags=["prices"])


@router.post("/prices/check", response_model=list[PriceCheckResult])
async def check_prices(db: AsyncSession = Depends(get_db)):
    results = await check_all_tracked(db)
    return results


@router.post("/prices/check/{product_id}", response_model=PriceCheckResult)
async def check_single_price(product_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return await check_price_for_product(product, db)


@router.get("/prices/history/{product_id}", response_model=list[PriceHistoryOut])
async def price_history(
    product_id: int,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PriceHistory)
        .where(PriceHistory.product_id == product_id)
        .order_by(PriceHistory.checked_at.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/alerts", response_model=list[PriceAlertOut])
async def get_alerts(
    unread_only: bool = Query(False),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PriceAlert)
        .options(selectinload(PriceAlert.product))
        .order_by(PriceAlert.created_at.desc())
        .limit(limit)
    )
    if unread_only:
        stmt = stmt.where(PriceAlert.is_read.is_(False))

    result = await db.execute(stmt)
    alerts = result.scalars().all()

    out = []
    for a in alerts:
        out.append(
            PriceAlertOut(
                id=a.id,
                product_id=a.product_id,
                product_name=a.product.name if a.product else None,
                old_price=a.old_price,
                new_price=a.new_price,
                is_read=a.is_read,
                created_at=a.created_at,
            )
        )
    return out


@router.patch("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    stmt = update(PriceAlert).where(PriceAlert.id == alert_id).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return {"detail": "Alert marked as read"}
