import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import ScrapeRequest, ScrapeResponse
from ..services.normalizer import normalize_products
from ..services.scraper import search_amazon, search_catalog

router = APIRouter(tags=["scraper"])

logger = logging.getLogger(__name__)


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_products(body: ScrapeRequest, db: AsyncSession = Depends(get_db)):
    """Search Amazon live, falling back to the local catalog when it's blocked.

    Amazon blocks server-side scrapes from datacenter IPs, so live search often
    returns nothing. When that happens we search the seeded catalog instead so
    the feature always returns relevant results. `source` tells the UI which
    path produced the results.
    """
    source = "live"
    try:
        products = await search_amazon(body.query, body.max_results)
    except Exception:  # network error, timeout, block page, etc.
        logger.warning("Live Amazon search failed for '%s'", body.query, exc_info=True)
        products = []

    if not products:
        products = await search_catalog(body.query, db, body.max_results)
        source = "catalog"

    normalized = normalize_products(products)
    return {"source": source, "results": normalized}
