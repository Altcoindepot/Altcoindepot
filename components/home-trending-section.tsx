"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MiniCoinChart } from "@/components/mini-coin-chart";
import { SectionHeading } from "@/components/section-heading";
import { QuietFilterToggle, useQuietFilter } from "@/components/quiet-filter-toggle";
import { LiquidityBadge } from "@/components/liquidity-badge";
import { isQuietNoise } from "@/lib/liquidity";
import { readResponseJsonSafely } from "@/lib/read-response-json";

type TrendingCoin = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
  market_cap_rank?: number | null;
  trending_rank?: number;
  sparkline_in_7d?: { price?: number[] };
};

const POLL_MS = 90_000;

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

function TrendingSkeleton() {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-white/8 bg-[#0c0e14]/60 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="size-6 rounded-full bg-zinc-800/40" />
            <div className="size-8 rounded-full bg-zinc-800/35" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded bg-zinc-800/40" />
              <div className="h-3 w-12 rounded bg-zinc-800/25" />
            </div>
          </div>
          <div className="mt-3 h-5 w-24 rounded bg-zinc-800/35" />
          <div className="mt-3 h-12 w-full rounded bg-zinc-800/25" />
        </li>
      ))}
    </ul>
  );
}

export function HomeTrendingSection() {
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const quiet = useQuietFilter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/trending-coins?_=${Date.now()}`, { cache: "no-store" });
        const data = await readResponseJsonSafely(res);
        if (!mounted) return;
        if (!res.ok || !data || typeof data !== "object") {
          setError(true);
          return;
        }
        const list = (data as { coins?: unknown }).coins;
        if (Array.isArray(list)) {
          setCoins(list as TrendingCoin[]);
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <section
      aria-labelledby="home-trending-heading"
      className="section-band border-b border-[#f4ddc3]/08 bg-[#0f131b]/58 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-5 sm:p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionHeading id="home-trending-heading">Trending</SectionHeading>
            <p className="mt-2 text-sm text-zinc-400 sm:pl-4">
              Coins people are watching right now · CoinGecko trending
            </p>
          </div>
          <QuietFilterToggle />
        </div>

        {loading && coins.length === 0 ? <TrendingSkeleton /> : null}

        {error && coins.length === 0 ? (
          <p className="mt-6 text-sm text-amber-200/90">
            Trending is unavailable right now. Try again shortly.
          </p>
        ) : null}

        {coins.length > 0 ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {coins
              .filter((c) =>
                quiet
                  ? !isQuietNoise({
                      totalVolume: c.total_volume,
                      marketCap: c.market_cap,
                      id: c.id,
                      symbol: c.symbol,
                      name: c.name,
                    })
                  : true,
              )
              .slice(0, 8)
              .map((coin) => {
              const ch = coin.price_change_percentage_24h;
              const up = (ch ?? 0) >= 0;
              const rank = coin.trending_rank ?? coin.market_cap_rank ?? "—";
              return (
                <li key={coin.id}>
                  <Link
                    href={`/coin/${encodeURIComponent(coin.id)}`}
                    className="glass-card block rounded-xl border border-[#f4ddc3]/12 p-4 transition-[border-color,transform,background-color] hover:-translate-y-0.5 hover:border-[#d1a173]/50 hover:bg-[rgba(48,35,26,0.28)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d1a173]/15 font-mono text-[11px] font-bold text-[#d7ad82]">
                        {rank}
                      </span>
                      {coin.image ? (
                        <Image
                          src={coin.image}
                          alt=""
                          width={32}
                          height={32}
                          className="size-8 rounded-full ring-1 ring-white/10"
                        />
                      ) : (
                        <span className="size-8 rounded-full bg-zinc-700" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-100">{coin.name}</p>
                        <p className="font-mono text-[11px] uppercase text-zinc-500">
                          {coin.symbol}
                        </p>
                        <div className="mt-1">
                          <LiquidityBadge
                            totalVolume={coin.total_volume}
                            marketCap={coin.market_cap}
                            compact
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <p className="font-mono text-base font-bold tabular-nums text-zinc-50">
                        {formatUsd(coin.current_price)}
                      </p>
                      <span
                        className={`rounded-md px-2 py-1 font-mono text-xs font-bold tabular-nums ${
                          up
                            ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/35"
                            : "bg-red-500/20 text-red-200 ring-1 ring-red-400/35"
                        }`}
                      >
                        {formatPct(ch)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <MiniCoinChart
                        change24h={ch}
                        points={coin.sparkline_in_7d?.price}
                        className="h-12 w-full rounded-md border border-white/10 bg-[#06070a]"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
