# PriceWatch - Amazon Price Tracker

A full-stack web application that tracks Amazon product prices, sends email notifications on price drops, and helps you buy at the best time. Built with FastAPI, React, and PostgreSQL.

## Features

- **Search Amazon** -- search for any product and view results with prices, ratings, and normalized scores
- **Track Products** -- add products to your watchlist with one click
- **Target Price** -- set a target price on any product and get alerted when it's reached
- **Price Monitoring** -- check current prices manually or let the scheduler do it automatically (every 6 hours)
- **Price History** -- interactive chart of price changes over time
- **Email Notifications** -- receive email alerts on price drops via SMTP (Gmail, Outlook, etc.)
- **Price Drop Alerts** -- dashboard notifications with savings amount and percentage
- **Dashboard** -- overview of all tracked products with stats (tracked count, drops today, avg savings)

## Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Frontend  | React 18, TypeScript, Tailwind CSS, Recharts  |
| Backend   | FastAPI, SQLAlchemy, httpx, parsel            |
| Database  | SQLite (dev) / PostgreSQL (prod)              |
| Email     | aiosmtplib (async SMTP)                       |
| Scheduler | APScheduler (background price checks)         |
| Deploy    | Render (Blueprint)                            |

## Project Structure

```
AmazonNotifier/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py           # App entry + lifespan
│   │   ├── config.py         # Environment settings
│   │   ├── database.py       # SQLAlchemy async engine
│   │   ├── models.py         # Product, PriceHistory, PriceAlert, NotificationSettings
│   │   ├── schemas.py        # Pydantic models
│   │   ├── scheduler.py      # APScheduler background jobs
│   │   ├── routers/          # API route handlers
│   │   └── services/         # Scraper, normalizer, price checker, email
│   ├── requirements.txt
│   └── Procfile
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── api/client.ts     # API client (Axios)
│   │   ├── components/       # Navbar, ProductCard, PriceChart, etc.
│   │   └── pages/            # Dashboard, Search, ProductDetail, Settings
│   ├── index.html
│   └── package.json
├── doc/                      # Documentation
│   ├── hld.md                # High-Level Design
│   └── lld.md                # Low-Level Design
├── legacy/                   # Original Scrapy code (reference)
├── render.yaml               # Render deployment blueprint
├── .env.example              # Environment variable template
└── README.md
```

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) PostgreSQL -- SQLite is used by default for local development

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp ../.env.example .env
# Edit .env if needed (SQLite works out of the box)

uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` with API requests proxied to the backend.

### 3. Email Setup (Optional)

To enable email notifications, add SMTP credentials to your `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

For Gmail, generate an App Password at https://myaccount.google.com/apppasswords.

Then go to the Settings page in the UI and enter the email address where you want to receive alerts.

## Deployment on Render

### One-Click Deploy

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** -> **Blueprint**
4. Connect your GitHub repo
5. Render reads `render.yaml` and creates all services:
   - **pricewatch-db** -- Free PostgreSQL database
   - **pricewatch-api** -- Python web service (backend)
   - **pricewatch-ui** -- Static site (frontend)
6. After deploy, update `CORS_ORIGINS` on the backend to match your frontend URL
7. Update `VITE_API_URL` on the frontend to match your backend URL
8. (Optional) Add SMTP env vars on the backend for email notifications

### Environment Variables

| Variable                       | Where    | Required | Description                                   |
| ------------------------------ | -------- | -------- | --------------------------------------------- |
| `DATABASE_URL`                 | Backend  | Yes      | PostgreSQL connection string (auto by Render)  |
| `CORS_ORIGINS`                 | Backend  | Yes      | JSON array of allowed frontend origins         |
| `SMTP_HOST`                    | Backend  | No       | SMTP server hostname                           |
| `SMTP_PORT`                    | Backend  | No       | SMTP port (default: 587)                       |
| `SMTP_USER`                    | Backend  | No       | SMTP username                                  |
| `SMTP_PASSWORD`                | Backend  | No       | SMTP password / app password                   |
| `EMAIL_FROM`                   | Backend  | No       | Sender email address                           |
| `PRICE_CHECK_INTERVAL_MINUTES` | Backend  | No       | Auto-check interval (default: 360 = 6h)        |
| `VITE_API_URL`                 | Frontend | Yes      | Backend URL (e.g. `https://api.onrender.com`)  |

## API Endpoints

| Method   | Endpoint                          | Description                    |
| -------- | --------------------------------- | ------------------------------ |
| `GET`    | `/api/health`                     | Health check                   |
| `GET`    | `/api/products`                   | List tracked products          |
| `POST`   | `/api/products`                   | Add product by URL             |
| `PATCH`  | `/api/products/{id}`              | Update target price / category |
| `DELETE` | `/api/products/{id}`              | Untrack a product              |
| `GET`    | `/api/stats`                      | Dashboard statistics           |
| `POST`   | `/api/scrape`                     | Search Amazon for products     |
| `POST`   | `/api/prices/check`               | Check all tracked prices       |
| `POST`   | `/api/prices/check/{id}`          | Check single product price     |
| `GET`    | `/api/prices/history/{id}`        | Price history for a product    |
| `GET`    | `/api/alerts`                     | List price drop alerts         |
| `PATCH`  | `/api/alerts/{id}/read`           | Mark alert as read             |
| `GET`    | `/api/notifications/settings`     | Get notification preferences   |
| `PUT`    | `/api/notifications/settings`     | Update email & preferences     |

## Documentation

- [High-Level Design (HLD)](doc/hld.md) -- Architecture, system components, deployment
- [Low-Level Design (LLD)](doc/lld.md) -- Database schema, API contracts, service internals

## License

MIT
