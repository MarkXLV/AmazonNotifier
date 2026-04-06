# Low-Level Design (LLD) -- PriceWatch

## 1. Database Schema

### 1.1 Entity-Relationship Diagram

```
┌──────────────────────────┐       ┌─────────────────────────┐
│        products          │       │     price_history       │
├──────────────────────────┤       ├─────────────────────────┤
│ id          PK  INT      │──┐    │ id          PK  INT     │
│ name            VARCHAR  │  │    │ product_id  FK  INT     │──► products.id
│ url             TEXT     │  │    │ price           FLOAT   │
│ image_url       TEXT     │  │    │ checked_at      DATETIME│
│ current_price   FLOAT   │  │    └─────────────────────────┘
│ original_price  FLOAT   │  │
│ target_price    FLOAT   │  │    ┌─────────────────────────┐
│ rating          FLOAT   │  │    │     price_alerts        │
│ review_count    INT     │  │    ├─────────────────────────┤
│ norm_rating     FLOAT   │  ├───►│ id          PK  INT     │
│ category        VARCHAR │  │    │ product_id  FK  INT     │──► products.id
│ is_tracked      BOOL    │  │    │ old_price       FLOAT   │
│ created_at      DATETIME│  │    │ new_price       FLOAT   │
│ updated_at      DATETIME│  │    │ is_read         BOOL    │
└──────────────────────────┘  │    │ email_sent      BOOL    │
                              │    │ created_at      DATETIME│
                              │    └─────────────────────────┘
                              │
                              │    ┌──────────────────────────┐
                              │    │ notification_settings    │
                              │    ├──────────────────────────┤
                              │    │ id              PK  INT  │
                              │    │ email               VARCHAR│
                              │    │ notify_on_drop      BOOL  │
                              │    │ notify_on_target    BOOL  │
                              │    │ updated_at          DATETIME│
                              │    └──────────────────────────┘
```

### 1.2 Table Details

**products** -- Core table storing tracked product metadata.
- `target_price`: user-set price threshold for alerts. NULL means no target.
- `is_tracked`: soft-delete flag. FALSE means user un-tracked the product.
- `norm_rating`: computed as `rating * (max_price / price) * (review_count / max_reviews)`.
- Relationships: one-to-many with `price_history` and `price_alerts` (CASCADE delete).

**price_history** -- Append-only log of every price observation.
- A new row is inserted every time a price check is performed (manual or scheduled).
- Used to render the price history chart on the frontend.

**price_alerts** -- Created only when a price _drop_ is detected.
- `email_sent`: TRUE if an email was successfully dispatched for this alert.
- `is_read`: toggled by the user from the dashboard/detail page.

**notification_settings** -- Singleton table (one row) storing user email preferences.
- `email`: the recipient address for price drop notifications.
- `notify_on_drop` / `notify_on_target`: toggles for notification types.

## 2. API Design

### 2.1 Endpoints

```
GET    /api/health                          → { status: "ok" }

GET    /api/products?category=&tracked_only=true  → Product[]
POST   /api/products        { url, category?, target_price? }  → Product
PATCH  /api/products/:id    { target_price?, category? }       → Product
DELETE /api/products/:id                    → { detail: "..." }

GET    /api/stats                           → DashboardStats

POST   /api/scrape           { query, max_results }            → ScrapedProduct[]

POST   /api/prices/check                    → PriceCheckResult[]
POST   /api/prices/check/:id               → PriceCheckResult
GET    /api/prices/history/:id?limit=50     → PriceHistory[]

GET    /api/alerts?unread_only=false&limit=20  → PriceAlert[]
PATCH  /api/alerts/:id/read                 → { detail: "..." }

GET    /api/notifications/settings          → NotificationSettings
PUT    /api/notifications/settings  { email, notify_on_drop, notify_on_target }
                                            → NotificationSettings
```

### 2.2 Request/Response Models (Pydantic)

```python
class ProductCreate:
    url: str
    category: str | None
    target_price: float | None

class ProductOut:
    id, name, url, image_url, current_price, original_price,
    target_price, rating, review_count, norm_rating, category,
    is_tracked, created_at, updated_at, price_change

class ScrapeRequest:
    query: str
    max_results: int = 20

class ScrapedProduct:
    name, price, rating, review_count, url, image_url

class PriceCheckResult:
    product_id, name, old_price, new_price, status, message
    # status: "dropped" | "same" | "increased" | "target_reached" | "error"

class PriceAlertOut:
    id, product_id, product_name, old_price, new_price,
    is_read, email_sent, created_at

class DashboardStats:
    total_tracked, price_drops_today, average_savings, email_enabled

class NotificationSettingsOut:
    id, email, notify_on_drop, notify_on_target, email_configured, updated_at
```

## 3. Service Layer

### 3.1 Scraper Service (`services/scraper.py`)

**Purpose**: Fetch and parse Amazon product data.

**Key design decisions**:
- Uses `httpx.AsyncClient` instead of Scrapy for lightweight, on-demand scraping.
- Visits Amazon homepage first to acquire session cookies (prevents 503 blocks).
- Uses `parsel.Selector` (same CSS selector API as Scrapy).
- Extracts ASIN from `data-asin` attribute for reliable product URLs.

