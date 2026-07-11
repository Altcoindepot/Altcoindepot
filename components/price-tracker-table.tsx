"use client";

import Image from "next/image";
import Link from "next/link";
import type { CoinMarket } from "@/lib/coingecko";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { MiniCoinChart } from "@/components/mini-coin-chart";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function pctCell(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) {
    return (
      <span className="rounded bg-zinc-800/50 px-1 py-0.5 text-[10px] text-zinc-500 sm:px-1.5 sm:text-xs">
        —
      </span>
    );
  }
  const positive = v >= 0;
  return (
    <span
      className={
        positive
          ? "inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/35 sm:text-xs"
          : "inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-300 ring-1 ring-red-500/35 sm:text-xs"
      }
    >
      {positive ? "+" : ""}
      {v.toFixed(2)}%
    </span>
  );
}

function sortBy24hChangeDesc(a: CoinMarket, b: CoinMarket): number {
  const ca = a.price_change_percentage_24h;
  const cb = b.price_change_percentage_24h;
  if (ca == null && cb == null) return 0;
  if (ca == null) return 1;
  if (cb == null) return -1;
  return cb - ca;
}

export function PriceTrackerTable({
  coins,
  twitterHandleForCoin,
}: {
  coins: CoinMarket[];
  twitterHandleForCoin?: (id: string) => string | undefined;
}) {
  /** Biggest 24h % gainers first; missing 24h data sorts last. */
  const ranked = [...coins].sort(sortBy24hChangeDesc);

  return (
    <div className="glass-panel max-h-[min(34rem,75vh)] overflow-y-auto rounded-xl p-3 [scrollbar-color:rgba(185,129,82,0.35)_transparent] [scrollbar-width:thin] sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ranked.map((coin, index) => {
          const handle = twitterHandleForCoin?.(coin.id);
          const xHref = handle ? `https://x.com/${handle}` : undefined;
          const rank = index + 1;
          return (
            <article
              key={coin.id}
              className="glass-card rounded-lg border-2 border-[#f4ddc3]/45 p-3 outline outline-1 outline-[#2a1e16]/60 transition-colors hover:border-[#d1a173]/70 hover:bg-[rgba(48,35,26,0.3)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-[#d7ad82]">#{rank}</span>
                {xHref ? (
                  <a
                    href={xHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded p-0.5 text-zinc-500 transition-colors hover:text-[#d7ad82]"
                    aria-label={`${coin.name} on X`}
                  >
                    <XIcon className="size-4" />
                  </a>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-2.5">
                <span className="relative size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  <Image
                    src={coin.image}
                    alt=""
                    width={32}
                    height={32}
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/coin/${encodeURIComponent(coin.id)}`}
                    className="block truncate text-sm font-semibold text-zinc-100 transition-colors hover:text-[#d7ad82]"
                  >
                    {coin.name}
                  </Link>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">{coin.symbol}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-zinc-500">Price</p>
                  <p className="font-mono text-zinc-100">{formatUsd(coin.current_price)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">24h</p>
                  <p className="font-mono">{pctCell(coin.price_change_percentage_24h)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">7d</p>
                  <p className="font-mono">{pctCell(coin.price_change_percentage_7d_in_currency)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">MCap</p>
                  <p className="font-mono text-zinc-200">{formatCompactUsd(coin.market_cap)}</p>
                </div>
              </div>
              <MiniCoinChart
                change24h={coin.price_change_percentage_24h}
                change7d={coin.price_change_percentage_7d_in_currency}
                points={coin.sparkline_in_7d?.price}
                className="mt-2 h-7 w-full rounded border border-white/10 bg-[#0a0a0a]"
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
