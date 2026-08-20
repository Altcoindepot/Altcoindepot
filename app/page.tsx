import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard-snapshot";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";

const TITLE = "AltCoin Depot – Narrative Rotation & DEX Movers";
const DESCRIPTION =
  "Track narrative rotation and open Top Gainers & Losers by chain. Just Launched and New & Low Caps live on dedicated scanner pages. Informational only — not financial advice.";

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ watchlist?: string }>;
}) {
  const params = await searchParams;
  const watchlistOnly = params.watchlist === "1" || params.watchlist === "true";
  const snapshot = await fetchDashboardData();
  const fetchedAt = Date.parse(snapshot.updatedAt);

  return (
    <>
      <SiteHeader fetchedAt={Number.isFinite(fetchedAt) ? fetchedAt : Date.now()} />
      <main id="main-content" className="relative">
        <DashboardHome snapshot={snapshot} watchlistOnly={watchlistOnly} />
      </main>
    </>
  );
}
