"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarkets } from "@/components/markets-provider";
import { PersonalMarketBrief } from "@/components/personal-market-brief";
import { MarketRegimeBadge } from "@/components/market-regime-badge";
import { computeMarketRegime } from "@/lib/market-regime";

function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function toneClass(n: number) {
  return n >= 0 ? "text-[#6ee7b7]" : "text-[#fca5a5]";
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
  if (value >= 60) return "text-[#6ee7b7]";
  if (value <= 40) return "text-[#fca5a5]";
  return "text-[#fde68a]";
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

  const btc24h =
    topMarkets.find((c) => c.symbol.toLowerCase() === "btc")?.price_change_percentage_24h ?? null;
  const regime = computeMarketRegime({
    fearGreed,
    altSeasonIndex,
    btcChange24h: btc24h,
    marketCapChange24h: globalMcap24h,
  });

  return (
    <section
      aria-label="Market sentiment trackers"
      className="section-band border-b border-[#f4ddc3]/08 bg-[#0f131b]/70 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Market regime
          </p>
          <div className="mt-1.5">
            <MarketRegimeBadge regime={regime.regime} summary={regime.summary} />
          </div>
        </div>
        <p className="text-[11px] text-zinc-500">Informational snapshot · not financial advice</p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 rounded-xl border border-[#f4ddc3]/20 bg-[rgba(18,16,20,0.92)] p-3 sm:gap-3 md:grid-cols-2 md:gap-4 md:p-4 lg:grid-cols-3">
        <article className="rounded-xl border border-[#f4ddc3]/18 bg-[rgba(28,24,30,0.95)] px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#e8d4bc]">
            Total Crypto Market Cap
          </p>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-[#faf7f2] sm:text-base">
            {formatCompactUsd(globalMcap)}
          </p>
          <p className={`mt-1 font-mono text-sm font-semibold sm:text-xs ${toneClass(globalMcap24h)}`}>
            {formatPct(globalMcap24h)} (24h)
          </p>
          <MiniLine points={mcapSeries} />
        </article>
        <article className="rounded-xl border border-[#f4ddc3]/18 bg-[rgba(28,24,30,0.95)] px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#e8d4bc]">
            Fear & Greed Index
          </p>
          <p className={`mt-1.5 text-lg font-bold sm:text-base ${fearGreedTone(fearGreedValue)}`}>
            {fearGreedLabel} ({Math.round(fearGreedValue)})
          </p>
          <div className="mt-2 rounded-full border border-white/15 bg-[#0a0a0a] p-1.5">
            <div className="relative h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400">
              <span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow"
                style={{ left: `calc(${fearGreedPos}% - 7px)` }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-[#d6c4b0] sm:text-[11px]">Source: Alternative.me</p>
        </article>
        <article className="rounded-xl border border-[#f4ddc3]/18 bg-[rgba(28,24,30,0.95)] px-4 py-4 md:col-span-2 md:px-5 md:py-5 lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#e8d4bc]">
            Alt Season Tracker
          </p>
          <p className="mt-1.5 text-lg font-bold text-[#faf7f2] sm:text-base">
            {altSeasonLabel} ({altSeasonIndex.toFixed(0)})
          </p>
          <div className="mt-2 rounded-full border border-white/15 bg-[#0a0a0a] p-1.5">
            <div className="relative h-2.5 rounded-full bg-gradient-to-r from-[#f59e0b] via-[#60a5fa] to-[#c084fc]">
              <span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow"
                style={{ left: `calc(${altPos}% - 7px)` }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-[#d6c4b0] sm:text-[11px]">
            {outperformers}/{Math.max(altUniverse.length, 1)} alts outperform BTC (7d)
          </p>
        </article>
      </div>

      <div className="mx-auto mt-4 max-w-6xl">
        <PersonalMarketBrief
          fearGreed={fearGreed}
          fearGreedLabel={fearGreedLabel}
          altSeasonIndex={altSeasonIndex}
          btcChange24h={btc24h}
          marketCapChange24h={globalMcap24h}
        />
      </div>

      <div className="mx-auto mt-2 max-w-6xl px-1 text-right text-[11px] text-[#c4b09a]">
        Last updated: {lastUpdatedLabel}
      </div>
    </section>
  );
}
