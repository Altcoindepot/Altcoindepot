import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard-snapshot";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import { getDexScreenerLowCaps, peekDexLowCapsFetchedAt } from "@/lib/dexscreener-low-caps";
import {
  getJustLaunchedPairs,
  peekJustLaunchedFetchedAt,
  type JustLaunchedRow,
} from "@/lib/dexscreener-just-launched";
import type { LowCapRow } from "@/lib/dashboard-data";

const TITLE = "AltCoin Depot – DEX Scanner | Just Launched & Low Caps";
const DESCRIPTION =
  "Live DexScreener scanner: just-launched pairs, new & low-cap tokens, filters, DEX venues, and on-site token pages. Informational only — not financial advice.";

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

async function loadJustLaunched(): Promise<{ rows: JustLaunchedRow[]; failed: boolean }> {
  try {
    const rows = await getJustLaunchedPairs();
    console.info("[page] Just Launched DexScreener", { count: rows.length, live: rows.length > 0 });
    return { rows, failed: false };
  } catch (err) {
    console.warn("[page] Just Launched DexScreener failed", err);
    return { rows: [], failed: true };
  }
}

async function loadLowCaps(): Promise<LowCapRow[]> {
  try {
    const rows = await getDexScreenerLowCaps();
    if (rows.length > 0) {
      console.info("[page] New & Low Caps DexScreener", { count: rows.length, live: true });
      return rows;
    }
  } catch (err) {
    console.warn("[page] New & Low Caps DexScreener failed; using mock rows", err);
  }
  console.info("[page] New & Low Caps using mock fallback");
  return getMockDashboardSnapshot().lowCaps;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ watchlist?: string }>;
}) {
  const params = await searchParams;
  const watchlistOnly = params.watchlist === "1" || params.watchlist === "true";

  const [snapshot, launched, lowCaps] = await Promise.all([
    fetchDashboardData(),
    loadJustLaunched(),
    loadLowCaps(),
  ]);

  const fetchedAt =
    peekJustLaunchedFetchedAt() ??
    peekDexLowCapsFetchedAt() ??
    Date.parse(snapshot.updatedAt);

  return (
    <>
      <SiteHeader fetchedAt={Number.isFinite(fetchedAt) ? fetchedAt : Date.now()} />
      <main id="main-content" className="relative">
        <DashboardHome
          snapshot={snapshot}
          justLaunched={launched.rows}
          lowCaps={lowCaps}
          watchlistOnly={watchlistOnly}
          justLaunchedFailed={launched.failed}
        />
      </main>
    </>
  );
}
