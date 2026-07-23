"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MiniCoinChart } from "@/components/mini-coin-chart";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { readResponseJsonSafely } from "@/lib/read-response-json";

type Mover = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  sparkline_in_7d?: { price?: number[] };
};

const POLL_MS = 25_000;

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function LiveTrendingMovers() {
  const [coins, setCoins] = useState<Mover[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/trending-movers?_=${Date.now()}`, { cache: "no-store" });
        const data = await readResponseJsonSafely(res);
        if (!mounted) return;
        if (!res.ok || !data || typeof data !== "object") {
          setError(true);
          return;
        }
        const list = (data as { coins?: unknown }).coins;
        if (Array.isArray(list)) {
          setCoins(list as Mover[]);
          setError(false);
        }
        const ts = (data as { updatedAt?: unknown }).updatedAt;
        if (typeof ts === "string") setUpdatedAt(ts);
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    const id = window.setInterval(() => {
      void load();
    }, POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <section
      aria-labelledby="live-trending-heading"
      className="border-b border-[#f4ddc3]/15 bg-[#0f131b]/55 px-4 py-8 sm:px-6"
    >
      <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="live-trending-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="text-brand-altcoindepot">Live movers</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              High-volume coins ranked by biggest 24h moves · refreshes about every 25s
            </p>
          </div>
          {updatedAt ? (
            <p className="font-mono text-[10px] text-zinc-500">
              Updated {new Date(updatedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>

        {loading && coins.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Loading movers…</p>
        ) : null}

        {error && coins.length === 0 ? (
          <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
            Movers are unavailable right now (API busy or offline). We’ll keep retrying
            automatically.
          </div>
        ) : null}

        {error && coins.length > 0 ? (
          <p className="mt-3 text-xs text-amber-200/80">
            Latest refresh failed — showing the last movers we got.
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {coins.slice(0, 8).map((coin) => {
            const ch = coin.price_change_percentage_24h;
            return (
              <Link
                key={coin.id}
                href={`/coin/${encodeURIComponent(coin.id)}`}
                className="glass-card rounded-lg border-2 border-[#f4ddc3]/35 p-3.5 transition-colors hover:border-[#d1a173]/70"
              >
                <div className="flex items-center gap-2">
                  {coin.image ? (
                    <Image src={coin.image} alt="" width={24} height={24} className="rounded-full" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-bold uppercase text-zinc-100">
                      {coin.symbol}
                    </p>
                    <p className="truncate text-[10px] text-zinc-500">{coin.name}</p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 font-mono text-xs font-semibold ${
                      (ch ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatPct(ch)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-zinc-200">{formatUsd(coin.current_price)}</span>
                  <span className="text-zinc-500">Vol {formatCompactUsd(coin.total_volume)}</span>
                </div>
                <MiniCoinChart
                  change24h={ch}
                  points={coin.sparkline_in_7d?.price}
                  className="mt-2 h-6 w-full rounded border border-white/10 bg-[#0a0a0a]"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
