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

  const handleSaveTarget = async () => {
    const val = parseFloat(targetValue);
    if (!isNaN(val) && val > 0) {
      await updateProduct(product.id, { target_price: val });
      product.target_price = val;
    }
    setEditingTarget(false);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      {/* Image */}
      <div className="flex h-48 items-center justify-center overflow-hidden bg-gray-50 p-4">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full max-w-full object-contain transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="text-4xl text-gray-300">📦</div>
        )}
      </div>

      {/* Badge */}
      {change !== null && change !== 0 && (
        <div
          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            change < 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {change < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          {formatPrice(Math.abs(change))}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <Link
          to={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-indigo-600"
        >
          {product.name}
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.current_price)}
          </span>
          {product.original_price &&
            product.original_price !== product.current_price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="font-medium text-gray-700">{product.rating}</span>
            {product.review_count && (
              <span>({product.review_count.toLocaleString()} reviews)</span>
            )}
          </div>
        )}

        {/* Target Price */}
        <div className="mt-2">
          {editingTarget ? (
            <div className="flex items-center gap-1.5">
              <Target size={13} className="text-violet-500" />
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="Target ₹"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
              />
              <button
                onClick={handleSaveTarget}
                className="rounded-md bg-indigo-100 p-1 text-indigo-600 hover:bg-indigo-200"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTarget(true)}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
            >
              <Target size={13} />
              {product.target_price
                ? `Target: ${formatPrice(product.target_price)}`
                : "Set target price"}
            </button>
          )}
        </div>

        {product.category && (
          <span className="mt-2 inline-block w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
            {product.category}
          </span>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4 mt-4">
          <button
            onClick={() => onCheckPrice(product.id)}
            disabled={checking}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            Check Price
          </button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-indigo-600"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={() => onRemove(product.id)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
