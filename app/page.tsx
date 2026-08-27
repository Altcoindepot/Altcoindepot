import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard-snapshot";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import { getSiteNewsCached, type SiteNewsResult } from "@/lib/site-news";
import {
  getChainMovers,
  pickHomeTopMovers,
  type ChainMoverRow,
} from "@/lib/dex-chain-movers";

const TITLE = "Narrative rotation + live Dex movers | AltCoin Depot";
const DESCRIPTION =
  "Narrative rotation and live Dex movers. Open Top Gainers & Losers by chain; Just Launched and New & Low Caps on dedicated scanners. Informational only — not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
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

async function fetchDashboardData(): Promise<DashboardSnapshot> {
  try {
    return await getDashboardSnapshot();
  } catch (error) {
    console.error("[page] Dashboard fetch failed; using mock data.", error);
    return getMockDashboardSnapshot();
  }
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
async function fetchHomeMoversSoft(): Promise<ChainMoverRow[]> {
  try {
    const boards = await Promise.race([
      getChainMovers(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 4_000);
      }),
    ]);
    if (!boards) return [];
    return pickHomeTopMovers(boards, 5);
  } catch (error) {
    console.error("[page] Home movers fetch failed.", error);
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ watchlist?: string }>;
}) {
  const params = await searchParams;
  const watchlistOnly = params.watchlist === "1" || params.watchlist === "true";
  const [snapshot, homeNews, topMovers] = await Promise.all([
    fetchDashboardData(),
    fetchHomeNewsSoft(12),
    fetchHomeMoversSoft(),
  ]);
  const fetchedAt = Date.parse(snapshot.updatedAt);

  return (
    <>
      <SiteHeader fetchedAt={Number.isFinite(fetchedAt) ? fetchedAt : Date.now()} />
      <main id="main-content" className="relative">
        <DashboardHome
          snapshot={snapshot}
          watchlistOnly={watchlistOnly}
          initialNewsItems={homeNews.items}
          initialNewsStale={homeNews.stale}
          initialNewsSourcesLabel={homeNews.sourcesLabel}
          topMovers={topMovers}
        />
      </main>
    </>
  );
}
