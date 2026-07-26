import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { MarketsDataShell } from "@/components/markets-data-shell";
import { HomeMarketsFallback } from "@/components/home-markets-fallback";
import { HomeNewsFeed } from "@/components/home-news-feed";

const TITLE = "AltCoin Depot – Market Regime, Live Crypto Prices & Compare";
const DESCRIPTION =
  "Live crypto market dashboard: Market Regime, Market Brief, prices, gainers & losers, and side-by-side coin compare. Free real-time data on AltCoin Depot.";

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

export default function Home() {
  return (
    <>
      <SiteHeader />
      <div className="flex w-full flex-col gap-10 px-0 pb-14 lg:flex-row lg:items-start lg:gap-10 lg:pb-16">
        {/* Market data first on mobile; news sits below so it doesn’t bury prices. */}
        <aside className="order-2 w-full shrink-0 px-4 pt-4 lg:sticky lg:top-[4.75rem] lg:order-1 lg:w-80 lg:self-start lg:px-0 lg:pl-6 lg:pt-0">
          <HomeNewsFeed />
        </aside>
        <div className="order-1 min-w-0 flex-1 lg:order-2">
          <main id="main-content">
            <Suspense fallback={<HomeMarketsFallback />}>
              <MarketsDataShell />
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}
