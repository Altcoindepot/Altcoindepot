"use client";

import Image from "next/image";
import Link from "next/link";
import type { CoinMarket } from "@/lib/coingecko";
import { MiniCoinChart } from "@/components/mini-coin-chart";

const HOME_CATEGORY_MAX = 15;

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}

function pctText(ch: number | null | undefined) {
  if (ch == null || Number.isNaN(ch)) return "—";
  const sign = ch >= 0 ? "+" : "";
  return `${sign}${ch.toFixed(2)}%`;
}

function pctClass(ch: number | null | undefined) {
  if (ch == null || Number.isNaN(ch)) return "text-zinc-500";
  return ch >= 0 ? "text-emerald-400" : "text-red-400";
}

export function CategoryTickerColumn({
  title,
  titleHref,
  description,
  coins,
  accentClass,
}: {
  title: string;
  titleHref: string;
  description: string;
  coins: readonly CoinMarket[];
  accentClass: string;
}) {
  const displayCoins = coins.slice(0, HOME_CATEGORY_MAX);

  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#111111] p-4 transition-[border-color,box-shadow] sm:p-5 ${accentClass}`}
    >
      <h3 className="m-0 text-left">
        <Link
          href={titleHref}
          className="header-home-link inline-block max-w-full rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
        >
          <span className="text-brand-altcoindepot block text-base font-extrabold leading-tight tracking-tight sm:text-lg">
            {title}
          </span>
        </Link>
      </h3>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
      {displayCoins.length === 0 ? (
        <p className="mt-4 text-xs text-zinc-500">No tickers loaded for this category.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2.5" role="list" aria-label={`${title} coins`}>
          {displayCoins.map((coin) => {
            const ch = coin.price_change_percentage_24h;
            const href = `/coin/${encodeURIComponent(coin.id)}`;
            return (
              <Link
                key={coin.id}
                href={href}
                role="listitem"
                className="glass-card bronze-ring flex min-h-0 flex-col gap-0.5 rounded-lg border-2 border-[#f4ddc3]/45 p-2 text-left outline outline-1 outline-[#2a1e16]/60 transition-[border-color,box-shadow] hover:border-[#d1a173]/70 hover:shadow-[0_0_18px_rgba(185,129,82,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <Image
                    src={coin.image}
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 shrink-0 rounded-full"
                    sizes="16px"
                  />
                  <span className="truncate text-[11px] font-semibold leading-tight text-zinc-100">
                    {coin.name}
                  </span>
                </span>
                <span className="font-mono text-[10px] tabular-nums leading-tight text-zinc-400">
                  {formatUsd(coin.current_price)}
                </span>
                <span
                  className={`font-mono text-[10px] tabular-nums leading-tight ${pctClass(ch)}`}
                >
                  24h {pctText(ch)}
                </span>
                <MiniCoinChart
                  change24h={coin.price_change_percentage_24h}
                  change7d={coin.price_change_percentage_7d_in_currency}
                  points={coin.sparkline_in_7d?.price}
                  className="mt-1 h-6 w-full rounded border border-white/10 bg-[#0a0a0a]"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
