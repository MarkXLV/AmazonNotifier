import { useState } from "react";
import {
  Star,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  SearchX,
} from "lucide-react";
import SearchForm from "../components/SearchForm";
import ProductThumb from "../components/ProductThumb";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
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

type TrackState = "loading" | "done" | "error";

export default function Search() {
  const { notify } = useToast();
  const [results, setResults] = useState<ScrapedProduct[]>([]);
  const [source, setSource] = useState<"live" | "catalog" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<string, TrackState>>({});
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const runSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    setError(null);
    setTracking({});
    setLastQuery(query);
    try {
      const res = await scrapeProducts(query);
      setResults(res.data.results);
      setSource(res.data.source);
    } catch {
      setResults([]);
      setSource(null);
      setError("Search failed — the server may be waking up. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (product: ScrapedProduct) => {
    const key = product.url;
    setTracking((prev) => ({ ...prev, [key]: "loading" }));
    try {
      await addProduct({
        url: product.url,
        name: product.name,
        price: product.price ?? undefined,
        image_url: product.image_url,
        rating: product.rating,
        review_count: product.review_count,
      });
      setTracking((prev) => ({ ...prev, [key]: "done" }));
      notify(`Now tracking "${product.name.slice(0, 40)}…"`, "success");
    } catch {
      setTracking((prev) => ({ ...prev, [key]: "error" }));
      notify("Couldn't track that product.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Find something to track
        </h1>
        <p className="mt-2 text-base text-muted">
          Search products, then add them to your watchlist in one click.
        </p>
      </div>

      <SearchForm onSearch={runSearch} loading={loading} />

      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-3 rounded-2xl border border-rise/30 bg-rise-soft px-4 py-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rise-ink" />
          <div className="flex-1 text-sm text-rise-ink">{error}</div>
          <button
            onClick={() => runSearch(lastQuery)}
            className="shrink-0 rounded-lg border border-rise/30 px-3 py-1 text-xs font-semibold text-rise-ink transition-colors hover:bg-rise/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* Catalog fallback banner */}
      {!loading && !error && source === "catalog" && results.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-ink/25 bg-amber-soft px-4 py-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-ink" />
          <div className="text-sm text-amber-ink">
            <span className="font-semibold">Showing catalog matches.</span> Live
            Amazon search is temporarily unavailable, so we searched your saved
            catalog instead.
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-5 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-line-2"
            >
              <Skeleton className="h-[60px] w-[60px] rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-faint">
            <SearchX size={28} strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-sm text-muted">
            No results for “{lastQuery}”. Try a different search term.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{results.length} products</span>{" "}
              found{lastQuery && ` for “${lastQuery}”`}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <SlidersHorizontal size={14} />
              Best value first
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]">
            {results.map((product, idx) => {
              const state = tracking[product.url];
              return (
                <div
                  key={`${product.url}-${idx}`}
                  className="flex items-center gap-4 p-5 transition-colors hover:bg-surface-2/50 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-line-2"
                >
                  {/* Thumb */}
                  <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-surface-2 to-line">
                    <ProductThumb
                      src={product.image_url}
                      iconSize={26}
                      imgClassName="h-full w-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-ink sm:text-[15px]">
                      {product.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                      {product.price != null && (
                        <span className="tnum text-base font-bold text-ink">
                          {formatPrice(product.price)}
                        </span>
                      )}
                      {product.rating != null && (
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-star text-star" />
                          <span className="font-semibold text-ink">{product.rating}</span>
                        </span>
                      )}
                      {product.review_count != null && (
                        <span>{product.review_count.toLocaleString("en-IN")} reviews</span>
                      )}
                      {product.norm_rating != null && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">
                          Score {product.norm_rating}
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
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:text-ink"
                      aria-label="View on Amazon"
                    >
                      <ExternalLink size={16} />
                    </a>
                    {state === "done" ? (
                      <div className="flex items-center gap-1.5 rounded-xl bg-savings-soft px-4 py-2.5 text-sm font-semibold text-savings-ink">
                        <CheckCircle2 size={16} />
                        Tracked
                      </div>
                    ) : state === "error" ? (
                      <div className="flex items-center gap-1.5 rounded-xl bg-rise-soft px-4 py-2.5 text-sm font-semibold text-rise-ink">
                        <AlertTriangle size={16} />
                        Error
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTrack(product)}
                        disabled={state === "loading"}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {state === "loading" ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Plus size={15} strokeWidth={2.4} />
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
