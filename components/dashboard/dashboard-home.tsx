"use client";

import type { DashboardSnapshot } from "@/lib/dashboard-data";
import type { ChainMoversBoard } from "@/lib/dex-chain-movers";
import Link from "next/link";
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { NarrativeRotationSection } from "@/components/dashboard/narrative-rotation-section";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { ChainGainersLosers } from "@/components/dashboard/chain-gainers-losers";
import { DisclaimerNote } from "@/components/disclaimer-note";

/**
 * Homepage IA: Narrative Rotation primary, then per-chain gainers/losers.
 * Just Launched / New & Low Caps live only on their dedicated pages.
 */
export function DashboardHome({
  snapshot,
  chainMovers,
  watchlistOnly = false,
}: {
  snapshot: DashboardSnapshot;
  chainMovers: ChainMoversBoard[];
  watchlistOnly?: boolean;
}) {
  return (
    <div className="w-full">
      <StickyRegimeBar
        regimeLabel={snapshot.regimeLabel}
        cycleDay={snapshot.cycleDay}
        cycleProgressPct={snapshot.cycleProgressPct}
      />

      <div className="mx-auto max-w-[90rem] px-3 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
        {watchlistOnly ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-400/25 bg-teal-500/10 px-3 py-2">
            <p className="text-xs text-teal-100">Watchlist filter on</p>
            <Link href="/" className="text-[11px] font-semibold text-teal-200 underline-offset-2 hover:underline">
              Clear
            </Link>
          </div>
        ) : null}

        <section aria-labelledby="narrative-rotation-home-heading" className="mb-8 sm:mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1
                id="narrative-rotation-home-heading"
                className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl md:text-3xl"
              >
                Narrative Rotation
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
                Which narratives are leading, fading, or rotating — before the crowd catches up.
              </p>
            </div>
            <a
              href="#dex-scanner"
              className="shrink-0 text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline sm:text-xs"
            >
              Jump to gainers &amp; losers ↓
            </a>
          </div>

          <MarketSentimentWidget pulse={snapshot.pulse} className="mb-4" />

          <NarrativeRotationSection
            narratives={snapshot.narratives}
            regimeLabel={snapshot.regimeLabel}
            cycleDay={snapshot.cycleDay}
            trendingAssets={snapshot.trendingAssets}
            watchlistOnly={watchlistOnly}
          />

          {snapshot.usingMock ? (
            <p className="mt-3 text-xs text-amber-200/80">
              CoinGecko snapshot unavailable — Narrative Tracker uses fallback metrics.
            </p>
          ) : null}
        </section>

        <ChainGainersLosers boards={chainMovers} />

        <DisclaimerNote className="mt-6 text-[11px]">
          Pair stats from DexScreener · informational only · not financial advice
        </DisclaimerNote>
      </div>
    </div>
  );
}
