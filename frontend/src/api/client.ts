import axios from "axios";

// Deployed backend (Render). Used as the default so a production build talks to
// the live API even if VITE_API_URL isn't set.
const DEPLOYED_API_URL = "https://pricewatch-api-ovoj.onrender.com";

// API base URL resolution:
//   1. VITE_API_URL when provided (render.yaml sets it in production).
//   2. During local dev (`npm run dev`): "" so requests hit the Vite proxy → localhost:8000.
//   3. Otherwise (production build): the deployed backend.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "" : DEPLOYED_API_URL);

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  // Generous timeout: the free-tier backend can cold-start (~50s) after idle.
  timeout: 60000,
});

export interface Product {
  id: number;
  name: string;
  url: string;
  image_url: string | null;
  current_price: number;
  original_price: number | null;
  target_price: number | null;
  rating: number | null;
  review_count: number | null;
  norm_rating: number | null;
  category: string | null;
  is_tracked: boolean;
  created_at: string;
  updated_at: string;
  price_change: number | null;
}

export interface ScrapedProduct {
  name: string;
  price: number | null;
  rating: number | null;
  review_count: number | null;
  url: string;
  image_url: string | null;
  norm_rating: number | null;
}

export interface ScrapeResponse {
  /** "live" = fetched from Amazon, "catalog" = local fallback when Amazon blocks. */
  source: "live" | "catalog";
  results: ScrapedProduct[];
}

export interface PriceHistoryEntry {
  id: number;
  price: number;
  checked_at: string;
}

export interface PriceAlert {
  id: number;
  product_id: number;
  product_name: string | null;
  old_price: number;
  new_price: number;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export interface PriceCheckResult {
  product_id: number;
  name: string;
  old_price: number;
  new_price: number | null;
  status: string;
  message: string;
}

export interface DashboardStats {
  total_tracked: number;
  price_drops_today: number;
  average_savings: number;
  email_enabled: boolean;
}

export interface NotificationSettings {
  id: number;
  email: string;
  notify_on_drop: boolean;
  notify_on_target: boolean;
  email_configured: boolean;
  updated_at: string;
}

// Products
export const getProducts = () => api.get<Product[]>("/api/products");
export const getProduct = (id: number) => api.get<Product>(`/api/products/${id}`);

export interface AddProductInput {
  url: string;
  category?: string;
  target_price?: number;
  // Known data (e.g. from a catalog result) lets the backend skip a live scrape.
  name?: string;
  price?: number;
  image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
}
export const addProduct = (input: AddProductInput) =>
  api.post<Product>("/api/products", input);
export const updateProduct = (id: number, data: { target_price?: number; category?: string }) =>
  api.patch<Product>(`/api/products/${id}`, data);
export const removeProduct = (id: number) => api.delete(`/api/products/${id}`);
export const getStats = () => api.get<DashboardStats>("/api/stats");

// Scraper
export const scrapeProducts = (query: string, maxResults = 20) =>
  api.post<ScrapeResponse>("/api/scrape", { query, max_results: maxResults });

// Prices
export const checkAllPrices = () =>
  api.post<PriceCheckResult[]>("/api/prices/check");
export const checkSinglePrice = (id: number) =>
  api.post<PriceCheckResult>(`/api/prices/check/${id}`);
export const getPriceHistory = (id: number) =>
  api.get<PriceHistoryEntry[]>(`/api/prices/history/${id}`);

// Alerts
export const getAlerts = (unreadOnly = false) =>
  api.get<PriceAlert[]>("/api/alerts", { params: { unread_only: unreadOnly } });
export const markAlertRead = (id: number) =>
  api.patch(`/api/alerts/${id}/read`);

// Notifications
export const getNotificationSettings = () =>
  api.get<NotificationSettings>("/api/notifications/settings");
export const updateNotificationSettings = (data: {
  email: string;
  notify_on_drop: boolean;
  notify_on_target: boolean;
}) => api.put<NotificationSettings>("/api/notifications/settings", data);

export default api;
