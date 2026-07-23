"use client";

import { LiveTopCoins } from "@/components/live-top-coins";
import { useMarkets } from "@/components/markets-provider";

export function MarketsDashboard() {
  const { topMarkets, ecosystemMarkets, stale, refreshError, refreshing, refresh } = useMarkets();
  const featuredSource = [
    ...topMarkets,
    ...ecosystemMarkets.filter((coin) => !topMarkets.some((top) => top.id === coin.id)),
  ];

  return (
    <>
      <section
        aria-labelledby="featured-heading"
        className="border-b border-[#f4ddc3]/15 bg-[#0f131b]/65 px-4 py-10 sm:px-6"
      >
        <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-4 sm:p-6">
          <h2
            id="featured-heading"
            className="text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl"
          >
            <span className="text-brand-altcoindepot">Featured</span>
          </h2>
          {stale || refreshError ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-3 flex flex-col gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-amber-100">
                {refreshError ??
                  "Data may be delayed due to CoinGecko rate limits. You’re seeing the last good snapshot."}
              </p>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={refreshing}
                className="min-h-11 shrink-0 rounded-lg border border-amber-300/40 bg-amber-400/15 px-4 text-sm font-semibold text-amber-50 disabled:opacity-60 sm:min-h-9 sm:text-xs"
              >
                {refreshing ? "Refreshing…" : "Try again"}
              </button>
            </div>
          ) : null}
          <p className="mt-2 text-sm text-zinc-400">
            Bitcoin, Ethereum, Solana, XRP, and Injective · Tap a card for full coin info · USD
            · Refreshes every ~60s
          </p>
          <div className="mt-8">
            <LiveTopCoins coins={featuredSource} />
          </div>
        </div>
      </section>
    </>
  );
}
