import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { MarketsDataShell } from "@/components/markets-data-shell";
import { HomeMarketsFallback } from "@/components/home-markets-fallback";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard-data";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";

const TITLE = "AltCoin Depot – Narrative Rotation Dashboard";
const DESCRIPTION =
  "See what’s actually moving, before the rest of the market does: Market Regime, narrative rotations, Market Pulse, and new & low caps — live crypto dashboard on AltCoin Depot.";

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
 * Dynamic so `?watchlist=` works and Vercel Hobby does not spend ISR writes
 * prerendering live CoinGecko payloads (that quota already failed last night's deploys).
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
 * Server-only CoinGecko dashboard fetch (never runs in the browser).
 * On 429 / offline / empty payloads, falls back to a typed mock snapshot
 * so Narrative Tracker + New & Low Caps keep rendering.
 */
async function fetchDashboardData(): Promise<DashboardSnapshot> {
  try {
    // Cached server-side via unstable_cache + fetch revalidate: 3600 in lib/dashboard-data.
    return await getDashboardSnapshot();
  } catch (error) {
    console.error("[page] Dashboard CoinGecko fetch failed; using mock data.", error);
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
        <Suspense
          fallback={
            <>
              <HomeMarketsFallback />
              <DashboardHome snapshot={snapshot} watchlistOnly={watchlistOnly} />
            </>
          }
        >
          <MarketsDataShell
            between={<DashboardHome snapshot={snapshot} watchlistOnly={watchlistOnly} />}
          />
        </Suspense>
      </main>
    </>
  );
}
