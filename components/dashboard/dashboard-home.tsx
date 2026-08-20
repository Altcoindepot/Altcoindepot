import type { DashboardSnapshot } from "@/lib/dashboard-data";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import type { LowCapRow } from "@/lib/dashboard-data";
import Link from "next/link";
import { Suspense } from "react";
import { HomeLaunchPulse } from "@/components/home-launch-pulse";
import { DexPairPriceTable } from "@/components/dex-pair-price-table";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { RecentlyViewedStrip } from "@/components/recently-viewed-strip";
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { NarrativeRotationSection } from "@/components/dashboard/narrative-rotation-section";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { DisclaimerNote } from "@/components/disclaimer-note";

/**
 * Scanner-first homepage (mockup hierarchy):
 * sticky filters (header) → compact Launch Pulse → recently viewed → dense price rows.
 * Macro widgets are desktop-secondary only.
 */
export function DashboardHome({
  snapshot,
  justLaunched,
  lowCaps,
  livePairs,
  livePairsError,
  watchlistOnly = false,
  justLaunchedFailed = false,
}: {
  snapshot: DashboardSnapshot;
  justLaunched: JustLaunchedRow[];
  lowCaps: LowCapRow[];
  livePairs: DexLivePairRow[];
  livePairsError?: string | null;
  watchlistOnly?: boolean;
  justLaunchedFailed?: boolean;
}) {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-[90rem] px-3 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4">
        <header className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-base font-bold tracking-tight text-zinc-50 sm:text-lg">
              DEX Scanner
            </h1>
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 sm:text-xs">
              Live DexScreener pairs · high risk · not financial advice
            </p>
          </div>
          <div className="flex gap-3 text-[11px]">
            <Link href="/just-launched" className="font-medium text-zinc-500 hover:text-teal-200">
              Just Launched
            </Link>
            <Link href="/new-low-caps" className="font-medium text-zinc-500 hover:text-teal-200">
              Low Caps
            </Link>
          </div>
        </header>

        {watchlistOnly ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-400/25 bg-teal-500/10 px-3 py-2">
            <p className="text-xs text-teal-100">Watchlist filter on</p>
            <Link href="/" className="text-[11px] font-semibold text-teal-200 underline-offset-2 hover:underline">
              Clear
            </Link>
          </div>
        ) : null}

        {justLaunchedFailed && justLaunched.length === 0 ? (
          <p className="mb-3 rounded-lg border border-white/10 bg-[#0c0e14] px-3 py-3 text-xs text-zinc-500">
            Just-launched pulse unavailable.{" "}
            <Link href="/just-launched" className="text-teal-300 underline-offset-2 hover:underline">
              Open Just Launched →
            </Link>
          </p>
        ) : (
          <Suspense fallback={null}>
            <div className="mb-3">
              <HomeLaunchPulse rows={justLaunched} />
            </div>
          </Suspense>
        )}

        <RecentlyViewedStrip className="mb-3" />

        <DexPairPriceTable
          rows={livePairs}
          error={livePairsError}
          title="Live pairs"
        />

        {/* Secondary dense list on desktop; mobile relies on live pairs table above */}
        <div className="mt-4 hidden md:block">
          <Suspense fallback={<div className="h-40 rounded-xl border border-white/10 bg-[#0c0e14]" />}>
            <NewLowCapsTable
              rows={lowCaps}
              watchlistOnly={watchlistOnly}
              showViewAll
              showListChrome={false}
              heading="New & Low Caps"
            />
          </Suspense>
        </div>

        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 md:hidden">
          <Link href="/just-launched" className="text-teal-300/90 underline-offset-2 hover:underline">
            Just Launched →
          </Link>
          <Link href="/new-low-caps" className="text-teal-300/90 underline-offset-2 hover:underline">
            New &amp; Low Caps →
          </Link>
        </p>

        <DisclaimerNote className="mt-4 text-[11px]">
          Pair stats from DexScreener · informational only · not financial advice
        </DisclaimerNote>

        {/* Macro context — desktop/secondary only; not primary mobile scanner */}
        <section
          aria-labelledby="market-context-heading"
          className="mt-10 hidden border-t border-white/10 pt-8 lg:block"
        >
          <h2
            id="market-context-heading"
            className="text-xs font-semibold uppercase tracking-widest text-zinc-500"
          >
            Market context
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Regime and narrative rotation — secondary to the DEX scanner above.
          </p>

          <div className="mt-4">
            <StickyRegimeBar
              regimeLabel={snapshot.regimeLabel}
              cycleDay={snapshot.cycleDay}
              cycleProgressPct={snapshot.cycleProgressPct}
            />
          </div>

          <MarketSentimentWidget pulse={snapshot.pulse} className="mt-4" />

          <div className="mt-4">
            <NarrativeRotationSection
              narratives={snapshot.narratives}
              regimeLabel={snapshot.regimeLabel}
              cycleDay={snapshot.cycleDay}
              trendingAssets={snapshot.trendingAssets}
              watchlistOnly={watchlistOnly}
            />
          </div>

          {snapshot.usingMock ? (
            <p className="mt-3 text-xs text-amber-200/80">
              CoinGecko snapshot unavailable — Market context uses fallback metrics.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
