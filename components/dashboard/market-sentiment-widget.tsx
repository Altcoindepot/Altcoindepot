import type { MarketPulse } from "@/lib/dashboard-data";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { ds } from "@/lib/ui-classes";
import {
  altseasonBand,
  clampSentimentScore,
  fearGreedBand,
  MARKET_SENTIMENT_SNAPSHOT,
} from "@/lib/market-sentiment";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function titleCaseBand(label: string) {
  return label.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function MarketCapSparkline({ positive }: { positive: boolean }) {
  const color = positive ? "#34d399" : "#f87171";
  const series = positive
    ? [18, 22, 20, 28, 26, 34, 32, 40, 38, 48, 52, 58]
    : [58, 52, 54, 42, 44, 34, 36, 26, 28, 18, 16, 12];
  const width = 140;
  const height = 28;
  const padY = 3;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const step = width / (series.length - 1);
  const points = series
    .map((p, i) => {
      const x = i * step;
      const y = height - padY - ((p - min) / range) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-1 h-7 w-full rounded border border-white/10 bg-[#0a0a0a]"
      aria-hidden
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GaugeBar({
  value,
  gradient,
}: {
  value: number;
  gradient: string;
}) {
  const pos = clampSentimentScore(value);
  return (
    <div className="mt-2 rounded-full border border-white/15 bg-[#0a0a0a] p-1.5">
      <div className={`relative h-2.5 rounded-full ${gradient}`}>
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow"
          style={{ left: `calc(${pos}% - 7px)` }}
        />
      </div>
    </div>
  );
}

export function MarketSentimentWidget({
  pulse,
  fearAndGreedValue = MARKET_SENTIMENT_SNAPSHOT.fearAndGreedValue,
  altseasonProgress = MARKET_SENTIMENT_SNAPSHOT.altseasonProgress,
  className = "",
}: {
  pulse: MarketPulse;
  fearAndGreedValue?: number;
  altseasonProgress?: number;
  className?: string;
}) {
  const fg = fearGreedBand(fearAndGreedValue);
  const alt = altseasonBand(altseasonProgress);
  const mcapUp = (pulse.marketCapChange24h ?? 0) >= 0;
  const fgValue = clampSentimentScore(fearAndGreedValue);

  return (
    <section
      id="market-pulse"
      aria-labelledby="market-sentiment-heading"
      className={className}
    >
      <h2 id="market-sentiment-heading" className="sr-only">
        Market Pulse &amp; Sentiment
      </h2>
      <div className={`grid grid-cols-1 gap-3 ${ds.panel} sm:grid-cols-3`}>
        <article className={ds.card}>
          <p className={ds.label}>Total Crypto Market Cap</p>
          <p className="mt-2 text-lg font-bold tabular-nums text-zinc-50 sm:text-base">
            {formatCompactUsd(pulse.totalMarketCapUsd)}
          </p>
          <p
            className={`mt-1 font-mono text-sm font-semibold sm:text-xs ${
              mcapUp ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {formatPct(pulse.marketCapChange24h)} (24h)
          </p>
          <MarketCapSparkline positive={mcapUp} />
        </article>

        <article className={ds.card}>
          <p className={ds.label}>Fear &amp; Greed Index</p>
          <p className={`mt-2 text-lg font-bold sm:text-base ${fg.textClass}`}>
            {titleCaseBand(fg.label)} ({fgValue})
          </p>
          <GaugeBar
            value={fearAndGreedValue}
            gradient="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400"
          />
          <p className="mt-2 text-xs text-zinc-500 sm:text-[11px]">Source: Alternative.me</p>
        </article>

        <article className={ds.card}>
          <p className={ds.label}>Alt Season Tracker</p>
          <p className={`mt-2 text-lg font-bold sm:text-base ${alt.textClass}`}>{alt.label}</p>
          <GaugeBar
            value={altseasonProgress}
            gradient="bg-gradient-to-r from-[#f59e0b] via-[#60a5fa] to-[#c084fc]"
          />
          <p className="mt-2 text-xs text-zinc-500 sm:text-[11px]">
            Capital rotating from Bitcoin into alts (90d)
          </p>
        </article>
      </div>
    </section>
  );
}
