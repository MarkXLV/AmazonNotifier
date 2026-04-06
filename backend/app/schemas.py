import datetime

from pydantic import BaseModel


# --------------- Products ---------------

class ProductBase(BaseModel):
    name: str
    url: str
    current_price: float
    original_price: float | None = None
    target_price: float | None = None
    image_url: str | None = None
    rating: float | None = None
    review_count: int | None = None
    norm_rating: float | None = None
    category: str | None = None


class ProductCreate(BaseModel):
    url: str
    category: str | None = None
    target_price: float | None = None


class ProductUpdate(BaseModel):
    target_price: float | None = None
    category: str | None = None


class ProductOut(ProductBase):
    id: int
    is_tracked: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    price_change: float | None = None

    model_config = {"from_attributes": True}


# --------------- Scraper ---------------

class ScrapeRequest(BaseModel):
    query: str
    max_results: int = 20


class ScrapedProduct(BaseModel):
    name: str
    price: float | None = None
    rating: float | None = None
    review_count: int | None = None
    url: str
    image_url: str | None = None


# --------------- Prices ---------------

class PriceHistoryOut(BaseModel):
    id: int
    price: float
    checked_at: datetime.datetime

    model_config = {"from_attributes": True}


class PriceCheckResult(BaseModel):
    product_id: int
    name: str
    old_price: float
    new_price: float | None = None
    status: str  # "dropped", "same", "increased", "target_reached", "error"
    message: str


# --------------- Alerts ---------------

class PriceAlertOut(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    old_price: float
    new_price: float
    is_read: bool
    email_sent: bool = False
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# --------------- Stats ---------------

class DashboardStats(BaseModel):
    total_tracked: int
    price_drops_today: int
    average_savings: float
    email_enabled: bool


# --------------- Notifications ---------------

class NotificationSettingsIn(BaseModel):
    email: str = ""
    notify_on_drop: bool = True
    notify_on_target: bool = True


class NotificationSettingsOut(NotificationSettingsIn):
    id: int
    email_configured: bool = False
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
