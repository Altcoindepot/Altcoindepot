import type { ReactNode } from "react";
import { getMarketsBundle } from "@/lib/coingecko";
import { MarketsProvider } from "@/components/markets-provider";
import { PriceMarquee } from "@/components/price-marquee";
import { HomeInsightPanels } from "@/components/home-insight-panels";
import { MarketsDashboard } from "@/components/markets-dashboard";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";
import { HomeTrendingSection } from "@/components/home-trending-section";
import { LiveTrendingMovers } from "@/components/live-trending-movers";
import { MarketsUnavailable } from "@/components/markets-unavailable";
import { SectionHeading } from "@/components/section-heading";

/**
 * Homepage markets stack. Optional `between` (dashboard) renders after the marquee
 * and before the classic live-markets sections.
 */
export async function MarketsDataShell({ between }: { between?: ReactNode } = {}) {
  let bundle;
  try {
    bundle = await getMarketsBundle();
  } catch {
    return (
      <>
        {between}
        <MarketsUnavailable />
      </>
    );
  }

  return (
    <MarketsProvider initialBundle={bundle}>
      <PriceMarquee />

      {between}

      <section
        aria-labelledby="classic-markets-heading"
        className="border-t border-[#f4ddc3]/10 bg-[#090a0d]/80"
      >
        <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6">
          <SectionHeading id="classic-markets-heading">Live markets</SectionHeading>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Featured coins, trending, gainers &amp; losers, and catalysts — same data stack as
            before, refreshed on the hourly cadence.
          </p>
        </div>
        <MarketsDashboard />
        <HomeTrendingSection />
        <RecentlyViewedSection />
        <LiveTrendingMovers />
        <HomeInsightPanels />
      </section>
    </MarketsProvider>
  );
}
