"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { UniverseSearchHit } from "@/lib/universe-search-types";
import { formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { ChainIcon } from "@/components/chain-icon";
import { TokenAvatar } from "@/components/token-avatar";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import {
  clearSearchHistory,
  pushSearchHistory,
  readSearchHistory,
} from "@/lib/search-history";

type CoinSearchBarProps = {
  variant?: "header" | "wide";
  inputId?: string;
  placeholder?: string;
  showSubmitButton?: boolean;
};

const searchCache = new Map<string, UniverseSearchHit[]>();
const CACHE_LIMIT = 60;
const DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 10;

function cacheGet(q: string) {
  return searchCache.get(q.toLowerCase());
}

function cacheSet(q: string, items: UniverseSearchHit[]) {
  const key = q.toLowerCase();
  if (searchCache.size >= CACHE_LIMIT) {
    const first = searchCache.keys().next().value;
    if (first) searchCache.delete(first);
  }
  searchCache.set(key, items);
}

function isMajorHit(hit: UniverseSearchHit): boolean {
  return hit.rankTier === "major_usdt" || hit.rankTier === "major_other";
}

export function CoinSearchBar({
  variant = "header",
  inputId,
  placeholder = "Ticker or contract",
  showSubmitButton = true,
}: CoinSearchBarProps) {
  const autoId = useId();
  const fieldId = inputId ?? `coin-search-${autoId}`;
  const listId = `${fieldId}-results`;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UniverseSearchHit[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Keep results above mobile keyboard / tab bar */
  const [sheetPad, setSheetPad] = useState(72);

  const showHistory = open && query.trim().length === 0 && history.length > 0;
  const showResults =
    open &&
    query.trim().length > 0 &&
    (results.length > 0 || error || searched || loading);
  const showDropdown = showHistory || showResults;

  useEffect(() => {
    function syncPad() {
      const vv = window.visualViewport;
      if (!vv) {
        setSheetPad(72);
        return;
      }
      const obscured = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setSheetPad(Math.max(72, obscured + 12));
    }
    syncPad();
    window.visualViewport?.addEventListener("resize", syncPad);
    window.visualViewport?.addEventListener("scroll", syncPad);
    return () => {
      window.visualViewport?.removeEventListener("resize", syncPad);
      window.visualViewport?.removeEventListener("scroll", syncPad);
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setActiveIndex(-1);
      setSearched(false);
      setLoading(false);
      setError(null);
      // Keep dropdown open for history when focused; don't force-close.
      return;
    }

    const cached = cacheGet(q);
    if (cached) {
      setResults(cached);
      setOpen(true);
      setSearched(true);
      setActiveIndex(-1);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/dex-search?q=${encodeURIComponent(q)}&limit=${SUGGESTION_LIMIT}&_=${Date.now()}`,
            { cache: "no-store" },
          );
          const data = await readResponseJsonSafely(res);
          const items =
            data &&
            typeof data === "object" &&
            "items" in data &&
            Array.isArray((data as { items: unknown }).items)
              ? ((data as { items: UniverseSearchHit[] }).items ?? [])
              : [];
          cacheSet(q, items);
          setResults(items);
          setError(null);
        } catch {
          setResults([]);
          setError("Search failed — try again");
        } finally {
          setLoading(false);
          setSearched(true);
          setOpen(true);
          setActiveIndex(-1);
        }
      })();
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const remember = useCallback((q: string) => {
    setHistory(pushSearchHistory(q));
  }, []);

  const goToHit = useCallback(
    (hit: UniverseSearchHit, rememberedQuery?: string) => {
      const q = (rememberedQuery ?? query).trim() || hit.symbol;
      remember(q);
      setOpen(false);
      setQuery("");
      router.push(hit.href);
    },
    [query, remember, router],
  );

  const runHistoryQuery = useCallback(
    (q: string) => {
      const next = q.trim();
      if (!next) return;
      remember(next);
      setQuery(next);
      setOpen(true);
      setActiveIndex(-1);
    },
    [remember],
  );

  const submitSearch = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      remember(q);
      if (activeIndex >= 0 && results[activeIndex]) {
        goToHit(results[activeIndex]!, q);
        return;
      }
      if (results[0]) {
        goToHit(results[0], q);
        return;
      }
      router.push(`/coin?q=${encodeURIComponent(q)}`);
      setOpen(false);
    },
    [activeIndex, goToHit, remember, results, router],
  );

  const onClearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
    setOpen(false);
  }, []);

  const wide = variant === "wide";

  const historyList = (
    <>
      <li className="flex items-center justify-between gap-2 px-3 pb-1 pt-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Recent
        </span>
        <button
          type="button"
          className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClearHistory}
        >
          Clear
        </button>
      </li>
      {history.map((item, idx) => (
        <li key={item} role="option" aria-selected={idx === activeIndex}>
          <button
            type="button"
            className={`flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm text-zinc-200 transition-colors active:bg-white/[0.08] ${
              idx === activeIndex ? "bg-white/[0.06]" : ""
            }`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runHistoryQuery(item)}
          >
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-500" aria-hidden>
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="8.25" />
              </svg>
            </span>
            <span className="min-w-0 truncate font-mono text-[13px] font-medium text-zinc-100">
              {item}
            </span>
          </button>
        </li>
      ))}
    </>
  );

  const resultsList = (
    <>
      {loading ? <li className="px-3 py-3 text-sm text-zinc-400">Searching…</li> : null}
      {error ? <li className="px-3 py-3 text-sm text-amber-200/90">{error}</li> : null}
      {!loading && !error && searched && results.length === 0 ? (
        <li className="px-3 py-3 text-sm text-zinc-400">No pair found — check the contract</li>
      ) : null}
      {results.map((hit, idx) => {
        const major = isMajorHit(hit);
        return (
          <li key={`${hit.kind}:${hit.id}:${hit.address ?? ""}`} role="option" aria-selected={idx === activeIndex}>
            <button
              type="button"
              className={`flex w-full items-center gap-2.5 px-3 text-left transition-colors active:bg-white/[0.08] ${
                major ? "min-h-14 py-2.5" : "min-h-12 py-2 opacity-90"
              } ${idx === activeIndex ? "bg-white/[0.06]" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goToHit(hit)}
            >
              <TokenAvatar symbol={hit.symbol} imageUrl={hit.imageUrl} size={major ? 36 : 28} />
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-50">
                    {hit.pairLabel ?? hit.symbol}
                  </span>
                  {major ? (
                    <span className="shrink-0 rounded border border-teal-400/45 bg-teal-500/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-teal-200">
                      Major
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[11px] text-zinc-500">{hit.name}</span>
                  {hit.chain ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-zinc-600">
                      <ChainIcon chainId={hit.chain} size={12} />
                    </span>
                  ) : null}
                </span>
                {hit.truncatedContract ? (
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-zinc-600">
                    {hit.truncatedContract}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-zinc-100">
                {formatDexPriceUsd(hit.priceUsd)}
              </span>
            </button>
          </li>
        );
      })}
    </>
  );

  const dropdownBody = showHistory ? historyList : resultsList;
  const dropdownLen = showHistory ? history.length : results.length;

  return (
    <div ref={rootRef} className={wide ? "relative w-full" : "relative block"}>
      <form
        role="search"
        className={wide ? "flex w-full flex-col gap-2" : "flex items-center gap-2"}
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(query);
        }}
      >
        <label htmlFor={fieldId} className="sr-only">
          Search ticker or contract
        </label>
        <div className="relative min-w-0 w-full flex-1">
          <input
            id={fieldId}
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length === 0) {
                const items = readSearchHistory();
                setHistory(items);
                if (items.length > 0) {
                  setOpen(true);
                  setActiveIndex(-1);
                }
                return;
              }
              if (results.length > 0 || error || searched) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (!showDropdown || dropdownLen === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % dropdownLen);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => (i <= 0 ? dropdownLen - 1 : i - 1));
              } else if (e.key === "Enter" && showHistory && activeIndex >= 0 && history[activeIndex]) {
                e.preventDefault();
                runHistoryQuery(history[activeIndex]!);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={showDropdown ? true : false}
            aria-controls={listId}
            aria-autocomplete="list"
            className={
              wide
                ? "min-h-12 w-full rounded-2xl border border-teal-400/40 bg-[var(--surface-inset)] px-4 text-base font-medium text-white placeholder:font-normal placeholder:text-zinc-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                : "h-10 w-full min-w-0 rounded-full border border-teal-400/30 bg-[var(--surface-inset)] px-3.5 text-sm font-medium text-zinc-100 placeholder:font-normal placeholder:text-zinc-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/25 lg:w-56 xl:w-72"
            }
          />

          {/* Desktop / large: dropdown under input */}
          {showDropdown ? (
            <ul
              id={listId}
              role="listbox"
              className="glass-dropdown absolute right-0 top-full z-[60] mt-1.5 hidden max-h-96 w-full min-w-[22rem] overflow-y-auto rounded-2xl py-1 shadow-[0_16px_48px_rgba(0,0,0,0.65)] lg:block"
            >
              {dropdownBody}
            </ul>
          ) : null}
        </div>
        {showSubmitButton ? (
          <button
            type="submit"
            className={
              wide
                ? "min-h-12 w-full rounded-2xl border border-teal-400/45 bg-teal-500/20 px-5 text-base font-semibold text-teal-50 sm:w-auto"
                : "h-10 shrink-0 rounded-full border border-teal-400/40 bg-teal-500/15 px-3 text-sm font-semibold text-teal-100"
            }
          >
            Search
          </button>
        ) : null}
      </form>

      {/* Phone: results sheet above keyboard + tab bar so first hit stays tappable */}
      {showDropdown ? (
        <div
          className="fixed inset-x-0 z-[70] lg:hidden"
          style={{ bottom: sheetPad }}
        >
          <ul
            id={`${listId}-mobile`}
            role="listbox"
            className="glass-dropdown mx-2 max-h-[min(52vh,22rem)] overflow-y-auto rounded-2xl py-1 shadow-[0_-8px_40px_rgba(0,0,0,0.65)]"
          >
            {dropdownBody}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