```python
async def search_amazon(query, max_results) -> list[ScrapedProduct]:
    client = await _get_client()          # visits homepage for cookies
    response = await client.get("/s", params={"k": query})
    sel = Selector(text=response.text)
    items = sel.css('div[data-component-type="s-search-result"]')
    # For each item: extract name, price, rating, reviews, image, URL
    # URL construction: prefer /dp/ links, fall back to ASIN-based URL

async def fetch_product_page(url) -> dict | None:
    client = await _get_client()
    response = await client.get(url)
    # Extract: #productTitle, .a-price-whole, rating, reviews, image
```

**Parsing helpers**:
- `_parse_price(text)` -- strips commas/symbols, returns float
- `_parse_rating(text)` -- extracts "4.5" from "4.5 out of 5 stars"
- `_parse_review_count(text)` -- extracts digits from "(1,234)" or "1,234"
- `_extract_product_url(href)` -- extracts clean `/dp/ASIN` URL from href

### 3.2 Normalizer Service (`services/normalizer.py`)

**Purpose**: Compute a comparable score across products with different prices and review counts.

**Formula**:
```
norm_rating = rating * (max_price / price) * (review_count / max_reviews)
```

This rewards: high ratings, lower prices (relative to category), higher review counts.

**Edge cases**: skips products with zero price, missing rating, or zero reviews.

### 3.3 Price Checker Service (`services/price_checker.py`)

**Purpose**: Compare current Amazon price with stored price, create alerts, send emails.

**Flow for each product**:
```
1. fetch_product_page(product.url)
2. If fetch fails → return error result
3. Record new price in price_history
4. Update product.current_price
5. If new_price < old_price:
   a. Create PriceAlert record
   b. Check if target_price reached
   c. Look up notification email from DB
   d. If email configured → send_price_drop_email()
   e. Mark alert.email_sent = True if sent
6. Commit transaction
7. Return PriceCheckResult with status
```

### 3.4 Email Service (`services/email.py`)

**Purpose**: Send formatted HTML email notifications via SMTP.

**Implementation**:
- Uses `aiosmtplib` for async, non-blocking SMTP.
- Constructs a multipart email (plain text + HTML).
- HTML template: styled inline (no external CSS for email client compatibility).
- Includes: product name, old/new price, savings amount and percentage, Amazon link.
- Handles `start_tls=True` (works with Gmail, Outlook, etc.).

**Configuration**: Reads SMTP settings from environment variables via Pydantic Settings.
Email is only sent when `email_enabled=True` (auto-detected when SMTP credentials are present).

## 4. Scheduler (`scheduler.py`)

**Purpose**: Automatically check prices at regular intervals.

**Implementation**:
- Uses APScheduler `AsyncIOScheduler` with `IntervalTrigger`.
- Default interval: 360 minutes (6 hours), configurable via `PRICE_CHECK_INTERVAL_MINUTES`.
- Creates its own database session for each run.
- Calls `check_all_tracked()` which iterates all tracked products.
- Started during FastAPI lifespan startup, stopped on shutdown.

## 5. Frontend Architecture

### 5.1 Component Tree

```
App
├── Layout
│   ├── Navbar
│   └── <Outlet>
│       ├── Dashboard
│       │   ├── StatCards (inline)
│       │   ├── PriceAlertCard[]
│       │   └── ProductCard[]
│       ├── Search
│       │   ├── SearchForm
│       │   └── Result rows (inline)
│       ├── ProductDetail
│       │   ├── PriceChart
│       │   └── PriceAlertCard[]
│       └── Settings
```

### 5.2 State Management

No global state library. Each page manages its own state via `useState` + `useEffect`.
API calls use Axios with a centralized client instance (`api/client.ts`).

### 5.3 API Client Pattern

All API functions are exported from `api/client.ts`:
```typescript
export const getProducts = () => api.get<Product[]>("/api/products");
export const addProduct = (url, category?, target_price?) => api.post(...);
export const checkSinglePrice = (id) => api.post(...);
// etc.
```

The base URL is configurable via `VITE_API_URL` env var (empty in dev, backend URL in prod).
In development, Vite's proxy forwards `/api` requests to `localhost:8000`.

### 5.4 Key UI Components

**ProductCard**: Displays product image, name, price (with original/change), rating stars,
target price (inline editable), and action buttons (check price, open Amazon, untrack).

**PriceChart**: Recharts `AreaChart` with gradient fill. X-axis: dates, Y-axis: price.
Tooltip shows formatted INR price.

**PriceAlertCard**: Shows old→new price with savings, time ago, email-sent badge.

**SearchForm**: Input with search icon + submit button with loading spinner.

## 6. Error Handling Strategy

| Layer    | Strategy                                                       |
| -------- | -------------------------------------------------------------- |
| Scraper  | Returns empty list / None on failure; never raises to caller   |
| API      | HTTPException with 404/409/422 status codes + detail message   |
| Email    | Catches all exceptions; logs error; returns False              |
| Frontend | try/catch around API calls; graceful empty states              |
| Scheduler| Logs errors per-product; continues to next product             |

## 7. Security Considerations

- **No hardcoded secrets**: All credentials via environment variables.
- **SQL injection**: Eliminated by using SQLAlchemy ORM (parameterized queries).
- **CORS**: Restricted to configured frontend origin(s).
- **Input validation**: Pydantic models validate all request bodies.
- **SMTP credentials**: Never exposed via API; only `email_configured` boolean is returned.
- **User-Agent rotation**: Browser-like headers to avoid detection as bot.
