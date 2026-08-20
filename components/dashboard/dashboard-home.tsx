"use client";

import type { DashboardSnapshot } from "@/lib/dashboard-data";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import type { LowCapRow } from "@/lib/dashboard-data";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { HomeLaunchPulse } from "@/components/home-launch-pulse";
import { DexPairPriceTable } from "@/components/dex-pair-price-table";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { RecentlyViewedStrip } from "@/components/recently-viewed-strip";
import { BecauseYouViewed } from "@/components/because-you-viewed";
import { DexPulseChips } from "@/components/dex-pulse-chips";
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { NarrativeRotationSection } from "@/components/dashboard/narrative-rotation-section";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { LOW_CAPS_DEFAULT_QUERY } from "@/lib/dex-list-query";

function liveToRecommendRows(live: DexLivePairRow[]) {
  return live.map((r) => ({
    id: r.id,
    name: r.name,
    symbol: r.symbol,
    chain: r.chain,
    contractAddress: r.address,
    dexId: r.dex,
    dexLabel: r.dexLabel,
    priceUsd: r.priceUsd,
    change24h: r.change24h,
    volume24h: r.volume24h,
    liquidityUsd: r.liquidityUsd,
  }));
}

/**
 * Homepage: Narrative Rotation primary (desktop above the fold);
 * DEX scanner secondary below. Mobile keeps both — narrative first, then scanner.
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
  const recommendRows = useMemo(() => liveToRecommendRows(livePairs), [livePairs]);

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

        {/* ── PRIMARY: Narrative Rotation (above the fold on desktop) ── */}
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
              Jump to DEX Scanner ↓
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

        {/* ── SECONDARY: DEX Scanner ── */}
        <section
          id="dex-scanner"
          aria-labelledby="dex-scanner-heading"
          className="scroll-mt-24 border-t border-white/10 pt-6 sm:pt-8"
        >
          <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="dex-scanner-heading"
                className="text-base font-bold tracking-tight text-zinc-50 sm:text-lg"
              >
                DEX Scanner
              </h2>
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

          <Suspense fallback={null}>
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Filters
              </p>
              <DexPulseChips defaults={LOW_CAPS_DEFAULT_QUERY} />
            </div>
          </Suspense>

          {justLaunchedFailed && justLaunched.length === 0 ? null : (
            <Suspense fallback={null}>
              <div className="mb-3">
                <HomeLaunchPulse rows={justLaunched} />
              </div>
            </Suspense>
          )}

          <RecentlyViewedStrip className="mb-3" />
          <BecauseYouViewed rows={recommendRows} className="mb-3" limit={5} />

          <DexPairPriceTable rows={livePairs} error={livePairsError} title="Live pairs" />

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
        </section>
      </div>
    </div>
  );
}
