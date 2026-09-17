import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ExternalLink,
  RefreshCw,
  TrendingDown,
  Target,
  Check,
} from "lucide-react";
import PriceChart from "../components/PriceChart";
import ProductThumb from "../components/ProductThumb";
import PriceAlertCard from "../components/PriceAlertCard";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import {
  getProduct,
  getPriceHistory,
  getAlerts,
  checkSinglePrice,
  markAlertRead,
  updateProduct,
  type Product,
  type PriceHistoryEntry,
  type PriceAlert,
} from "../api/client";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { notify } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, histRes, alertsRes] = await Promise.all([
        getProduct(productId),
        getPriceHistory(productId),
        getAlerts(),
      ]);
      setProduct(prodRes.data);
      setTargetValue(prodRes.data.target_price?.toString() || "");
      setHistory(histRes.data);
      setAlerts(alertsRes.data.filter((a) => a.product_id === productId));
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCheckPrice = async () => {
    setChecking(true);
    try {
      const res = await checkSinglePrice(productId);
      if (res.data.status === "dropped" || res.data.status === "target_reached") {
        notify("Price dropped!", "success");
      }
      await refresh();
    } catch {
      notify("Couldn't check the price right now.", "error");
    } finally {
      setChecking(false);
    }
  };

  const handleMarkRead = async (alertId: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
    await markAlertRead(alertId);
  };

  const handleSaveTarget = async () => {
    const val = parseFloat(targetValue);
    if (!isNaN(val) && val > 0) {
      await updateProduct(productId, { target_price: val });
      if (product) setProduct({ ...product, target_price: val });
      notify("Target price saved.", "success");
    }
    setEditingTarget(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-6 md:flex-row">
          <Skeleton className="h-64 w-full rounded-2xl md:w-80" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-11 w-48" />
          </div>
        </div>
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted">
        <p>Product not found.</p>
        <Link
          to="/"
          className="text-sm font-semibold text-savings-ink hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const discount =
    product.original_price && product.original_price > product.current_price
      ? Math.round(
          ((product.original_price - product.current_price) /
            product.original_price) *
            100
        )
      : null;

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-col md:flex-row">
          <div className="flex h-64 items-center justify-center bg-gradient-to-br from-surface-2 to-line p-6 md:h-auto md:w-80">
            <ProductThumb
              src={product.image_url}
              alt={product.name}
              iconSize={72}
              imgClassName="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="flex flex-1 flex-col p-6 md:p-8">
            {product.category && (
              <span className="mb-3 inline-block w-fit rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
                {product.category}
              </span>
            )}
            <h1 className="text-xl font-semibold leading-snug tracking-tight text-ink md:text-2xl">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="tnum font-display text-4xl font-bold tracking-tight text-ink">
                {formatPrice(product.current_price)}
              </span>
              {product.original_price &&
                product.original_price !== product.current_price && (
                  <span className="tnum text-lg text-faint line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              {discount && (
                <span className="tnum rounded-full bg-savings-soft px-2.5 py-1 text-sm font-bold text-savings-ink">
                  −{discount}%
                </span>
              )}
            </div>

            {/* Target */}
            <div className="mt-4">
              {editingTarget ? (
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-savings-ink" />
                  <span className="text-sm text-muted">Target:</span>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="tnum w-32 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-savings focus:ring-[3px] focus:ring-[var(--ring)]"
                    placeholder="₹"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
                  />
                  <button
                    onClick={handleSaveTarget}
                    className="rounded-lg bg-savings-soft p-2 text-savings-ink hover:opacity-80"
                    aria-label="Save target"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingTarget(true)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    product.target_price ? "text-savings-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  <Target size={16} />
                  {product.target_price
                    ? `Target ${formatPrice(product.target_price)}`
                    : "Set a target price to get notified"}
                </button>
              )}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(product.rating!)
                          ? "fill-star text-star"
                          : "fill-line text-line"
                      }
                    />
                  ))}
                </div>
                <span className="font-semibold text-ink">{product.rating}</span>
                {product.review_count && (
                  <span className="text-faint">
                    ({product.review_count.toLocaleString("en-IN")} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
              <button
                onClick={handleCheckPrice}
                disabled={checking}
                className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
                Check price now
              </button>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                <ExternalLink size={16} />
                View on Amazon
              </a>
            </div>
          </div>
        </div>
      </div>

      <PriceChart data={history} />

      {alerts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <TrendingDown size={18} className="text-savings-ink" />
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              Price drop history
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {alerts.map((a) => (
              <PriceAlertCard key={a.id} alert={a} onMarkRead={handleMarkRead} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
