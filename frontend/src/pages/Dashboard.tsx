import { useEffect, useState, useCallback } from "react";
import {
  Package,
  TrendingDown,
  IndianRupee,
  RefreshCw,
  Loader2,
  Bell,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import PriceAlertCard from "../components/PriceAlertCard";
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

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes, alertsRes] = await Promise.all([
        getProducts(),
        getStats(),
        getAlerts(),
      ]);
      setProducts(prodRes.data);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch {
      /* network error handled gracefully */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCheckPrice = async (id: number) => {
    setCheckingId(id);
    try {
      await checkSinglePrice(id);
      await refresh();
    } finally {
      setCheckingId(null);
    }
  };

  const handleCheckAll = async () => {
    setCheckingAll(true);
    try {
      await checkAllPrices();
      await refresh();
    } finally {
      setCheckingAll(false);
    }
  };

  const handleRemove = async (id: number) => {
    await removeProduct(id);
    await refresh();
  };

  const handleMarkRead = async (id: number) => {
    await markAlertRead(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Tracked Products",
      value: stats?.total_tracked ?? 0,
      icon: Package,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Price Drops Today",
      value: stats?.price_drops_today ?? 0,
      icon: TrendingDown,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Avg Savings",
      value: `₹${(stats?.average_savings ?? 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your favourite Amazon products and get price drop alerts.
          </p>
        </div>
        <button
          onClick={handleCheckAll}
          disabled={checkingAll || products.length === 0}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={checkingAll ? "animate-spin" : ""}
          />
          Check All Prices
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
            >
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Bell size={18} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Alerts
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.slice(0, 6).map((a) => (
              <PriceAlertCard key={a.id} alert={a} onMarkRead={handleMarkRead} />
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center">
          <Package size={48} className="text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            No products tracked yet
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Go to the Search page to find and track Amazon products.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Your Products
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </div>
      )}
    </div>
  );
}
