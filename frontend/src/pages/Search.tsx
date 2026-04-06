import { useState } from "react";
import {
  Star,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import SearchForm from "../components/SearchForm";
import {
  scrapeProducts,
  addProduct,
  type ScrapedProduct,
} from "../api/client";

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Search() {
  const [results, setResults] = useState<ScrapedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<Record<string, "loading" | "done" | "error">>({});
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    setTracking({});
    try {
      const res = await scrapeProducts(query);
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (product: ScrapedProduct) => {
    const key = product.url;
    setTracking((prev) => ({ ...prev, [key]: "loading" }));
    try {
      await addProduct(product.url);
      setTracking((prev) => ({ ...prev, [key]: "done" }));
    } catch {
      setTracking((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Search Amazon Products
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Search for products on Amazon and start tracking their prices.
        </p>
      </div>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500">
              Searching Amazon... this may take a moment.
            </p>
          </div>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 text-sm text-gray-400">
          No results found. Try a different search term.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Found {results.length} products
          </p>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {results.map((product, idx) => {
              const state = tracking[product.url];
              return (
                <div
                  key={`${product.url}-${idx}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50"
                >
                  {/* Image */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-2xl text-gray-300">📦</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {product.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {product.price != null && (
                        <span className="font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                      {product.rating != null && (
                        <span className="flex items-center gap-1">
                          <Star
                            size={13}
                            className="fill-amber-400 text-amber-400"
                          />
                          {product.rating}
                        </span>
                      )}
                      {product.review_count != null && (
                        <span>
                          {product.review_count.toLocaleString()} reviews
                        </span>
                      )}
                      {product.norm_rating != null && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                          Score: {product.norm_rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-colors hover:text-indigo-600"
                    >
                      <ExternalLink size={16} />
                    </a>
                    {state === "done" ? (
                      <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
                        <CheckCircle2 size={16} />
                        Tracked
                      </div>
                    ) : state === "error" ? (
                      <div className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                        <AlertTriangle size={16} />
                        Error
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTrack(product)}
                        disabled={state === "loading"}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {state === "loading" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        Track
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
