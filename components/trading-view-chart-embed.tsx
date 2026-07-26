"use client";

import { useEffect, useMemo, useState } from "react";

const TIMEFRAMES = [
  { label: "15m", value: "15" },
  { label: "1h", value: "60" },
  { label: "4h", value: "240" },
  { label: "1D", value: "D" },
  { label: "1W", value: "W" },
  { label: "1M", value: "M" },
] as const;

function widgetSrc(symbol: string, interval: string) {
  const params = new URLSearchParams({
    symbol,
    interval,
    theme: "dark",
    // 1 = candlesticks
    style: "1",
    locale: "en",
    toolbarbg: "0a0a0a",
    enable_publishing: "0",
    hide_top_toolbar: "0",
    hide_legend: "0",
    saveimage: "0",
    withdateranges: "1",
    allow_symbol_change: "1",
    calendar: "0",
    studies: "",
  });
  return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
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
  /** Other exchange mappings; first few become in-widget symbol switches. */
  alternateSymbols: readonly string[];
}) {
  const instruments = useMemo(() => {
    const list = [symbol, ...alternateSymbols].filter(Boolean);
    return [...new Set(list)];
  }, [symbol, alternateSymbols]);

  const [activeSymbol, setActiveSymbol] = useState(symbol);
  const [interval, setInterval] = useState<string>("D");

  useEffect(() => {
    setActiveSymbol(symbol);
  }, [symbol]);

  const src = useMemo(
    () => widgetSrc(activeSymbol, interval),
    [activeSymbol, interval],
  );
  const openChartHref = useMemo(
    () => fullChartHref(activeSymbol, interval),
    [activeSymbol, interval],
  );

  return (
    <article className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 sm:text-sm">
            {coinName} candlestick chart
          </h3>
          <p className="text-xs text-zinc-500 sm:text-[10px]">
            TradingView · scroll and zoom for full history · {activeSymbol}
          </p>
        </div>
        <a
          href={openChartHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center text-sm font-medium text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-0 sm:text-xs"
        >
          Open full chart
        </a>
      </div>

      <div
        className="flex flex-wrap gap-2 border-b border-white/10 bg-[#0d0d0d] px-2 py-2.5 sm:gap-1 sm:px-3"
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
              className={`min-h-11 min-w-[3rem] flex-1 rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-9 sm:flex-none sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
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

      {instruments.length > 1 ? (
        <div
          className="flex flex-wrap gap-1.5 border-b border-white/10 px-2 py-2 sm:px-3"
          role="group"
          aria-label="Exchange symbol"
        >
          {instruments.slice(0, 6).map((instrument) => {
            const active = activeSymbol === instrument;
            return (
              <button
                key={instrument}
                type="button"
                onClick={() => setActiveSymbol(instrument)}
                className={`rounded-md border px-2 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:py-1 ${
                  active
                    ? "border-[#d1a173]/55 bg-[#d1a173]/15 text-[#f4ebe0]"
                    : "border-white/15 text-zinc-400 hover:border-[#d1a173]/40 hover:text-[#d7ad82]"
                }`}
                aria-pressed={active}
              >
                {instrument}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="h-[320px] w-full bg-[#0a0a0a] sm:h-[420px] lg:h-[480px]">
        <iframe
          key={src}
          src={src}
          title={`${coinName} TradingView candlestick chart`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen"
        />
      </div>
    </article>
  );
}
