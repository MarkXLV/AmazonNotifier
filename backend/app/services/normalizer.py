from ..schemas import ScrapedProduct


def compute_norm_rating(
    price: float,
    rating: float,
    review_count: int,
    max_price: float,
    max_reviews: int,
) -> float:
    if price <= 0 or max_reviews <= 0:
        return 0.0
    return round(rating * (max_price / price) * (review_count / max_reviews), 2)


def normalize_products(products: list[ScrapedProduct]) -> list[dict]:
    """Compute normalized ratings for a batch of scraped products.

    Returns a list of dicts with the original fields plus `norm_rating`,
    sorted by norm_rating descending.
    """
    valid = [
        p for p in products
        if p.price and p.price > 0 and p.rating and p.review_count and p.review_count > 0
    ]

    if not valid:
        return [
            {**p.model_dump(), "norm_rating": None}
            for p in products
        ]

    max_price = max(p.price for p in valid)  # type: ignore[arg-type]
    max_reviews = max(p.review_count for p in valid)  # type: ignore[arg-type]

    result = []
    for p in products:
        if p.price and p.price > 0 and p.rating and p.review_count and p.review_count > 0:
            nr = compute_norm_rating(p.price, p.rating, p.review_count, max_price, max_reviews)
        else:
            nr = None
        result.append({**p.model_dump(), "norm_rating": nr})

    result.sort(key=lambda x: x.get("norm_rating") or 0, reverse=True)
    return result
