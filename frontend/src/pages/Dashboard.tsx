import { useEffect, useRef, useState, useCallback } from "react";
import {
  Package,
  TrendingDown,
  IndianRupee,
  RefreshCw,
  Bell,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import PriceAlertCard from "../components/PriceAlertCard";
import {
  StatCardSkeleton,
  ProductCardSkeleton,
  AlertCardSkeleton,
} from "../components/Skeleton";
import { useToast } from "../components/Toast";
import {
  getProducts,
  getStats,
  getAlerts,
  checkSinglePrice,
  checkAllPrices,
  removeProduct,
  markAlertRead,
  type Product,
  type DashboardStats,
  type PriceAlert,
} from "../api/client";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  const [productsLoading, setProductsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [waking, setWaking] = useState(false);
  const wakeTimer = useRef<number | null>(null);

  // Each section resolves independently so the page never blocks on the
  // slowest call — data streams in with skeletons in the meantime.
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getStats();
      setStats(res.data);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await getAlerts();
      setAlerts(res.data);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    return Promise.allSettled([loadProducts(), loadStats(), loadAlerts()]);
  }, [loadProducts, loadStats, loadAlerts]);

  useEffect(() => {
    // Cold free-tier backends can take ~50s to wake; surface a gentle hint.
    wakeTimer.current = window.setTimeout(() => setWaking(true), 4000);
    refresh().finally(() => {
      if (wakeTimer.current) window.clearTimeout(wakeTimer.current);
      setWaking(false);
    });
    return () => {
      if (wakeTimer.current) window.clearTimeout(wakeTimer.current);
    };
  }, [refresh]);

  const handleCheckPrice = async (id: number) => {
    setCheckingId(id);
    try {
      const res = await checkSinglePrice(id);
      const r = res.data;
      if (r.status === "dropped" || r.status === "target_reached") {
        notify(`Price dropped on ${r.name}!`, "success");
      } else if (r.status === "error") {
        notify(`Couldn't check ${r.name} right now.`, "error");
      }
      await Promise.allSettled([loadProducts(), loadStats(), loadAlerts()]);
    } catch {
      notify("Price check failed. Please try again.", "error");
    } finally {
      setCheckingId(null);
    }
  };

  const handleCheckAll = async () => {
    setCheckingAll(true);
    try {
      const res = await checkAllPrices();
      const drops = res.data.filter(
        (r) => r.status === "dropped" || r.status === "target_reached"
      ).length;
      notify(
        drops > 0
          ? `Checked ${res.data.length} products — ${drops} price drop${drops > 1 ? "s" : ""}!`
          : `Checked ${res.data.length} products — no drops this time.`,
        "success"
      );
      await refresh();
    } catch {
      notify("Couldn't check prices right now.", "error");
    } finally {
      setCheckingAll(false);
    }
  };

  const handleRemove = async (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await removeProduct(id);
      notify("Removed from your watchlist.", "success");
      loadStats();
    } catch {
      notify("Couldn't remove that product.", "error");
      loadProducts();
    }
  };

  const handleMarkRead = async (id: number) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    await markAlertRead(id);
  };

  const categoryCount = new Set(
    products.map((p) => p.category).filter(Boolean)
  ).size;

  const statCards = [
    {
      label: "Tracked products",
      value: stats?.total_tracked ?? 0,
      sub: categoryCount ? `across ${categoryCount} categories` : "start tracking below",
      icon: Package,
      tone: "bg-surface-2 text-ink",
      valueClass: "text-ink",
    },
    {
      label: "Price drops today",
      value: stats?.price_drops_today ?? 0,
      sub: "in the last 24 hours",
      icon: TrendingDown,
      tone: "bg-savings-soft text-savings-ink",
      valueClass: "text-savings-ink",
    },
    {
      label: "Average savings",
      value: `₹${(stats?.average_savings ?? 0).toLocaleString("en-IN")}`,
      sub: "avg per triggered alert",
      icon: IndianRupee,
      tone: "bg-amber-soft text-amber-ink",
      valueClass: "text-ink",
    },
  ];

  const showAlerts = alertsLoading || alerts.length > 0;

  return (
    <div className="space-y-9">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-savings-soft px-3 py-1.5 text-xs font-semibold text-savings-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-savings" />
            {statsLoading ? "Loading your watchlist…" : `${stats?.total_tracked ?? 0} products tracked · watching live`}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {greeting()}
          </h1>
          <p className="mt-2 text-base text-muted">
            Here's what moved across your watchlist today.
          </p>
        </div>
        <button
          onClick={handleCheckAll}
          disabled={checkingAll || products.length === 0}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw size={16} className={checkingAll ? "animate-spin" : ""} />
          Check all prices
        </button>
      </div>

      {waking && productsLoading && (
        <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Waking up the server — the first load after a while can take a moment.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {statsLoading
          ? [0, 1, 2].map((i) => <StatCardSkeleton key={i} />)
          : statCards.map(({ label, value, sub, icon: Icon, tone, valueClass }) => (
              <div
                key={label}
                className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {label}
                  </span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                    <Icon size={17} />
                  </div>
                </div>
                <div className={`tnum mt-3.5 font-display text-4xl font-bold leading-none tracking-tight ${valueClass}`}>
                  {value}
                </div>
                <div className="mt-2 text-sm text-muted">{sub}</div>
              </div>
            ))}
      </div>

      {/* Alerts */}
      {showAlerts && (
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <Bell size={18} className="text-savings-ink" />
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              Recent alerts
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alertsLoading
              ? [0, 1, 2].map((i) => <AlertCardSkeleton key={i} />)
              : alerts
                  .slice(0, 6)
                  .map((a) => (
                    <PriceAlertCard key={a.id} alert={a} onMarkRead={handleMarkRead} />
                  ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Your products
          </h2>
          {!productsLoading && products.length > 0 && (
            <span className="text-sm text-muted">Sorted by last updated</span>
          )}
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-faint">
              <Package size={30} strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">
              No products tracked yet
            </h3>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Head to Search to find Amazon products and start tracking their prices.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onRemove={handleRemove}
                onCheckPrice={handleCheckPrice}
                checking={checkingId === p.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
