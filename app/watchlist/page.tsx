"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useWatchlist } from "@/components/use-watchlist";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import { removeWatchlistId } from "@/lib/watchlist-storage";

type LiveCoin = {
  id: string;
  current_price?: number | null;
  price_change_percentage_24h?: number | null;
  market_cap?: number | null;
  image?: string;
};

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

export default function WatchlistPage() {
  const { entries, mounted } = useWatchlist();
  const [live, setLive] = useState<Record<string, LiveCoin>>({});

  const ids = useMemo(() => entries.map((e) => e.id).join(","), [entries]);

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
    const t = window.setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [ids]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Saved on this device only — no account needed. Open a coin page and tap “Add to
          watchlist”.
        </p>

        {!mounted ? (
          <p className="mt-8 text-sm text-zinc-500">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="mt-8 rounded-lg border border-white/10 bg-[#111111] p-6 text-sm text-zinc-400">
            Your watchlist is empty.{" "}
            <Link href="/" className="text-[#d7ad82] underline-offset-2 hover:underline">
              Browse markets
            </Link>{" "}
            and star coins you want to track.
          </p>
        ) : (
          <ul className="mt-8 space-y-2">
            {entries.map((entry) => {
              const quote = live[entry.id];
              const ch = quote?.price_change_percentage_24h;
              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f4ddc3]/15 bg-[#0f131b]/70 px-3 py-3"
                >
                  <Link
                    href={`/coin/${encodeURIComponent(entry.id)}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {(quote?.image || entry.image) && (
                      <Image
                        src={quote?.image || entry.image!}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold uppercase text-zinc-100">
                        {entry.symbol}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{entry.name}</p>
                    </div>
                    <div className="ml-auto text-right">
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
                        Mcap {formatCompactUsd(quote?.market_cap)}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeWatchlistId(entry.id)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-400/40 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
