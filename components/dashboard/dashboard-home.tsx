"use client";

import type { DashboardSnapshot } from "@/lib/dashboard-data";
import {
  pickHomeTopMovers,
  type ChainMoversBoard,
  type ChainMoverRow,
} from "@/lib/dex-chain-movers";
import type { DexHeatSnapshot } from "@/lib/dex-narrative-heat";
import type { SiteNewsItem } from "@/lib/site-news";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { HomeTopMovers } from "@/components/dashboard/home-top-movers";
import { DexHeatRotation } from "@/components/dashboard/dex-heat-rotation";
import { HomeNewsFeed } from "@/components/home-news-feed";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { normalizeDexChainId } from "@/lib/dex-token-path";
import { formatChainLabel } from "@/lib/format-chain";

const HOME_MOVERS_LIMIT = 8;

function HomeMoversFiltered({
  boards,
  fallbackRows,
}: {
  boards: ChainMoversBoard[];
  fallbackRows: ChainMoverRow[];
}) {
  const searchParams = useSearchParams();
  const chain = normalizeDexChainId(searchParams.get("chain") ?? "") ?? "";
  const rows = useMemo(() => {
    if (boards.length > 0) {
      return pickHomeTopMovers(boards, HOME_MOVERS_LIMIT, chain || null);
    }
    if (!chain) return fallbackRows.slice(0, HOME_MOVERS_LIMIT);
    return fallbackRows
      .filter((r) => {
        const c = normalizeDexChainId(r.chain);
        return c === chain;
      })
      .slice(0, HOME_MOVERS_LIMIT);
  }, [boards, fallbackRows, chain]);

  return (
    <div className="lg:sticky lg:top-[4.5rem]">
      {chain ? (
        <p className="mb-1.5 text-[11px] font-medium text-teal-300/90">
          Top movers · {formatChainLabel(chain)} only
        </p>
      ) : null}
      <HomeTopMovers rows={rows} />
    </div>
  );
}

/**
 * Home composition matching the product mock (existing theme tokens only):
 * All breakpoints: What’s rotating 2×2 | Top movers, Market News strip below
 * (Mobile uses the same side-by-side fold with smaller tiles — avoid stacking.)
 */
export function DashboardHome({
  snapshot,
  watchlistOnly = false,
  initialNewsItems,
  initialNewsStale,
  initialNewsSourcesLabel,
  topMovers = [],
  moverBoards = [],
  dexHeat,
}: {
  snapshot: DashboardSnapshot;
  watchlistOnly?: boolean;
  initialNewsItems?: SiteNewsItem[];
  initialNewsStale?: boolean;
  initialNewsSourcesLabel?: string;
  topMovers?: ChainMoverRow[];
  moverBoards?: ChainMoversBoard[];
  dexHeat: DexHeatSnapshot;
}) {
  const movers = (
    <Suspense fallback={<HomeTopMovers rows={topMovers.slice(0, HOME_MOVERS_LIMIT)} />}>
      <HomeMoversFiltered boards={moverBoards} fallbackRows={topMovers} />
    </Suspense>
  );

  const heat = (
    <Suspense
      fallback={
        <div className="h-40 rounded-2xl border border-white/10 bg-[#0c0e14] animate-pulse sm:h-56" />
      }
    >
      <DexHeatRotation
        snapshot={dexHeat}
        chipGridClassName="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4"
      />
    </Suspense>
  );

  const news = (
    <HomeNewsFeed
      initialItems={initialNewsItems}
      initialStale={initialNewsStale}
      initialSourcesLabel={initialNewsSourcesLabel}
      maxItems={4}
      maxItemsMobile={4}
    />
  );

  return (
    <div className="w-full">
      <div className="home-fold mx-auto max-w-[90rem] space-y-3 px-2.5 pb-5 pt-2.5 sm:space-y-5 sm:px-6 sm:pb-10 sm:pt-4">
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

        {/* Same fold as desktop: heat 2×2 | movers, news full-width */}
        <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(7.75rem,0.85fr)] items-start gap-2 sm:gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,0.85fr)] lg:gap-6">
          <div className="min-w-0">{heat}</div>
          <div className="min-w-0">{movers}</div>
          <div className="col-span-2 min-w-0">{news}</div>
        </div>

        <MarketSentimentWidget pulse={snapshot.pulse} variant="strip" />

        <DisclaimerNote className="text-[11px]">
          Pair stats from DexScreener · informational only · not financial advice
        </DisclaimerNote>
      </div>
    </div>
  );
}
