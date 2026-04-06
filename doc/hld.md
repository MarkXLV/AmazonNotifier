# High-Level Design (HLD) -- PriceWatch

## 1. Overview

PriceWatch is a full-stack web application that tracks Amazon India product prices and notifies users when prices drop. Users can search Amazon, track products, set target prices, and receive email alerts automatically.

## 2. Architecture

```
                 ┌────────────────────────────────────────────────────────┐
                 │                   Render Cloud                        │
                 │                                                       │
  Browser ──────►│  ┌──────────────┐    REST API    ┌──────────────────┐ │
                 │  │  React SPA   │ ──────────────►│  FastAPI Backend │ │
                 │  │ (Static Site)│                 │  (Web Service)   │ │
                 │  └──────────────┘                 └────────┬─────┬──┘ │
                 │                                        │         │    │
                 │                                   SQLAlchemy   httpx  │
                 │                                        │         │    │
                 │                                   ┌────▼───┐     │    │
                 │                                   │ PostgreSQL│   │    │
                 │                                   │ (Managed)│    │    │
                 │                                   └─────────┘    │    │
                 └──────────────────────────────────────────────────┘    │
                                                                        │
                                                              ┌─────────▼──────────┐
                                                              │   Amazon.in        │
                                                              │   (Product Pages)  │
                                                              └────────────────────┘
```

## 3. System Components

### 3.1 Frontend (React SPA)

- **Runtime**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v6
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Hosting**: Render Static Site (or any CDN)

Serves four pages: Dashboard, Search, Product Detail, Settings.
Communicates with the backend exclusively through REST API calls.

### 3.2 Backend (FastAPI)

- **Runtime**: Python 3.11+ / FastAPI
- **ORM**: SQLAlchemy 2.0 (async)
- **Scraping**: httpx + parsel (CSS selectors)
- **Email**: aiosmtplib (async SMTP)
- **Scheduler**: APScheduler (background price checks)
- **Hosting**: Render Web Service

Exposes REST endpoints under `/api/`. Handles scraping, data persistence, price comparison, email dispatch, and scheduled background tasks.

### 3.3 Database

- **Local**: SQLite (zero-config, file-based)
- **Production**: PostgreSQL (Render managed, free tier)
- **ORM**: SQLAlchemy with async drivers (aiosqlite / psycopg)

Four tables: `products`, `price_history`, `price_alerts`, `notification_settings`.

### 3.4 External Services

| Service        | Purpose                              |
| -------------- | ------------------------------------ |
| Amazon.in      | Product search and price scraping    |
| SMTP (Gmail)   | Email notifications on price drops   |
| Render         | Hosting (frontend + backend + DB)    |

## 4. Key Flows

### 4.1 Product Search & Tracking

```
User searches "iphones"
    → Frontend POST /api/scrape
    → Backend visits Amazon.in homepage (session cookies)
    → Backend fetches search results page
    → parsel extracts product data (name, price, rating, reviews, image, URL)
    → Normalizer computes normalized rating scores
    → Response returned to frontend as JSON
    → User clicks "Track" on a product
    → Frontend POST /api/products { url }
    → Backend fetches product page, extracts details
    → Saves to products table + initial price_history entry
```

### 4.2 Price Check & Notification

```
Trigger: manual button click OR scheduled job (every 6h)
    → Backend iterates all tracked products
    → For each: fetch product page, extract current price
    → Compare with stored current_price
    → If dropped:
        → Create PriceAlert record
        → If target_price set and reached: flag as "target_reached"
        → If notification email configured: send email via SMTP
        → Update current_price in products table
    → Record new price in price_history table
```

### 4.3 Scheduled Background Check

```
App startup
    → APScheduler starts with IntervalTrigger (default: 360 min)
    → Every 6 hours: runs check_all_tracked()
    → Creates DB session, checks each product, sends emails
    → Logs results
```

## 5. Deployment Architecture

### Render Blueprint (render.yaml)

Three services provisioned automatically:

1. **pricewatch-db** -- PostgreSQL (free tier)
2. **pricewatch-api** -- Python web service
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Env: DATABASE_URL (auto-injected), CORS_ORIGINS, SMTP_*
3. **pricewatch-ui** -- Static site
   - Build: `npm install && npm run build`
   - Publish: `dist/`
   - Env: VITE_API_URL

### Environment Variables

| Variable                       | Component | Required |
| ------------------------------ | --------- | -------- |
| DATABASE_URL                   | Backend   | Yes      |
| CORS_ORIGINS                   | Backend   | Yes      |
| SMTP_HOST / SMTP_PORT          | Backend   | No       |
| SMTP_USER / SMTP_PASSWORD      | Backend   | No       |
| EMAIL_FROM                     | Backend   | No       |
| PRICE_CHECK_INTERVAL_MINUTES   | Backend   | No       |
| VITE_API_URL                   | Frontend  | Yes      |

## 6. Non-Functional Requirements

| Aspect          | Approach                                               |
| --------------- | ------------------------------------------------------ |
| Scalability     | Stateless backend; can scale horizontally               |
| Reliability     | Graceful error handling on scrape failures              |
| Security        | No hardcoded credentials; env-based config; CORS        |
| Performance     | Async I/O throughout; connection pooling                |
| Observability   | Python logging; Render log aggregation                  |
| Cost            | Render free tier for all three services                 |

## 7. Future Enhancements

- WebSocket/SSE for real-time price updates on the dashboard
- Multi-user authentication (OAuth2 / JWT)
- Browser push notifications (Web Push API)
- Price prediction using historical data
- Support for multiple e-commerce sites (Flipkart, etc.)
- Telegram / Slack / Discord notification channels
- CSV/PDF export of tracked products and price history
