import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search
          size={19}
          className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products… e.g. noise cancelling headphones"
          className="h-14 w-full rounded-2xl border-[1.5px] border-line bg-surface pl-12 pr-4 text-base text-ink shadow-[var(--shadow-card)] outline-none transition-colors placeholder:text-faint focus:border-ink focus:ring-[3px] focus:ring-[var(--ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Search size={18} />
        )}
        Search
      </button>
    </form>
  );
}
