import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard-snapshot";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import {
  getChainMovers,
  peekChainMoversFetchedAt,
  type ChainMoversBoard,
} from "@/lib/dex-chain-movers";

const TITLE = "AltCoin Depot – Narrative Rotation & DEX Movers";
const DESCRIPTION =
  "Track narrative rotation and top DexScreener gainers and losers by chain. Just Launched and New & Low Caps live on dedicated scanner pages. Informational only — not financial advice.";

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

async function fetchDashboardData(): Promise<DashboardSnapshot> {
  try {
    return await getDashboardSnapshot();
  } catch (error) {
    console.error("[page] Dashboard fetch failed; using mock data.", error);
    return getMockDashboardSnapshot();
  }
}

async function loadMovers(): Promise<ChainMoversBoard[]> {
  try {
    return await getChainMovers();
  } catch (err) {
    console.warn("[page] chain movers failed", err);
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

  const [snapshot, chainMovers] = await Promise.all([fetchDashboardData(), loadMovers()]);

  const fetchedAt = peekChainMoversFetchedAt() ?? Date.parse(snapshot.updatedAt);

  return (
    <>
      <SiteHeader fetchedAt={Number.isFinite(fetchedAt) ? fetchedAt : Date.now()} />
      <main id="main-content" className="relative">
        <DashboardHome
          snapshot={snapshot}
          chainMovers={chainMovers}
          watchlistOnly={watchlistOnly}
        />
      </main>
    </>
  );
}
