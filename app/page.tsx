import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard-snapshot";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";

const TITLE = "AltCoin Depot – Narrative Rotation Dashboard";
const DESCRIPTION =
  "See what’s actually moving, before the rest of the market does: Market Regime, narrative rotations, Market Pulse, and live new and low-cap DEX tokens on AltCoin Depot.";

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

/**
 * Dynamic so `?watchlist=` works. CoinGecko payloads are cached for 1 hour in
 * `getDashboardSnapshot` / `coinGeckoFetch` (revalidate: 3600).
 */
export const dynamic = "force-dynamic";

function relativeUpdated(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "recently";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

/**
 * Server-only dashboard fetch (never runs in the browser).
 * Narrative Tracker / Market Pulse use CoinGecko last-good or mocks.
 * New & Low Caps prefer DexScreener; mocks only if that fetch fails too.
 */
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

  return (
    <>
      <SiteHeader updatedLabel={relativeUpdated(snapshot.updatedAt)} />
      <main id="main-content" className="relative">
        <DashboardHome snapshot={snapshot} watchlistOnly={watchlistOnly} />
      </main>
    </>
  );
}
