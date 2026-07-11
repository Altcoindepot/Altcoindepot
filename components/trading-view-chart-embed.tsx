"use client";

import { useMemo, useState } from "react";

const TIMEFRAMES = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "1h", value: "60" },
  { label: "4h", value: "240" },
  { label: "1D", value: "D" },
  { label: "1W", value: "W" },
] as const;

function widgetSrc(symbol: string, interval: string) {
  return `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
    symbol,
  )}&interval=${encodeURIComponent(interval)}&theme=dark&style=1&locale=en&toolbarbg=0a0a0a&hide_top_toolbar=1&saveimage=0`;
}

function fullChartHref(symbol: string, interval: string) {
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`;
}

export function TradingViewChartEmbed({
  symbol,
  coinName,
  alternateSymbols,
}: {
  symbol: string;
  coinName: string;
  /** Shown as quick links below the chart (e.g. other exchange mappings). */
  alternateSymbols: readonly string[];
}) {
  const [interval, setInterval] = useState<string>("240");
  const src = useMemo(() => widgetSrc(symbol, interval), [symbol, interval]);
  const openChartHref = useMemo(() => fullChartHref(symbol, interval), [symbol, interval]);

  return (
    <article className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-[#111111]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">TradingView chart</h3>
        <a
          href={openChartHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
        >
          Open full chart
        </a>
      </div>
      <div
        className="flex flex-wrap gap-1 border-b border-white/10 bg-[#0d0d0d] px-2 py-2"
        role="group"
        aria-label="Chart timeframe"
      >
        {TIMEFRAMES.map((tf) => {
          const active = interval === tf.value;
          return (
            <button
              key={tf.value}
              type="button"
              onClick={() => setInterval(tf.value)}
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] ${
                active
                  ? "border-[#00ff9f]/50 bg-[#00ff9f]/10 text-[#00ff9f]"
                  : "border-white/12 bg-[#111111] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
              }`}
              aria-pressed={active}
            >
              {tf.label}
            </button>
          );
        })}
      </div>
      <div className="aspect-[18/8] w-full bg-[#0a0a0a]">
        <iframe
          key={src}
          src={src}
          title={`${coinName} TradingView chart`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2">
        {alternateSymbols.slice(0, 3).map((instrument) => (
          <a
            key={instrument}
            href={fullChartHref(instrument, interval)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-zinc-300 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
          >
            {instrument}
          </a>
        ))}
      </div>
    </article>
  );
}
