import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import { getSiteNewsCached, SITE_NEWS_HOME_LIMIT, type SiteNewsResult } from "@/lib/site-news";
import {
  getChainMovers,
  pickHomeTopMovers,
  type ChainMoverRow,
  type ChainMoversBoard,
} from "@/lib/dex-chain-movers";
import { getDexNarrativeHeat, type DexHeatSnapshot } from "@/lib/dex-narrative-heat";

const TITLE = "Narrative rotation + live Dex movers | AltCoin Depot";
const DESCRIPTION =
  "Live Dex heat by chain plus top movers. Open scanners for pairs and low caps. Informational only — not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com",
    siteName: "AltCoin Depot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const dynamic = "force-dynamic";

const EMPTY_NEWS: SiteNewsResult = {
  items: [],
  sourcesSucceeded: [],
  sourcesLabel: "Headlines from major crypto outlets",
  stale: true,
  cachedAt: null,
};

/**
 * Homepage must make **0 CoinGecko HTTP calls**.
 * Regime/macros use static mock shell only — live data is Dex movers + heat + RSS.
 */
function homeShellSnapshot() {
  return getMockDashboardSnapshot();
}

/** Never let a slow/failed news merge delay the homepage past this budget. */
async function fetchHomeNewsSoft(limit: number): Promise<SiteNewsResult> {
  try {
    return await Promise.race([
      getSiteNewsCached(limit),
      new Promise<SiteNewsResult>((resolve) => {
        setTimeout(() => resolve({ ...EMPTY_NEWS, stale: true }), 5_000);
      }),
    ]);
  } catch (error) {
    console.error("[page] Home news fetch failed.", error);
    return EMPTY_NEWS;
  }
}

/** Reuses cached Dex chain-movers; soft-timeout so home never stalls. */
async function fetchHomeMoversSoft(): Promise<{
  rows: ChainMoverRow[];
  boards: ChainMoversBoard[];
}> {
  try {
    const boards = await Promise.race([
      getChainMovers(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 4_000);
      }),
    ]);
    if (!boards) return { rows: [], boards: [] };
    return { rows: pickHomeTopMovers(boards, 8), boards };
  } catch (error) {
    console.error("[page] Home movers fetch failed.", error);
    return { rows: [], boards: [] };
  }
}

async function fetchDexHeatSoft(): Promise<DexHeatSnapshot> {
  const empty: DexHeatSnapshot = {
    buckets: [
      {
        id: "solana",
        label: "Solana",
        kind: "chain",
        filterChain: "solana",
        href: "/pairs?chain=solana",
        heatPct: 0,
        window: "24h",
        status: "NEUTRAL",
        sampleSize: 0,
        children: [],
      },
      {
        id: "base",
        label: "Base",
        kind: "chain",
        filterChain: "base",
        href: "/pairs?chain=base",
        heatPct: 0,
        window: "24h",
        status: "NEUTRAL",
        sampleSize: 0,
        children: [],
      },
      {
        id: "ethereum",
        label: "Ethereum",
        kind: "chain",
        filterChain: "ethereum",
        href: "/pairs?chain=ethereum",
        heatPct: 0,
        window: "24h",
        status: "NEUTRAL",
        sampleSize: 0,
        children: [],
      },
      {
        id: "injective",
        label: "INJ",
        kind: "token",
        filterChain: "injective",
        href: "/pairs?chain=injective",
        heatPct: 0,
        window: "24h",
        status: "NEUTRAL",
        sampleSize: 0,
        children: [],
      },
    ],
    windowLabel: "24H",
    updatedAt: Date.now(),
  };
  try {
    const heat = await Promise.race([
      getDexNarrativeHeat(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 4_500);
      }),
    ]);
    return heat ?? empty;
  } catch (error) {
    console.error("[page] Dex heat fetch failed.", error);
    return empty;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ watchlist?: string }>;
}) {
  const params = await searchParams;
  const watchlistOnly = params.watchlist === "1" || params.watchlist === "true";
  // No getDashboardSnapshot — that path fans out CoinGecko.
  const [homeNews, movers, dexHeat] = await Promise.all([
    fetchHomeNewsSoft(SITE_NEWS_HOME_LIMIT),
    fetchHomeMoversSoft(),
    fetchDexHeatSoft(),
  ]);
  const snapshot = homeShellSnapshot();
  const fetchedAt = Date.now();

  return (
    <>
      <SiteHeader fetchedAt={fetchedAt} />
      <main id="main-content" className="relative">
        <DashboardHome
          snapshot={snapshot}
          watchlistOnly={watchlistOnly}
          initialNewsItems={homeNews.items}
          initialNewsStale={homeNews.stale}
          initialNewsSourcesLabel={homeNews.sourcesLabel}
          topMovers={movers.rows}
          moverBoards={movers.boards}
          dexHeat={dexHeat}
        />
      </main>
    </>
  );
}
