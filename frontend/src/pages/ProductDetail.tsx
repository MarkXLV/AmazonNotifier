import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ExternalLink,
  RefreshCw,
  Loader2,
  TrendingDown,
  Target,
  Check,
} from "lucide-react";
import PriceChart from "../components/PriceChart";
import PriceAlertCard from "../components/PriceAlertCard";
import {
  getProducts,
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
        getProducts(),
        getPriceHistory(productId),
        getAlerts(),
      ]);
      const found = prodRes.data.find((p) => p.id === productId) ?? null;
      setProduct(found);
      setTargetValue(found?.target_price?.toString() || "");
      setHistory(histRes.data);
      setAlerts(alertsRes.data.filter((a) => a.product_id === productId));
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
      await checkSinglePrice(productId);
      await refresh();
    } finally {
      setChecking(false);
    }
  };

  const handleMarkRead = async (alertId: number) => {
    await markAlertRead(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
  };

  const handleSaveTarget = async () => {
    const val = parseFloat(targetValue);
    if (!isNaN(val) && val > 0) {
      await updateProduct(productId, { target_price: val });
      if (product) product.target_price = val;
    }
    setEditingTarget(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-gray-400">
        <p>Product not found</p>
        <Link
          to="/"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Back to Dashboard
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
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Product Header */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row">
          <div className="flex h-72 items-center justify-center bg-gray-50 p-6 md:w-80">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-6xl text-gray-300">📦</span>
            )}
          </div>

          <div className="flex flex-1 flex-col p-6 md:p-8">
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              {product.name}
            </h1>

            {product.category && (
              <span className="mt-2 inline-block w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                {product.category}
              </span>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.current_price)}
              </span>
              {product.original_price &&
                product.original_price !== product.current_price && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              {discount && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Target Price */}
            <div className="mt-3">
              {editingTarget ? (
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-violet-500" />
                  <span className="text-sm text-gray-600">Target:</span>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="₹"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
                  />
                  <button
                    onClick={handleSaveTarget}
                    className="rounded-lg bg-indigo-100 p-1.5 text-indigo-600 hover:bg-indigo-200"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingTarget(true)}
                  className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
                >
                  <Target size={16} />
                  {product.target_price
                    ? `Target: ${formatPrice(product.target_price)}`
                    : "Set a target price to get notified"}
                </button>
              )}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(product.rating!)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating}</span>
                {product.review_count && (
                  <span className="text-gray-400">
                    ({product.review_count.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
              <button
                onClick={handleCheckPrice}
                disabled={checking}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={checking ? "animate-spin" : ""}
                />
                Check Price Now
              </button>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown size={18} className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Price Drop History
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {alerts.map((a) => (
              <PriceAlertCard
                key={a.id}
                alert={a}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
