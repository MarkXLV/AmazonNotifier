import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingDown,
  TrendingUp,
  Star,
  ExternalLink,
  Trash2,
  RefreshCw,
  Target,
  Check,
} from "lucide-react";
import type { Product } from "../api/client";
import { updateProduct } from "../api/client";
import ProductThumb from "./ProductThumb";

interface Props {
  product: Product;
  onRemove: (id: number) => void;
  onCheckPrice: (id: number) => void;
  checking?: boolean;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProductCard({
  product,
  onRemove,
  onCheckPrice,
  checking,
}: Props) {
  const change = product.price_change;
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState(
    product.target_price?.toString() || ""
  );

  const discount =
    product.original_price && product.original_price > product.current_price
      ? Math.round(
          ((product.original_price - product.current_price) /
            product.original_price) *
            100
        )
      : null;

  const targetHit =
    product.target_price != null && product.current_price <= product.target_price;

  const handleSaveTarget = async () => {
    const val = parseFloat(targetValue);
    if (!isNaN(val) && val > 0) {
      await updateProduct(product.id, { target_price: val });
      product.target_price = val;
    }
    setEditingTarget(false);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(25,23,18,0.4)]">
      {/* Image */}
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-surface-2 to-line p-4">
        {discount != null && (
          <span className="tnum absolute right-3 top-3 rounded-full bg-savings px-2.5 py-1 text-xs font-bold text-savings-fg">
            −{discount}%
          </span>
        )}
        <ProductThumb
          src={product.image_url}
          alt={product.name}
          iconSize={52}
          imgClassName="h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <Link
          to={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors hover:text-savings-ink"
        >
          {product.name}
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="tnum font-display text-2xl font-bold tracking-tight text-ink">
            {formatPrice(product.current_price)}
          </span>
          {product.original_price &&
            product.original_price !== product.current_price && (
              <span className="tnum text-sm text-faint line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
        </div>

        {change != null && change !== 0 && (
          <div
            className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${
              change < 0 ? "text-savings-ink" : "text-rise-ink"
            }`}
          >
            {change < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
            <span className="tnum">{formatPrice(Math.abs(change))}</span>
            <span className="font-normal text-faint">since last check</span>
          </div>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="mt-2.5 flex items-center gap-1.5 text-sm text-muted">
            <Star size={14} className="fill-star text-star" />
            <span className="font-semibold text-ink">{product.rating}</span>
            {product.review_count && (
              <span className="text-faint">
                ({product.review_count.toLocaleString("en-IN")})
              </span>
            )}
          </div>
        )}

        {/* Target price */}
        <div className="mt-2.5">
          {editingTarget ? (
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-savings-ink" />
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="tnum w-24 rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-savings focus:ring-[3px] focus:ring-[var(--ring)]"
                placeholder="Target ₹"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
              />
              <button
                onClick={handleSaveTarget}
                className="rounded-lg bg-savings-soft p-1 text-savings-ink hover:opacity-80"
                aria-label="Save target"
              >
                <Check size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTarget(true)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                product.target_price ? "text-savings-ink" : "text-muted hover:text-ink"
              }`}
            >
              <Target size={14} />
              {product.target_price
                ? `${targetHit ? "Target hit · " : "Target "}${formatPrice(product.target_price)}`
                : "Set target price"}
            </button>
          )}
        </div>

        {product.category && (
          <span className="mt-2.5 inline-block w-fit rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
            {product.category}
          </span>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-line-2 pt-4">
          <button
            onClick={() => onCheckPrice(product.id)}
            disabled={checking}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            Check
          </button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-line text-muted transition-colors hover:text-ink"
            aria-label="View on Amazon"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={() => onRemove(product.id)}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-rise/40 hover:text-rise"
            aria-label="Remove"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
