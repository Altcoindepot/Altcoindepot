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
import { SectionHeading } from "@/components/section-heading";

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

  if (!mounted) {
    return (
      <section
        aria-labelledby="recently-viewed-heading"
        className="section-band border-b border-[#f4ddc3]/08 bg-[#0f131b]/50 px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-5 sm:p-6 md:p-7">
          <SectionHeading id="recently-viewed-heading">Recently viewed</SectionHeading>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-white/8 bg-[#111111]/60 p-4"
              >
                <div className="size-9 rounded-full bg-zinc-800/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-16 rounded bg-zinc-800/40" />
                  <div className="h-3 w-24 rounded bg-zinc-800/25" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className="section-band border-b border-[#f4ddc3]/08 bg-[#0f131b]/50 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-5 sm:p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionHeading id="recently-viewed-heading">Recently viewed</SectionHeading>
            <p className="mt-2 text-sm text-zinc-400 sm:pl-4">
              Coins you opened on this device · saved locally, no account needed
            </p>
          </div>
          {visible.length > 0 ? (
            <button
              type="button"
              onClick={() => clearRecentlyViewed()}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-400/35 hover:text-red-300"
            >
              Clear
            </button>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[#f4ddc3]/18 bg-[#0c0e14]/50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-zinc-200">No coins viewed yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Open any coin page and it’ll show up here for quick return visits.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d1a173]/40 bg-[#d1a173]/12 px-4 text-sm font-semibold text-[#d7ad82]"
            >
              Browse featured coins
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((entry, index) => {
              const quote = live[entry.id];
              const ch = quote?.price_change_percentage_24h;
              const img = quote?.image || entry.image;
              return (
                <li key={entry.id} className={index >= 3 ? "hidden sm:block" : undefined}>
                  <Link
                    href={`/coin/${encodeURIComponent(entry.id)}`}
                    className="glass-card flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-[#f4ddc3]/12 p-4 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#d1a173]/50 hover:bg-[rgba(48,35,26,0.28)]"
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
                      <p className="font-mono text-base font-semibold tabular-nums text-zinc-50">
                        {formatUsd(quote?.current_price)}
                      </p>
                      <p
                        className={`font-mono text-sm font-semibold tabular-nums ${
                          (ch ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
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
        )}
      </div>
    </section>
  );
}
