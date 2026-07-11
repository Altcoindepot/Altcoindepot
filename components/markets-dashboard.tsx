"use client";

import { LiveTopCoins } from "@/components/live-top-coins";
import { useMarkets } from "@/components/markets-provider";

export function MarketsDashboard() {
  const { topMarkets, ecosystemMarkets, stale } = useMarkets();
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
          {stale ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-2 inline-flex items-center rounded-md border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200"
            >
              Data may be delayed due to CoinGecko rate limits.
            </p>
          ) : null}
          <p className="mt-1 text-sm text-zinc-400">
            Bitcoin, Ethereum, Solana, LIT, and Injective · Tap a card for full coin info · USD
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
