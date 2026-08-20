import type { DashboardSnapshot } from "@/lib/dashboard-data";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import type { LowCapRow } from "@/lib/dashboard-data";
import Link from "next/link";
import { Suspense } from "react";
import { JustLaunchedSection } from "@/components/just-launched-section";
import { DexPairPriceTable } from "@/components/dex-pair-price-table";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { NarrativeRotationSection } from "@/components/dashboard/narrative-rotation-section";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { DisclaimerNote } from "@/components/disclaimer-note";

/**
 * Scanner-first homepage: Launch Pulse / filters / recents / Just Launched /
 * New & Low Caps lead. Macro narrative widgets sit below (secondary).
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
      <div className="mx-auto max-w-[90rem] px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-5">
        <header className="mb-3">
          <h1 className="text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">
            DEX Scanner
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Live DexScreener pairs — price, liquidity, volume, age, and venue. Extremely high risk.
            Informational only, not financial advice.
          </p>
        </header>

        {watchlistOnly ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-400/25 bg-teal-500/10 px-4 py-3">
            <p className="text-sm text-teal-100">
              Watchlist filter on — New &amp; Low Caps shows only assets you starred on this device.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="text-xs font-semibold text-teal-200 underline-offset-2 hover:underline">
                Clear filter
              </Link>
              <Link
                href="/watchlist"
                className="text-xs font-semibold text-teal-200 underline-offset-2 hover:underline"
              >
                Full watchlist page →
              </Link>
            </div>
          </div>
        ) : null}

        {justLaunchedFailed && justLaunched.length === 0 ? (
          <p className="mb-4 rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-6 text-sm text-zinc-500">
            Couldn&apos;t load just-launched pairs right now.{" "}
            <Link href="/just-launched" className="text-teal-300 underline-offset-2 hover:underline">
              Try Just Launched →
            </Link>
          </p>
        ) : (
          <Suspense fallback={<div className="mt-4 h-56 rounded-2xl border border-white/10 bg-[#0c0e14]" />}>
            <JustLaunchedSection rows={justLaunched} />
          </Suspense>
        )}

        <DexPairPriceTable
          rows={livePairs}
          error={livePairsError}
          title="Live DEX pairs (prices)"
        />

        <Suspense fallback={<div className="mt-6 h-48 rounded-2xl border border-white/10 bg-[#0c0e14]" />}>
          <NewLowCapsTable
            rows={lowCaps}
            watchlistOnly={watchlistOnly}
            className="mt-6"
            showViewAll
            showListChrome={false}
            heading="New & Low Caps"
          />
        </Suspense>

        <p className="mt-3 text-xs text-zinc-600">
          <Link href="/new-low-caps" className="text-teal-300/90 underline-offset-2 hover:underline">
            Open full New &amp; Low Caps scanner →
          </Link>
        </p>

        <DisclaimerNote className="mt-6">
          Pair stats from DexScreener · filters are shareable via URL · informational only · not
          financial advice
        </DisclaimerNote>

        {/* Macro context — secondary, below scanner lists */}
        <section
          aria-labelledby="market-context-heading"
          className="mt-10 border-t border-white/10 pt-8"
        >
          <h2
            id="market-context-heading"
            className="text-xs font-semibold uppercase tracking-widest text-zinc-500"
          >
            Market context
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Regime and narrative rotation (CoinGecko categories) — secondary to the DEX lists above.
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
              CoinGecko snapshot unavailable — Market context uses fallback metrics. DEX lists load
              from DexScreener when available.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
