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

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function LiveTopCoins({ coins }: { coins: CoinMarket[] }) {
  const featuredOrder = [
    { ids: ["bitcoin"], symbols: ["btc"], names: ["bitcoin"] },
    { ids: ["ethereum"], symbols: ["eth"], names: ["ethereum"] },
    { ids: ["solana"], symbols: ["sol"], names: ["solana"] },
    {
      ids: ["lighter"],
      symbols: ["lit"],
      names: ["lighter"],
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {top.map((coin, index) => {
        const ch24 = coin.price_change_percentage_24h;
        const rank = index + 1;

        return (
          <article
            key={coin.id}
            className="glass-card rounded-lg border-2 border-[#f4ddc3]/45 p-3 outline outline-1 outline-[#2a1e16]/60 transition-colors hover:border-[#d1a173]/70 hover:bg-[rgba(48,35,26,0.3)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-[#d7ad82]">#{rank}</span>
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
                  className="block truncate text-sm font-semibold text-zinc-100 transition-colors hover:text-[#d7ad82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
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
                <p className="font-mono">{pctCell(ch24)}</p>
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
  );
}
