import Image from "next/image";
import Link from "next/link";
import type { CoinMarket } from "@/lib/coingecko";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { MiniCoinChart } from "@/components/mini-coin-chart";
import { LiquidityBadge } from "@/components/liquidity-badge";
import { NarrativeTags } from "@/components/narrative-tags";

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function pctBadge(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) {
    return (
      <span className="inline-block rounded-md bg-zinc-800/50 px-2 py-1 text-xs text-zinc-500">
        —
      </span>
    );
  }
  const positive = v >= 0;
  return (
    <span
      className={
        positive
          ? "inline-block rounded-md bg-emerald-500/25 px-2.5 py-1.5 text-sm font-bold tabular-nums text-emerald-200 ring-1 ring-emerald-400/40"
          : "inline-block rounded-md bg-red-500/25 px-2.5 py-1.5 text-sm font-bold tabular-nums text-red-200 ring-1 ring-red-400/40"
      }
    >
      {positive ? "+" : ""}
      {v.toFixed(2)}%
    </span>
  );
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function LiveTopCoins({ coins }: { coins: CoinMarket[] }) {
  const featuredOrder = [
    { ids: ["bitcoin"], symbols: ["btc"], names: ["bitcoin"] },
    { ids: ["ethereum"], symbols: ["eth"], names: ["ethereum"] },
    { ids: ["solana"], symbols: ["sol"], names: ["solana"] },
    {
      ids: ["ripple"],
      symbols: ["xrp"],
      names: ["xrp", "ripple"],
    },
    {
      ids: ["injective-protocol"],
      symbols: ["inj"],
      names: ["injective"],
    },
  ];
  const byId = new Map(coins.map((coin) => [coin.id, coin]));
  const top = featuredOrder
    .map((target) => {
      for (const id of target.ids) {
        const hit = byId.get(id);
        if (hit) return hit;
      }
      return coins.find((coin) => {
        const symbol = coin.symbol.toLowerCase();
        const name = coin.name.toLowerCase();
        const symbolNorm = normalizeToken(symbol);
        const nameNorm = normalizeToken(name);
        return (
          target.symbols.some((s) => normalizeToken(s) === symbolNorm) ||
          target.names.some((n) => {
            const targetNorm = normalizeToken(n);
            return (
              nameNorm === targetNorm ||
              nameNorm.includes(targetNorm) ||
              normalizeToken(coin.id) === targetNorm
            );
          })
        );
      });
    })
    .filter((coin): coin is CoinMarket => Boolean(coin));

  return (
    <div
      className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:mx-0 sm:gap-5 lg:grid lg:snap-none lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0"
      role="list"
    >
      {top.map((coin, index) => {
        const ch24 = coin.price_change_percentage_24h;
        const rank = index + 1;

        return (
          <Link
            key={coin.id}
            href={`/coin/${encodeURIComponent(coin.id)}`}
            role="listitem"
            className="glass-card group block w-[min(85vw,21rem)] shrink-0 snap-start rounded-xl border border-[#f4ddc3]/12 p-6 outline-none transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#d1a173]/55 hover:bg-[rgba(48,35,26,0.32)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] focus-visible:border-[#d1a173]/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] lg:w-auto lg:shrink lg:p-7"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-[#d7ad82]">#{rank}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 sm:size-9">
                <Image
                  src={coin.image}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  className="object-cover"
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-zinc-100 transition-colors group-hover:text-[#d7ad82]">
                  {coin.name}
                </p>
                <p className="text-xs uppercase tracking-wide text-zinc-500">{coin.symbol}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <NarrativeTags coinId={coin.id} />
                  <LiquidityBadge
                    totalVolume={coin.total_volume}
                    marketCap={coin.market_cap}
                    compact
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Price</p>
                  {pctBadge(ch24)}
                </div>
                <p className="mt-1.5 truncate font-mono text-lg font-bold tabular-nums leading-tight text-zinc-50">
                  {formatUsd(coin.current_price)}
                </p>
              </div>
              <div className="space-y-1.5">
                <MiniCoinChart
                  change24h={coin.price_change_percentage_24h}
                  change7d={coin.price_change_percentage_7d_in_currency}
                  points={coin.sparkline_in_7d?.price}
                  className="h-16 w-full rounded-md border border-white/10 bg-[#06070a]"
                />
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-0.5">
                  <p className="flex min-w-0 items-center gap-1.5 font-mono text-xs leading-none">
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-500">
                      7d
                    </span>
                    {pctBadge(coin.price_change_percentage_7d_in_currency)}
                  </p>
                  <p className="font-mono text-xs tabular-nums leading-none text-zinc-300">
                    <span className="mr-1 text-[10px] uppercase tracking-wide text-zinc-500">
                      MCap
                    </span>
                    {formatCompactUsd(coin.market_cap)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
