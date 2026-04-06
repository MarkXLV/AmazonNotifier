import logging
import re

import httpx
from parsel import Selector

from ..config import settings
from ..schemas import ScrapedProduct

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
    "Sec-Ch-Ua": '"Chromium";v="131", "Google Chrome";v="131"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
}


def _parse_price(text: str) -> float | None:
    if not text:
        return None
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_rating(text: str) -> float | None:
    if not text:
        return None
    match = re.match(r"([\d.]+)", text.strip())
    return float(match.group(1)) if match else None


def _parse_review_count(text: str) -> int | None:
    if not text:
        return None
    cleaned = re.sub(r"[^\d]", "", text)
    return int(cleaned) if cleaned else None


def _extract_product_url(href: str) -> str:
    """Extract a clean Amazon product URL from a raw href."""
    if not href:
        return ""
    if "/dp/" in href:
        match = re.search(r"(/[^/]*/dp/[A-Z0-9]{10})", href)
        if match:
            return f"{settings.amazon_base_url}{match.group(1)}"
    if href.startswith("/"):
        return f"{settings.amazon_base_url}{href.split('?')[0]}"
    if href.startswith("http"):
        return href.split("?")[0]
    return ""


async def _get_client() -> httpx.AsyncClient:
    """Create a client and warm it with a homepage visit to get session cookies."""
    client = httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=30)
    try:
        await client.get(settings.amazon_base_url + "/")
    except Exception:
        pass
    return client


async def search_amazon(query: str, max_results: int = 20) -> list[ScrapedProduct]:
    url = f"{settings.amazon_base_url}/s"
    params = {"k": query}

    client = await _get_client()
    try:
        response = await client.get(url, params=params)
    finally:
        await client.aclose()

    if response.status_code != 200:
        logger.warning("Amazon returned status %d for query '%s'", response.status_code, query)
        return []

    sel = Selector(text=response.text)
    results: list[ScrapedProduct] = []

    items = sel.css('div[data-component-type="s-search-result"]')

    for item in items[:max_results]:
        name = " ".join(item.css("h2 *::text").getall()).strip()
        if not name:
            continue

        price_whole = item.css(".a-price-whole::text").get("")
        price = _parse_price(price_whole)

        rating_text = item.css(".a-icon-alt::text").get("")
        rating = _parse_rating(rating_text)

        review_text = (
            item.css('a[href*="customerReviews"] span::text').get("")
            or item.css(".s-link-style .s-underline-text::text").get("")
        )
        review_count = _parse_review_count(review_text)

        # Build URL: prefer /dp/ links, fall back to constructing from ASIN
        dp_hrefs = [h for h in item.css("a.a-link-normal::attr(href)").getall() if "/dp/" in h]
        if dp_hrefs:
            product_url = _extract_product_url(dp_hrefs[0])
        else:
            asin = item.attrib.get("data-asin", "")
            product_url = f"{settings.amazon_base_url}/dp/{asin}" if asin else ""

        image_url = item.css("img.s-image::attr(src)").get()

        results.append(
            ScrapedProduct(
                name=name,
                price=price,
                rating=rating,
                review_count=review_count,
                url=product_url,
                image_url=image_url,
            )
        )

    return results


async def fetch_product_page(url: str) -> dict | None:
    """Fetch a single product page and extract price + details."""
    client = await _get_client()
    try:
        response = await client.get(url)
    finally:
        await client.aclose()

    if response.status_code != 200:
        return None

    sel = Selector(text=response.text)

    price_whole = sel.css(".a-price-whole::text").get("")
    price = _parse_price(price_whole)

    name_parts = sel.css("#productTitle::text").getall()
    name = " ".join(p.strip() for p in name_parts).strip()

    rating_text = sel.css("#acrPopover .a-icon-alt::text, .a-icon-alt::text").get("")
    rating = _parse_rating(rating_text)

    review_text = sel.css("#acrCustomerReviewText::text").get("")
    review_count = _parse_review_count(review_text)

    image_url = sel.css("#landingImage::attr(src), #imgBlkFront::attr(src)").get()

    return {
        "name": name,
        "price": price,
        "rating": rating,
        "review_count": review_count,
        "image_url": image_url,
    }
