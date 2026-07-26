import Image from "next/image";
import Link from "next/link";
import type { CoinMarket } from "@/lib/coingecko";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { MiniCoinChart } from "@/components/mini-coin-chart";

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
      <span className="rounded bg-zinc-800/50 px-1.5 py-0.5 text-xs text-zinc-500 sm:px-1.5 sm:text-xs">
        —
      </span>
    );
  }
  const positive = v >= 0;
  return (
    <span
      className={
        positive
          ? "inline-block rounded bg-emerald-500/20 px-1.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/35 sm:py-0.5 sm:text-xs"
          : "inline-block rounded bg-red-500/20 px-1.5 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-500/35 sm:py-0.5 sm:text-xs"
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
      ids: ["injective", "injective-protocol"],
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
          <article
            key={coin.id}
            role="listitem"
            className="glass-card w-[min(85vw,20rem)] shrink-0 snap-start rounded-xl border border-[#f4ddc3]/20 p-5 outline-none transition-colors hover:border-[#d1a173]/45 hover:bg-[rgba(48,35,26,0.25)] lg:w-auto lg:shrink lg:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-[#d7ad82]">#{rank}</span>
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 sm:size-8">
                <Image
                  src={coin.image}
                  alt=""
                  width={36}
                  height={36}
                  sizes="36px"
                  className="object-cover"
                />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/coin/${encodeURIComponent(coin.id)}`}
                  className="block truncate text-base font-semibold text-zinc-100 transition-colors hover:text-[#d7ad82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:text-sm"
                >
                  {coin.name}
                </Link>
                <p className="text-xs uppercase tracking-wide text-zinc-500 sm:text-[10px]">
                  {coin.symbol}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-xs sm:space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-zinc-500">Price</p>
                  <p className="font-mono text-base tabular-nums text-zinc-100 sm:text-sm">
                    {formatUsd(coin.current_price)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">24h</p>
                  <p className="font-mono text-sm sm:text-xs">{pctCell(ch24)}</p>
                </div>
              </div>
              <div className="space-y-0.5">
                <MiniCoinChart
                  change24h={coin.price_change_percentage_24h}
                  change7d={coin.price_change_percentage_7d_in_currency}
                  points={coin.sparkline_in_7d?.price}
                />
                <div className="flex items-baseline justify-between gap-2 pt-0.5">
                  <p className="flex items-baseline gap-1.5 font-mono text-sm leading-none sm:text-xs">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">7d</span>
                    {pctCell(coin.price_change_percentage_7d_in_currency)}
                  </p>
                  <p className="font-mono text-sm tabular-nums leading-none text-zinc-200 sm:text-xs">
                    <span className="mr-1 text-[10px] uppercase tracking-wide text-zinc-500">
                      MCap
                    </span>
                    {formatCompactUsd(coin.market_cap)}
                  </p>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
