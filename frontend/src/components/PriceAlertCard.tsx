import { ArrowDown, Check, Mail } from "lucide-react";
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
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PriceAlertCard({ alert, onMarkRead }: Props) {
  const savings = alert.old_price - alert.new_price;

  return (
    <div
      className={`rounded-2xl border border-l-[3px] bg-surface p-[18px] transition-colors ${
        alert.is_read ? "border-line border-l-line" : "border-line border-l-savings"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-savings-soft px-2.5 py-1 text-xs font-semibold text-savings-ink">
          <ArrowDown size={12} strokeWidth={2.6} />
          Price drop
        </span>
        <div className="flex items-center gap-2">
          {alert.email_sent && (
            <span className="flex items-center gap-1 text-xs text-faint">
              <Mail size={11} /> Emailed
            </span>
          )}
          <span className="text-xs text-faint">{timeAgo(alert.created_at)}</span>
          {!alert.is_read && (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="rounded-md p-1 text-faint transition-colors hover:bg-surface-2 hover:text-savings-ink"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <Check size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="mb-2.5 line-clamp-1 text-sm font-medium text-ink">
        {alert.product_name || `Product #${alert.product_id}`}
      </p>

      <div className="flex items-baseline gap-2">
        <span className="tnum text-xs text-faint line-through">
          {formatPrice(alert.old_price)}
        </span>
        <span className="tnum font-display text-lg font-bold text-ink">
          {formatPrice(alert.new_price)}
        </span>
        <span className="tnum ml-auto text-sm font-bold text-savings-ink">
          −{formatPrice(savings)}
        </span>
      </div>
    </div>
  );
}
