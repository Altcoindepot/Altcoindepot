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

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/coin-search?q=${encodeURIComponent(q)}&limit=10`,
            { signal: controller.signal },
          );
          if (!res.ok) return;
          const data = await readResponseJsonSafely(res);
          if (!data || typeof data !== "object" || !("coins" in data)) return;
          const coins = (data as { coins: unknown }).coins;
          if (!Array.isArray(coins)) return;
          setResults(coins as TopCoinSearchEntry[]);
          setOpen(true);
          setActiveIndex(-1);
        } catch {
          /* ignore abort / network */
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 200);

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

  const inputClass =
    variant === "wide"
      ? "min-h-11 w-full flex-1 rounded-lg border border-[#f4ddc3]/20 bg-[rgba(20,18,22,0.65)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[#d1a173]/60 focus:outline-none focus:ring-2 focus:ring-[#d1a173]/35"
      : "h-9 w-full min-w-0 rounded-lg border border-[#f4ddc3]/25 bg-[rgba(20,18,22,0.7)] px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#d1a173]/60 focus:outline-none focus:ring-2 focus:ring-[#d1a173]/35 sm:w-64";

  const wrapperClass = variant === "wide" ? "relative w-full" : "relative hidden lg:block";

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
              if (results.length > 0) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (!open || results.length === 0) return;
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
            aria-expanded={open && results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            className={inputClass}
          />
          {loading ? (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
              …
            </span>
          ) : null}
          {open && results.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute right-0 top-full z-[60] mt-1 max-h-72 w-full min-w-[16rem] overflow-y-auto rounded-lg border border-white/10 bg-[#141218] py-1 shadow-xl sm:min-w-[18rem]"
            >
              {results.map((coin, idx) => (
                <li key={coin.id} role="option" aria-selected={idx === activeIndex}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                      idx === activeIndex ? "bg-white/[0.06]" : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToCoin(coin.id)}
                  >
                    {coin.image ? (
                      <Image
                        src={coin.image}
                        alt=""
                        width={22}
                        height={22}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="h-[22px] w-[22px] rounded-full bg-zinc-700" />
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
                ? "min-h-11 shrink-0 rounded-lg border border-[#f4ddc3]/35 bg-gradient-to-br from-[#d9ab7c] to-[#a97348] px-4 py-2 text-sm font-semibold text-[#111217] transition-[box-shadow,transform] hover:shadow-[0_0_18px_rgba(185,129,82,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.98]"
                : "h-9 shrink-0 rounded-lg border border-[#f4ddc3]/35 bg-gradient-to-br from-[#d9ab7c] to-[#a97348] px-3 text-sm font-semibold text-[#111217] transition-[box-shadow,transform] hover:shadow-[0_0_18px_rgba(185,129,82,0.4)] active:scale-[0.98]"
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
          className="rounded-lg border border-[#f4ddc3]/25 bg-[rgba(20,18,22,0.7)] px-2.5 py-1.5 text-xs text-zinc-200 lg:hidden"
        >
          Search
        </Link>
      ) : null}
    </>
  );
}
