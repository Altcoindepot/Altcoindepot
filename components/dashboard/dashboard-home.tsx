import type { DashboardSnapshot } from "@/lib/dashboard-data";
import Link from "next/link";
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { NarrativeRotationSection } from "@/components/dashboard/narrative-rotation-section";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { DisclaimerNote } from "@/components/disclaimer-note";

export function DashboardHome({
  snapshot,
  watchlistOnly = false,
}: {
  snapshot: DashboardSnapshot;
  watchlistOnly?: boolean;
}) {
  return (
    <div className="w-full">
      <StickyRegimeBar
        regimeLabel={snapshot.regimeLabel}
        cycleDay={snapshot.cycleDay}
        cycleProgressPct={snapshot.cycleProgressPct}
      />

      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8">
        <DashboardHero
          regimeLabel={snapshot.regimeLabel}
          summary={snapshot.regimeSummary}
        />

        <MarketSentimentWidget pulse={snapshot.pulse} className="mb-4" />

        {watchlistOnly ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-400/25 bg-teal-500/10 px-4 py-3">
            <p className="text-sm text-teal-100">
              Watchlist filter on — dashboard tables show only assets you starred on this device.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="text-xs font-semibold text-teal-200 underline-offset-2 hover:underline"
              >
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

        <NarrativeRotationSection
          narratives={snapshot.narratives}
          regimeLabel={snapshot.regimeLabel}
          cycleDay={snapshot.cycleDay}
          trendingAssets={snapshot.trendingAssets}
          watchlistOnly={watchlistOnly}
          lowCapsSlot={
            <NewLowCapsTable rows={snapshot.lowCaps} watchlistOnly={watchlistOnly} />
          }
        />

        <DisclaimerNote className="mt-6">
          Narrative baskets are CoinGecko category averages · switch 24H / 7D / 1M on the tracker ·
          informational only · not financial advice · refreshed about hourly
        </DisclaimerNote>
        {snapshot.usingMock ? (
          <p className="mt-2 text-xs text-amber-200/80">
            CoinGecko snapshot unavailable — Narrative Tracker and Market Pulse use fallback
            metrics. New & Low Caps load from DexScreener when available.
          </p>
        ) : snapshot.usingStale ? null : snapshot.stale ? (
          <p className="mt-2 text-xs text-amber-200/80">
            Some category feeds were empty — showing best-effort snapshot.
          </p>
        ) : null}
      </div>
    </div>
  );
}
