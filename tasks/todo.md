# PriceWatch — UI Overhaul + Perf & Search Fixes

## A — Backend performance
- [x] A1: Kill N+1 in `list_products` (single window-function query) — verified 15ms
- [x] A2: Add DB indexes (models + idempotent CREATE INDEX in init_db) — 4 indexes created
- [x] A5: Add `GET /api/products/{id}` — verified (+404)
- [x] A3: Progressive dashboard render + skeletons + axios timeout/warm-up hint

## B — Search reliability
- [x] B1: `search_catalog` + live→catalog fallback in `/api/scrape` (`{source, results}`) — verified (Amazon 503 → catalog)
- [x] B2: Track without live scrape (re-track existing, accept known data) — verified
- [x] B3: Surface real errors + fallback banner in Search.tsx

## C — UI overhaul (design-first)
- [x] C1: `/design` canvas mockups (approved: "Warm Editorial") + self-review fixes
- [x] C2: Design-system foundation (tokens, Space Grotesk + Instrument Sans, light/dark toggle)
- [x] C3: Rebuild all components + skeletons + toast + image fallback

## Verification (all done)
- [x] Perf: GET /api/products ~15ms (was N+1), 4 indexes confirmed, dashboard streams in with skeletons
- [x] Search: live works from residential IP (16 results); catalog fallback on Amazon 503; track works offline; errors surfaced
- [x] UI: light + dark verified on dashboard/detail/search; chart renders (825-char area path); `npm run build` passes
- [x] Ran locally: backend :8000 + vite :5173, screenshots confirm design matches mockups

## Review

**Backend (`backend/app/`)**
- `routers/products.py` — `list_products` N+1 → single window-function query; `add_product` re-tracks + accepts known data (no scrape); new `GET /products/{id}`.
- `models.py` + `database.py` — composite/single indexes + idempotent `CREATE INDEX IF NOT EXISTS` at startup.
- `services/scraper.py` — `search_catalog()`, 8s timeout; `routers/scraper.py` — live→catalog fallback returning `{source, results}`.

**Frontend (`frontend/src/`)**
- `index.css` — token-based "Warm Editorial" design system w/ Tailwind v4 `@theme inline`, light/dark, skeleton shimmer.
- `theme.tsx`, `components/Toast.tsx`, `components/Skeleton.tsx`, `components/ProductThumb.tsx` (image onError fallback) — new.
- Rebuilt: Navbar (theme toggle), Layout, ProductCard, PriceAlertCard, PriceChart (own ResizeObserver), SearchForm, Dashboard (progressive), Search (fallback banner + errors), ProductDetail (uses `getProduct`), Settings.
- `index.html` — fonts + anti-FOUC theme boot; `api/client.ts` — 60s timeout, `{source,results}`, flexible `addProduct`, `getProduct`.

**Decisions:** search kept as free scrape + catalog fallback (no paid scraping API). Figma MCP unavailable (OAuth) → used `/design` skill.

**Not changed / future:** optional `SCRAPER_API_KEY` path for reliable server-side live data (declined for now); recharts bundle is large (could code-split).
