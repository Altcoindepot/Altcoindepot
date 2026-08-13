import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { MarketsDataShell } from "@/components/markets-data-shell";
import { HomeMarketsFallback } from "@/components/home-markets-fallback";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

const TITLE = "AltCoin Depot – Narrative Rotation Dashboard";
const DESCRIPTION =
  "See what’s actually moving: Market Regime, narrative rotations, Market Pulse, and new & low caps — live crypto dashboard on AltCoin Depot.";

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

/** Dashboard snapshot cached ~hourly (CoinGecko free-tier friendly). */
export const revalidate = 3600;

function relativeUpdated(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "recently";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export default async function Home() {
  const snapshot = await getDashboardSnapshot();

  return (
    <>
      <SiteHeader updatedLabel={relativeUpdated(snapshot.updatedAt)} />
      <main id="main-content" className="relative">
        <Suspense
          fallback={
            <>
              <HomeMarketsFallback />
              <DashboardHome snapshot={snapshot} />
            </>
          }
        >
          <MarketsDataShell between={<DashboardHome snapshot={snapshot} />} />
        </Suspense>
      </main>
    </>
  );
}
