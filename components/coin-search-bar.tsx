"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import type { TopCoinSearchEntry } from "@/lib/top-coins-index";

type CoinSearchBarProps = {
  /** Header uses a fixed width; category page uses full width. */
  variant?: "header" | "wide";
  inputId?: string;
  placeholder?: string;
  showSubmitButton?: boolean;
};

/** Session cache so typing / backspacing feels instant. */
const searchCache = new Map<string, TopCoinSearchEntry[]>();
const CACHE_LIMIT = 80;

function cacheGet(q: string) {
  return searchCache.get(q.toLowerCase());
}

function cacheSet(q: string, coins: TopCoinSearchEntry[]) {
  const key = q.toLowerCase();
  if (searchCache.size >= CACHE_LIMIT) {
    const first = searchCache.keys().next().value;
    if (first) searchCache.delete(first);
  }
  searchCache.set(key, coins);
}

function filterCachedPrefix(query: string): TopCoinSearchEntry[] | null {
  const q = query.toLowerCase();
  let bestKey = "";
  for (const key of searchCache.keys()) {
    if (q.startsWith(key) && key.length > bestKey.length) bestKey = key;
  }
  if (!bestKey || bestKey.length < 1) return null;
  const base = searchCache.get(bestKey);
  if (!base) return null;
  return base
    .filter((c) => {
      const id = c.id.toLowerCase();
      const sym = c.symbol.toLowerCase();
      const name = c.name.toLowerCase();
      return id.includes(q) || sym.includes(q) || name.includes(q);
    })
    .slice(0, 10);
}

