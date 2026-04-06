import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" },
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
export const addProduct = (url: string, category?: string, target_price?: number) =>
  api.post<Product>("/api/products", { url, category, target_price });
export const updateProduct = (id: number, data: { target_price?: number; category?: string }) =>
  api.patch<Product>(`/api/products/${id}`, data);
export const removeProduct = (id: number) => api.delete(`/api/products/${id}`);
export const getStats = () => api.get<DashboardStats>("/api/stats");

// Scraper
export const scrapeProducts = (query: string, maxResults = 20) =>
  api.post<ScrapedProduct[]>("/api/scrape", { query, max_results: maxResults });

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
