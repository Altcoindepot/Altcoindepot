"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import {
  clearRecentlyViewed,
  readRecentlyViewed,
  RECENTLY_VIEWED_CHANGE_EVENT,
  type RecentlyViewedEntry,
} from "@/lib/recently-viewed-storage";

type LiveCoin = {
  id: string;
  current_price?: number | null;
  price_change_percentage_24h?: number | null;
  market_cap?: number | null;
  image?: string;
};

const DISPLAY_LIMIT = 6;

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

export function RecentlyViewedSection() {
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [live, setLive] = useState<Record<string, LiveCoin>>({});

  const refresh = useCallback(() => {
    setEntries(readRecentlyViewed());
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
    function onChange() {
      refresh();
    }
    window.addEventListener(RECENTLY_VIEWED_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const visible = useMemo(() => entries.slice(0, DISPLAY_LIMIT), [entries]);
  const ids = useMemo(() => visible.map((e) => e.id).join(","), [visible]);

  useEffect(() => {
    if (!ids) {
      setLive({});
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/coins?ids=${encodeURIComponent(ids)}`);
        const data = await readResponseJsonSafely(res);
        const coins = data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
        if (cancelled || !Array.isArray(coins)) return;
        const map: Record<string, LiveCoin> = {};
        for (const c of coins) {
          if (c && typeof c === "object" && typeof (c as LiveCoin).id === "string") {
            map[(c as LiveCoin).id!] = c as LiveCoin;
          }
        }
        setLive(map);
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (!mounted || visible.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className="border-b border-[#f4ddc3]/15 bg-[#0f131b]/50 px-4 py-8 sm:px-6"
    >
      <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="recently-viewed-heading"
              className="text-xl font-extrabold tracking-tight sm:text-2xl"
            >
              <span className="text-brand-altcoindepot">Recently viewed</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Coins you opened on this device · saved locally, no account needed
            </p>
          </div>
          <button
            type="button"
            onClick={() => clearRecentlyViewed()}
            className="inline-flex min-h-10 items-center rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-400/35 hover:text-red-300"
          >
            Clear
          </button>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => {
            const quote = live[entry.id];
            const ch = quote?.price_change_percentage_24h;
            const img = quote?.image || entry.image;
            return (
              <li key={entry.id}>
                <Link
                  href={`/coin/${encodeURIComponent(entry.id)}`}
                  className="glass-card flex items-center gap-3 rounded-lg border-2 border-[#f4ddc3]/30 p-3.5 transition-colors hover:border-[#d1a173]/70"
                >
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="size-9 rounded-full bg-zinc-700" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-bold uppercase text-zinc-100">
                      {entry.symbol}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{entry.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-zinc-100">
                      {formatUsd(quote?.current_price)}
                    </p>
                    <p
                      className={`font-mono text-xs ${
                        (ch ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {ch == null ? "—" : `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {formatCompactUsd(quote?.market_cap)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
