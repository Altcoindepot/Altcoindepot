import { ds } from "@/lib/ui-classes";
import {
  clampSentimentScore,
  fearGreedBand,
  MARKET_SENTIMENT_SNAPSHOT,
} from "@/lib/market-sentiment";

function FearGreedDial({ value }: { value: number }) {
  const v = clampSentimentScore(value);
  const band = fearGreedBand(v);
  const r = 72;
  const c = Math.PI * r;
  const filled = (v / 100) * c;

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox="0 0 200 118" className="h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id="fg-track" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
        </defs>
        <path
          d="M 28 100 A 72 72 0 0 1 172 100"
          fill="none"
          stroke="url(#fg-track)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 28 100 A 72 72 0 0 1 172 100"
          fill="none"
          stroke={band.stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${band.stroke}88)` }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-[42%] flex flex-col items-center">
        <p className="text-4xl font-extrabold tabular-nums tracking-tight text-zinc-50">{v}</p>
        <span
          className={`${ds.badge} mt-1.5 inline-flex uppercase tracking-wider ${band.badgeClass}`}
        >
          {band.label}
        </span>
      </div>
    </div>
  );
}

function AltseasonRing({ value }: { value: number }) {
  const v = clampSentimentScore(value);
  const r = 54;
  const c = 2 * Math.PI * r;
  const filled = (v / 100) * c;

  return (
    <div className="relative mx-auto size-[148px]">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
          style={{ filter: "drop-shadow(0 0 8px rgba(45,212,191,0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-extrabold tabular-nums text-zinc-50">{v}%</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-teal-300/80">
          Altseason
        </p>
      </div>
    </div>
  );
}

export function MarketSentimentWidget({
  fearAndGreedValue = MARKET_SENTIMENT_SNAPSHOT.fearAndGreedValue,
  altseasonProgress = MARKET_SENTIMENT_SNAPSHOT.altseasonProgress,
  className = "",
}: {
  fearAndGreedValue?: number;
  altseasonProgress?: number;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="market-sentiment-heading"
      className={`${ds.panelLg} ${className}`.trim()}
    >
      <h2 id="market-sentiment-heading" className="text-base font-semibold text-zinc-100">
        Market Pulse &amp; Sentiment
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Informational gauges from a static snapshot — not a live CoinGecko feed.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col items-center border-b border-white/10 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <p className={`${ds.label} mb-3 self-start`}>Fear &amp; Greed Index</p>
          <FearGreedDial value={fearAndGreedValue} />
        </div>
        <div className="flex flex-col items-center md:pl-2">
          <p className={`${ds.label} mb-3 self-start`}>Altseason Tracker</p>
          <AltseasonRing value={altseasonProgress} />
          <p className="mt-4 max-w-sm text-center text-xs leading-relaxed text-zinc-500">
            Measures capital flows shifting out of Bitcoin and into altcoin narratives over a
            rolling 90-day window.
          </p>
        </div>
      </div>
    </section>
  );
}
