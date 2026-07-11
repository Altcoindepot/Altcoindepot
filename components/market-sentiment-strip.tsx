"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarkets } from "@/components/markets-provider";

function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function toneClass(n: number) {
  return n >= 0 ? "text-emerald-300" : "text-red-300";
}

function formatCompactUsd(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

function fearGreedTone(value: number) {
  if (value >= 60) return "text-emerald-300";
  if (value <= 40) return "text-red-300";
  return "text-amber-200";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function buildMarketCapSeries(topMarkets: ReturnType<typeof useMarkets>["topMarkets"]) {
  const rows = topMarkets.filter(
    (c) =>
      typeof c.market_cap === "number" &&
      c.market_cap > 0 &&
      Array.isArray(c.sparkline_in_7d?.price) &&
      (c.sparkline_in_7d?.price?.length ?? 0) >= 8,
  );
  if (rows.length === 0) return [] as number[];
  const minLen = Math.min(...rows.map((c) => c.sparkline_in_7d?.price?.length ?? 0), 60);
  const series: number[] = [];
  for (let i = 0; i < minLen; i++) {
    let total = 0;
    for (const coin of rows) {
      const prices = coin.sparkline_in_7d?.price ?? [];
      const now = prices[prices.length - 1];
      const p = prices[prices.length - minLen + i];
      if (!Number.isFinite(now) || !Number.isFinite(p) || !coin.market_cap) continue;
      total += coin.market_cap * (p / now);
    }
    series.push(total);
  }
  return series;
}

function MiniLine({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div className="mt-1 h-7 rounded border border-white/10 bg-[#0a0a0a]" />;
  }
  const positive = points[points.length - 1] >= points[0];
  const color = positive ? "#34d399" : "#f87171";
  const width = 140;
  const height = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const polyline = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 h-7 w-full rounded border border-white/10 bg-[#0a0a0a]">
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MarketSentimentStrip() {
  const { topMarkets } = useMarkets();
  const [globalMcap, setGlobalMcap] = useState<number | null>(null);
  const [globalMcap24h, setGlobalMcap24h] = useState(0);
  const [fearGreed, setFearGreed] = useState<number | null>(null);
  const [fearGreedLabel, setFearGreedLabel] = useState("Loading");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/market-sentiment?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!mounted || !data || typeof data !== "object") return;
        const mcap = Number((data as { totalMarketCapUsd?: unknown }).totalMarketCapUsd ?? 0);
        const mcap24 = Number((data as { marketCap24hChangePct?: unknown }).marketCap24hChangePct ?? 0);
        const fgVal = Number((data as { fearGreed?: { value?: unknown } }).fearGreed?.value ?? 0);
        const fgLabel = (data as { fearGreed?: { label?: unknown } }).fearGreed?.label;
        if (Number.isFinite(mcap)) setGlobalMcap(mcap);
        if (Number.isFinite(mcap24)) setGlobalMcap24h(mcap24);
        if (Number.isFinite(fgVal)) setFearGreed(fgVal);
        if (typeof fgLabel === "string" && fgLabel) setFearGreedLabel(fgLabel);
        setLastUpdatedAt(new Date());
      } catch {
        // keep previous
      }
    }
    void refresh();
    const id = window.setInterval(() => void refresh(), 120000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const mcapSeries = useMemo(() => buildMarketCapSeries(topMarkets).slice(-28), [topMarkets]);
  const movers = topMarkets.filter(
    (c) => typeof c.price_change_percentage_7d_in_currency === "number" && Number.isFinite(c.price_change_percentage_7d_in_currency),
  );
  const btc7d =
    topMarkets.find((c) => c.symbol.toLowerCase() === "btc")?.price_change_percentage_7d_in_currency ?? 0;
  const altUniverse = movers.filter((c) => c.symbol.toLowerCase() !== "btc" && !["usdt", "usdc", "dai", "usde"].includes(c.symbol.toLowerCase())).slice(0, 50);
  const outperformers = altUniverse.filter((c) => (c.price_change_percentage_7d_in_currency ?? -999) > btc7d).length;
  const altSeasonIndex = altUniverse.length > 0 ? (outperformers / altUniverse.length) * 100 : 0;
  const altSeasonLabel = "AltCoin Season";
  const fearGreedValue = fearGreed ?? 50;
  const fearGreedPos = clamp(fearGreedValue, 0, 100);
  const altPos = clamp(altSeasonIndex, 0, 100);
  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "—";

  return (
    <section
      aria-label="Market sentiment trackers"
      className="border-b border-[#f4ddc3]/15 bg-[#0f131b]/70 px-4 py-3 sm:px-6"
    >
      <div className="glass-panel mx-auto grid max-w-6xl gap-2 rounded-xl p-2.5 md:grid-cols-3">
        <article className="glass-card rounded-lg px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Total Crypto Market Cap</p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-100">{formatCompactUsd(globalMcap)}</p>
          <p className={`font-mono text-[11px] ${toneClass(globalMcap24h)}`}>{formatPct(globalMcap24h)} (24h)</p>
          <MiniLine points={mcapSeries} />
        </article>
        <article className="glass-card rounded-lg px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Fear & Greed Index</p>
          <p className={`mt-0.5 text-sm font-semibold ${fearGreedTone(fearGreedValue)}`}>
            {fearGreedLabel} ({Math.round(fearGreedValue)})
          </p>
          <div className="mt-1 rounded-full border border-white/15 bg-[#0a0a0a] p-1">
            <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500/70 via-amber-400/70 to-emerald-400/70">
              <span
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/40 bg-white"
                style={{ left: `calc(${fearGreedPos}% - 6px)` }}
              />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Source: Alternative.me</p>
        </article>
        <article className="glass-card rounded-lg px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Alt Season Tracker</p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-100">
            {altSeasonLabel} ({altSeasonIndex.toFixed(0)})
          </p>
          <div className="mt-1 rounded-full border border-white/15 bg-[#0a0a0a] p-1">
            <div className="relative h-2 rounded-full bg-gradient-to-r from-[#f59e0b]/70 via-[#60a5fa]/70 to-[#a855f7]/70">
              <span
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/40 bg-white"
                style={{ left: `calc(${altPos}% - 6px)` }}
              />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            {outperformers}/{Math.max(altUniverse.length, 1)} alts outperform BTC (7d)
          </p>
        </article>
      </div>
      <div className="mx-auto mt-1 max-w-6xl px-1 text-right text-[10px] text-zinc-500">
        Last updated: {lastUpdatedLabel}
      </div>
    </section>
  );
}
