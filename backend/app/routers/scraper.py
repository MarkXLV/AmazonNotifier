from fastapi import APIRouter

from ..schemas import ScrapeRequest, ScrapedProduct
from ..services.normalizer import normalize_products
from ..services.scraper import search_amazon

router = APIRouter(tags=["scraper"])


@router.post("/scrape", response_model=list[dict])
async def scrape_products(body: ScrapeRequest):
    products = await search_amazon(body.query, body.max_results)
    normalized = normalize_products(products)
    return normalized
