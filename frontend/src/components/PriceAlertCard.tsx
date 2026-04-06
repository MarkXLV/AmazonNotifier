import { TrendingDown, Check, Mail } from "lucide-react";
import type { PriceAlert } from "../api/client";

interface Props {
  alert: PriceAlert;
  onMarkRead: (id: number) => void;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PriceAlertCard({ alert, onMarkRead }: Props) {
  const savings = alert.old_price - alert.new_price;

  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        alert.is_read
          ? "border-gray-100 bg-gray-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <TrendingDown size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {alert.product_name || `Product #${alert.product_id}`}
        </p>
        <p className="mt-0.5 text-sm text-gray-600">
          <span className="line-through">{formatPrice(alert.old_price)}</span>
          {" → "}
          <span className="font-semibold text-emerald-600">
            {formatPrice(alert.new_price)}
          </span>
          <span className="ml-2 text-emerald-600 font-medium">
            Save {formatPrice(savings)}
          </span>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs text-gray-400">{timeAgo(alert.created_at)}</p>
          {alert.email_sent && (
            <span className="flex items-center gap-0.5 text-xs text-indigo-500">
              <Mail size={10} /> Emailed
            </span>
          )}
        </div>
      </div>
      {!alert.is_read && (
        <button
          onClick={() => onMarkRead(alert.id)}
          className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-emerald-600"
          title="Mark as read"
        >
          <Check size={16} />
        </button>
      )}
    </div>
  );
}
