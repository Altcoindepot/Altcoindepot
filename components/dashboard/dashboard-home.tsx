"use client";

import type { DashboardSnapshot } from "@/lib/dashboard-data";
import type { ChainMoverRow } from "@/lib/dex-chain-movers";
import type { SiteNewsItem } from "@/lib/site-news";
import Link from "next/link";
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { NarrativeRotationSection } from "@/components/dashboard/narrative-rotation-section";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { HomeQuickLinks, HomeTopMovers } from "@/components/dashboard/home-top-movers";
import { HomeNewsFeed } from "@/components/home-news-feed";
import { DisclaimerNote } from "@/components/disclaimer-note";

/**
 * Homepage fold: thin regime → tappable movers → compact macros → narratives → news.
 * No Dex list filter chrome; no full scanner tables.
 */
export function DashboardHome({
  snapshot,
  watchlistOnly = false,
  initialNewsItems,
  initialNewsStale,
  initialNewsSourcesLabel,
  topMovers = [],
}: {
  snapshot: DashboardSnapshot;
  watchlistOnly?: boolean;
  initialNewsItems?: SiteNewsItem[];
  initialNewsStale?: boolean;
  initialNewsSourcesLabel?: string;
  topMovers?: ChainMoverRow[];
}) {
  return (
    <div className="w-full">
      <StickyRegimeBar
        regimeLabel={snapshot.regimeLabel}
        cycleDay={snapshot.cycleDay}
        cycleProgressPct={snapshot.cycleProgressPct}
      />

      <div className="mx-auto max-w-[90rem] space-y-5 px-3 pb-8 pt-3 sm:space-y-7 sm:px-6 sm:pb-10 sm:pt-5">
        {watchlistOnly ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-full border border-teal-400/25 bg-teal-500/10 px-4 py-2">
            <p className="text-xs text-teal-100">Watchlist filter on</p>
            <Link
              href="/"
              className="text-[11px] font-semibold text-teal-200 underline-offset-2 hover:underline"
            >
              Clear
            </Link>
          </div>
        ) : null}

        {/* 1) Top movers — first tappable content on mobile */}
        <HomeTopMovers rows={topMovers} />

        <HomeQuickLinks />

        {/* 2) Compact macros on mobile; full cards from md up */}
        <MarketSentimentWidget pulse={snapshot.pulse} variant="strip" className="md:hidden" />
        <MarketSentimentWidget
          pulse={snapshot.pulse}
          variant="cards"
          className="hidden md:block"
        />

        {/* 3) Narrative Rotation */}
        <section aria-labelledby="narrative-rotation-home-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
            <div>
              <h1
                id="narrative-rotation-home-heading"
                className="text-lg font-bold tracking-tight text-zinc-50 sm:text-2xl md:text-3xl"
              >
                Narrative Rotation
              </h1>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-zinc-500 sm:text-sm">
                Leading vs fading narratives — before the crowd catches up.
              </p>
            </div>
            <Link
              href="/gainers-losers"
              className="hidden shrink-0 text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline sm:inline sm:text-xs"
            >
              Top movers →
            </Link>
          </div>

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

        {/* 4) In the News */}
        <HomeNewsFeed
          initialItems={initialNewsItems}
          initialStale={initialNewsStale}
          initialSourcesLabel={initialNewsSourcesLabel}
          maxItems={10}
          maxItemsMobile={3}
        />

        <DisclaimerNote className="text-[11px]">
          Pair stats from DexScreener · informational only · not financial advice
        </DisclaimerNote>
      </div>
    </div>
  );
}
