"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  filterClientTop200Index,
  loadClientTop200Index,
} from "@/lib/client-top-200-index";
import type { TopCoinSearchEntry } from "@/lib/top-coins-search-utils";
import { pickBestTopCoinMatch } from "@/lib/top-coins-search-utils";

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

export function CoinSearchBar({
  variant = "header",
  inputId,
  placeholder = "Search top 200 assets (e.g. BTC)",
  showSubmitButton = true,
}: CoinSearchBarProps) {
  const autoId = useId();
  const fieldId = inputId ?? `coin-search-${autoId}`;
  const listId = `${fieldId}-results`;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<TopCoinSearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TopCoinSearchEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [indexReady, setIndexReady] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const warmIndex = useCallback(async () => {
    if (indexRef.current.length > 0) {
      setIndexReady(true);
      return;
    }
    try {
      const index = await loadClientTop200Index();
      indexRef.current = index;
      setIndexReady(index.length > 0);
      setIndexError(index.length === 0 ? "Search index is syncing — try again shortly." : null);
    } catch {
      setIndexError("Search index is syncing — try again shortly.");
    }
  }, []);

  useEffect(() => {
    void warmIndex();
  }, [warmIndex]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      setSearched(false);
      return;
    }

    const cached = cacheGet(q);
    if (cached) {
      setResults(cached);
      setOpen(true);
      setSearched(true);
      setActiveIndex(-1);
      return;
    }

    if (!indexRef.current.length) {
      setSearched(true);
      setOpen(true);
      return;
    }

    const list = filterClientTop200Index(indexRef.current, q, 10);
    cacheSet(q, list);
    setResults(list);
    setOpen(true);
    setActiveIndex(-1);
    setSearched(true);
  }, [query, indexReady]);

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

      const best = indexRef.current.length
        ? pickBestTopCoinMatch(indexRef.current, q)
        : null;
      if (best) {
        goToCoin(best.id);
        return;
      }

      router.push(`/coin?q=${encodeURIComponent(q)}`);
      setOpen(false);
    },
    [goToCoin, router],
  );

  const showDropdown = open && (results.length > 0 || indexError || searched);

  return (
    <>
      <div ref={rootRef} className={variant === "wide" ? "relative w-full" : "relative block"}>
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
            Search tokens and pairs
          </label>
          <div className="relative min-w-0 flex-1">
            <input
              id={fieldId}
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                void warmIndex();
                if (results.length > 0 || indexError || searched) setOpen(true);
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
              className={
                variant === "wide"
                  ? "min-h-12 w-full flex-1 rounded-lg border border-[#f4ddc3]/20 bg-[rgba(20,18,22,0.65)] px-3 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/25 sm:text-sm"
                  : "h-10 w-full min-w-0 rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-400/45 focus:outline-none focus:ring-2 focus:ring-teal-400/20 lg:w-52 xl:w-64"
              }
            />
            {showDropdown ? (
              <ul
                id={listId}
                role="listbox"
                className="absolute right-0 top-full z-[60] mt-1 max-h-80 w-full min-w-[16rem] overflow-y-auto rounded-lg border border-white/10 bg-[#141218] py-1 shadow-xl sm:min-w-[18rem]"
              >
                {indexError ? (
                  <li className="px-3 py-3 text-sm text-amber-200/90">{indexError}</li>
                ) : null}
                {!indexError && searched && results.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-zinc-400">
                    No matches in the top 200. Try another symbol or name.
                  </li>
                ) : null}
                {results.map((coin, idx) => {
                  const ch = coin.price_change_percentage_24h;
                  const price =
                    coin.current_price != null && Number.isFinite(coin.current_price)
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: coin.current_price < 1 ? 6 : 2,
                        }).format(coin.current_price)
                      : "—";
                  const pct =
                    ch != null && Number.isFinite(ch)
                      ? `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`
                      : "—";
                  return (
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
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-zinc-100">{coin.name}</span>
                          <span className="font-mono text-[10px] uppercase text-zinc-500">
                            {coin.symbol}
                            <span className="mx-1 text-zinc-700">·</span>#{coin.rank}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-mono text-xs font-semibold tabular-nums text-zinc-100">
                            {price}
                          </span>
                          <span
                            className={`block font-mono text-[11px] font-semibold tabular-nums ${
                              (ch ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                            }`}
                          >
                            {pct}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
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
    </>
  );
}
