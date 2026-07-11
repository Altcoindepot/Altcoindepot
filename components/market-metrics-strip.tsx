"use client";

import type { CoinMarket } from "@/lib/coingecko";
import { formatCompactUsd } from "@/lib/format-compact-usd";

function compactUsd(n: number) {
  return formatCompactUsd(n);
}

function pct(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function trendClass(value: number | null) {
  if (value == null || Number.isNaN(value)) return "text-zinc-500";
  return value >= 0 ? "text-emerald-400" : "text-red-400";
}

function trendArrow(value: number | null) {
  if (value == null || Number.isNaN(value)) return "•";
  return value >= 0 ? "▲" : "▼";
}

export function MarketMetricsStrip({ coins }: { coins: CoinMarket[] }) {
  const totalMarketCap = coins.reduce((sum, c) => sum + (c.market_cap ?? 0), 0);
  const totalVolume = coins.reduce((sum, c) => sum + (c.total_volume ?? 0), 0);
  const capYesterdayEstimate = coins.reduce((sum, c) => {
    const cap = c.market_cap ?? 0;
    const ch = c.price_change_percentage_24h;
    if (ch == null || Number.isNaN(ch) || ch <= -99) return sum + cap;
    const estPrev = cap / (1 + ch / 100);
    return sum + (Number.isFinite(estPrev) ? estPrev : cap);
  }, 0);
  const marketCapChangePct =
    capYesterdayEstimate > 0
      ? ((totalMarketCap - capYesterdayEstimate) / capYesterdayEstimate) * 100
      : null;
  const avg24hChange =
    coins.length > 0
      ? coins.reduce((sum, c) => sum + (c.price_change_percentage_24h ?? 0), 0) / coins.length
      : null;
  const btc = coins.find((c) => c.symbol.toLowerCase() === "btc");
  const eth = coins.find((c) => c.symbol.toLowerCase() === "eth");
  const btcDominance =
    totalMarketCap > 0 && btc?.market_cap != null
      ? (btc.market_cap / totalMarketCap) * 100
      : null;
  const ethDominance =
    totalMarketCap > 0 && eth?.market_cap != null
      ? (eth.market_cap / totalMarketCap) * 100
      : null;
  const btc24h = btc?.price_change_percentage_24h ?? null;
  const eth24h = eth?.price_change_percentage_24h ?? null;

  const items = [
    {
      label: "Top 100 Market Cap",
      value: compactUsd(totalMarketCap),
      trend: marketCapChangePct,
    },
    {
      label: "Top 100 Volume (24h)",
      value: compactUsd(totalVolume),
      trend: avg24hChange,
    },
    { label: "BTC Dominance", value: pct(btcDominance), trend: btc24h },
    { label: "ETH Dominance", value: pct(ethDominance), trend: eth24h },
  ] as const;

  return (
    <section aria-label="Market overview metrics" className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="glass-card rounded-lg px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">{item.label}</p>
            <span className={`text-[10px] font-semibold ${trendClass(item.trend)}`}>
              {trendArrow(item.trend)}{" "}
              {item.trend != null && Number.isFinite(item.trend)
                ? `${item.trend >= 0 ? "+" : ""}${item.trend.toFixed(2)}%`
                : "—"}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-100">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