export function CoinSearchBar({
  variant = "header",
  inputId,
  placeholder = "Search top 3000 assets (e.g. BTC)",
  showSubmitButton = true,
}: CoinSearchBarProps) {
  const autoId = useId();
  const fieldId = inputId ?? `coin-search-${autoId}`;
  const listId = `${fieldId}-results`;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TopCoinSearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      setError(null);
      setSearched(false);
      setLoading(false);
      return;
    }

    const cached = cacheGet(q);
    if (cached) {
      setResults(cached);
      setOpen(true);
      setLoading(false);
      setError(null);
      setSearched(true);
      setActiveIndex(-1);
      return;
    }

    const prefixHits = filterCachedPrefix(q);
    if (prefixHits && prefixHits.length > 0) {
      setResults(prefixHits);
      setOpen(true);
      setSearched(true);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(
            `/api/coin-search?q=${encodeURIComponent(q)}&limit=10`,
            { signal: controller.signal },
          );
          if (!res.ok) {
            setError("Search is busy — try again in a moment.");
            setSearched(true);
            setOpen(true);
            return;
          }
          const data = await readResponseJsonSafely(res);
          if (!data || typeof data !== "object" || !("coins" in data)) {
            setError("Search returned an unexpected response.");
            setSearched(true);
            setOpen(true);
            return;
          }
          const coins = (data as { coins: unknown }).coins;
          if (!Array.isArray(coins)) return;
          const list = coins as TopCoinSearchEntry[];
          cacheSet(q, list);
          setResults(list);
          setOpen(true);
          setActiveIndex(-1);
          setSearched(true);
        } catch (e) {
          if ((e as Error)?.name === "AbortError") return;
          setError("Couldn’t reach search. Check your connection.");
          setSearched(true);
          setOpen(true);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goToCoin = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/coin/${encodeURIComponent(id)}`);
    },
    [router],
  );

  const submitSearch = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      router.push(`/coin?q=${encodeURIComponent(q)}`);
      setOpen(false);
    },
    [router],
  );

  const warmSearch = useCallback(() => {
    if (cacheGet("b") || cacheGet("e")) return;
    void fetch("/api/coin-search?q=btc&limit=5")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        const coins = data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
        if (Array.isArray(coins)) cacheSet("btc", coins as TopCoinSearchEntry[]);
      })
      .catch(() => {});
  }, []);

  const inputClass =
    variant === "wide"
      ? "min-h-12 w-full flex-1 rounded-lg border border-[#f4ddc3]/20 bg-[rgba(20,18,22,0.65)] px-3 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-[#d1a173]/60 focus:outline-none focus:ring-2 focus:ring-[#d1a173]/35 sm:text-sm"
      : "h-10 w-full min-w-0 rounded-lg border border-[#f4ddc3]/25 bg-[rgba(20,18,22,0.7)] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#d1a173]/60 focus:outline-none focus:ring-2 focus:ring-[#d1a173]/35 sm:w-56 md:w-64";

  const wrapperClass =
    variant === "wide" ? "relative w-full" : "relative hidden md:block";

  const showDropdown = open && (results.length > 0 || loading || error || searched);

  return (
    <>
      <div ref={rootRef} className={wrapperClass}>
        <form
          role="search"
          className={
            variant === "wide"
              ? "flex flex-col gap-2 sm:flex-row sm:items-center"
              : "flex items-center gap-2"
          }
          onSubmit={(e) => {
            e.preventDefault();
            if (activeIndex >= 0 && results[activeIndex]) {
              goToCoin(results[activeIndex]!.id);
              return;
            }
            submitSearch(query);
          }}
        >
          <label htmlFor={fieldId} className="sr-only">
            Search asset information
          </label>
          <div className="relative min-w-0 flex-1">
            <input
              id={fieldId}
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                warmSearch();
                if (results.length > 0 || error || searched) setOpen(true);
              }}
              onKeyDown={(e) => {
                if (!showDropdown || results.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => (i + 1) % results.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder={placeholder}
              autoComplete="off"
              role="combobox"
              aria-expanded={showDropdown ? true : false}
              aria-controls={listId}
              aria-autocomplete="list"
              className={inputClass}
            />
            {loading ? (
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
                Searching…
              </span>
            ) : null}
            {showDropdown ? (
              <ul
                id={listId}
                role="listbox"
                className="absolute right-0 top-full z-[60] mt-1 max-h-80 w-full min-w-[16rem] overflow-y-auto rounded-lg border border-white/10 bg-[#141218] py-1 shadow-xl sm:min-w-[18rem]"
              >
                {error ? (
                  <li className="px-3 py-3 text-sm text-amber-200/90">{error}</li>
                ) : null}
                {!error && !loading && searched && results.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-zinc-400">
                    No matches in the top 3000. Try another symbol or name.
                  </li>
                ) : null}
                {results.map((coin, idx) => (
                  <li key={coin.id} role="option" aria-selected={idx === activeIndex}>
                    <button
                      type="button"
                      className={`flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                        idx === activeIndex ? "bg-white/[0.06]" : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToCoin(coin.id)}
                    >
                      {coin.image ? (
                        <Image
                          src={coin.image}
                          alt=""
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="h-6 w-6 rounded-full bg-zinc-700" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-zinc-100">{coin.name}</span>
                      <span className="shrink-0 font-mono text-xs uppercase text-zinc-400">
                        {coin.symbol}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                        #{coin.rank}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {showSubmitButton ? (
            <button
              type="submit"
              className={
                variant === "wide"
                  ? "min-h-12 shrink-0 rounded-lg border border-[#f4ddc3]/35 bg-gradient-to-br from-[#d9ab7c] to-[#a97348] px-5 py-2.5 text-base font-semibold text-[#111217] transition-[box-shadow,transform] hover:shadow-[0_0_18px_rgba(185,129,82,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.98] sm:min-h-11 sm:text-sm"
                  : "h-10 shrink-0 rounded-lg border border-[#f4ddc3]/35 bg-gradient-to-br from-[#d9ab7c] to-[#a97348] px-3 text-sm font-semibold text-[#111217] transition-[box-shadow,transform] hover:shadow-[0_0_18px_rgba(185,129,82,0.4)] active:scale-[0.98]"
              }
            >
              Search
            </button>
          ) : null}
        </form>
      </div>
      {variant === "header" ? (
        <Link
          href="/coin"
          className="inline-flex min-h-10 items-center rounded-lg border border-[#f4ddc3]/25 bg-[rgba(20,18,22,0.7)] px-3 py-2 text-sm font-medium text-zinc-200 md:hidden"
        >
          Search
        </Link>
      ) : null}
    </>
  );
}
