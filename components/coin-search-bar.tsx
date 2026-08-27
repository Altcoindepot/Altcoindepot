"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { DexSearchHit } from "@/lib/dex-search";
import { truncateContract } from "@/lib/dex-search";
import { formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatChainLabel } from "@/lib/format-chain";
import { ChainIcon } from "@/components/chain-icon";
import { TokenAvatar } from "@/components/token-avatar";
import { readResponseJsonSafely } from "@/lib/read-response-json";

type CoinSearchBarProps = {
  variant?: "header" | "wide";
  inputId?: string;
  placeholder?: string;
  showSubmitButton?: boolean;
};

const searchCache = new Map<string, DexSearchHit[]>();
const CACHE_LIMIT = 60;
const DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 10;

function cacheGet(q: string) {
  return searchCache.get(q.toLowerCase());
}

function cacheSet(q: string, items: DexSearchHit[]) {
  const key = q.toLowerCase();
  if (searchCache.size >= CACHE_LIMIT) {
    const first = searchCache.keys().next().value;
    if (first) searchCache.delete(first);
  }
  searchCache.set(key, items);
}

export function CoinSearchBar({
  variant = "header",
  inputId,
  placeholder = "Search ticker or contract",
  showSubmitButton = true,
}: CoinSearchBarProps) {
  const autoId = useId();
  const fieldId = inputId ?? `coin-search-${autoId}`;
  const listId = `${fieldId}-results`;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DexSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      setSearched(false);
      setLoading(false);
      setError(null);
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
              ? ((data as { items: DexSearchHit[] }).items ?? [])
              : [];
          cacheSet(q, items);
          setResults(items);
          setError(null);
        } catch {
          setResults([]);
          setError("Dex search failed — try again");
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
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goToHit = useCallback(
    (hit: DexSearchHit) => {
      setOpen(false);
      setQuery("");
      router.push(hit.href);
    },
    [router],
  );

  const submitSearch = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      if (activeIndex >= 0 && results[activeIndex]) {
        goToHit(results[activeIndex]!);
        return;
      }
      if (results[0]) {
        goToHit(results[0]);
        return;
      }
      router.push(`/coin?q=${encodeURIComponent(q)}`);
      setOpen(false);
    },
    [activeIndex, goToHit, results, router],
  );

  const showDropdown = open && (results.length > 0 || error || searched || loading);

  return (
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
          submitSearch(query);
        }}
      >
        <label htmlFor={fieldId} className="sr-only">
          Search ticker or contract on DexScreener
        </label>
        <div className="relative min-w-0 flex-1">
          <input
            id={fieldId}
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
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
            className={
              variant === "wide"
                ? "min-h-12 w-full flex-1 rounded-full border border-teal-400/25 bg-white/[0.04] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/25 sm:text-sm"
                : "h-10 w-full min-w-0 rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-400/45 focus:outline-none focus:ring-2 focus:ring-teal-400/20 lg:w-56 xl:w-72"
            }
          />
          {showDropdown ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute right-0 top-full z-[60] mt-1 max-h-80 w-full min-w-[17rem] overflow-y-auto rounded-xl border border-teal-400/20 bg-[#0c0e14]/98 py-1 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:min-w-[22rem]"
            >
              {loading ? (
                <li className="px-3 py-3 text-sm text-zinc-400">Searching DexScreener…</li>
              ) : null}
              {error ? <li className="px-3 py-3 text-sm text-amber-200/90">{error}</li> : null}
              {!loading && !error && searched && results.length === 0 ? (
                <li className="px-3 py-3 text-sm text-zinc-400">
                  No pair found — check the contract
                </li>
              ) : null}
              {results.map((hit, idx) => (
                <li key={hit.id} role="option" aria-selected={idx === activeIndex}>
                  <button
                    type="button"
                    className={`flex min-h-12 w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                      idx === activeIndex ? "bg-white/[0.06]" : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToHit(hit)}
                  >
                    <TokenAvatar symbol={hit.symbol} imageUrl={hit.imageUrl} size={24} />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-100">
                          {hit.symbol}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-zinc-500">
                          <ChainIcon chainId={hit.chain} size={12} />
                          {formatChainLabel(hit.chain)}
                        </span>
                      </span>
                      <span className="block truncate text-[11px] text-zinc-500">{hit.name}</span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-zinc-600">
                        {truncateContract(hit.address)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-zinc-100">
                      {formatDexPriceUsd(hit.priceUsd)}
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
                ? "min-h-12 shrink-0 rounded-full border border-teal-400/40 bg-teal-500/15 px-5 py-2.5 text-base font-semibold text-teal-100 sm:min-h-11 sm:text-sm"
                : "h-10 shrink-0 rounded-full border border-teal-400/40 bg-teal-500/15 px-3 text-sm font-semibold text-teal-100"
            }
          >
            Search
          </button>
        ) : null}
      </form>
    </div>
  );
}
