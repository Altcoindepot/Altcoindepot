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
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { MarketSentimentWidget } from "@/components/dashboard/market-sentiment-widget";
import { HomeSearchStrip, HomeTopMovers } from "@/components/dashboard/home-top-movers";
import { DexHeatRotation } from "@/components/dashboard/dex-heat-rotation";
import { HomeNewsFeed } from "@/components/home-news-feed";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { normalizeDexChainId } from "@/lib/dex-token-path";
import { formatChainLabel } from "@/lib/format-chain";

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
      return pickHomeTopMovers(boards, 5, chain || null);
    }
    if (!chain) return fallbackRows;
    return fallbackRows.filter((r) => {
      const c = normalizeDexChainId(r.chain);
      return c === chain;
    });
  }, [boards, fallbackRows, chain]);

  return (
    <div>
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
 * Phone-first: regime → movers → Dex heat chips → search → macros → news.
 * `?chain=` from heat chips filters movers + heat coin list to that chain only.
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
  return (
    <div className="w-full">
      <StickyRegimeBar
        regimeLabel={snapshot.regimeLabel}
        cycleDay={snapshot.cycleDay}
        cycleProgressPct={snapshot.cycleProgressPct}
      />

      <div className="home-fold mx-auto max-w-[90rem] px-3 pb-6 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
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

        <Suspense fallback={<HomeTopMovers rows={topMovers} />}>
          <HomeMoversFiltered boards={moverBoards} fallbackRows={topMovers} />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-40 rounded-2xl border border-white/10 bg-[#0c0e14] animate-pulse" />
          }
        >
          <DexHeatRotation snapshot={dexHeat} />
        </Suspense>

        <div className="lg:hidden">
          <HomeSearchStrip />
        </div>

        <MarketSentimentWidget pulse={snapshot.pulse} variant="strip" />

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
