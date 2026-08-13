import type { ReactNode } from "react";
import { getMarketsBundle } from "@/lib/coingecko";
import { MarketsProvider } from "@/components/markets-provider";
import { PriceMarquee } from "@/components/price-marquee";
import { MarketSentimentStrip } from "@/components/market-sentiment-strip";
import { HomeInsightPanels } from "@/components/home-insight-panels";
import { MarketsDashboard } from "@/components/markets-dashboard";
import { RecentlyViewedSection } from "@/components/recently-viewed-section";
import { HomeTrendingSection } from "@/components/home-trending-section";
import { LiveTrendingMovers } from "@/components/live-trending-movers";
import { MarketsUnavailable } from "@/components/markets-unavailable";
import { SectionHeading } from "@/components/section-heading";

/**
 * Homepage markets stack. Optional `between` (dashboard edits) renders after Market Regime
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
      {/* Quiet, crawlable framing for Market Regime / Compare (live widgets hydrate below). */}
      <p className="mx-auto max-w-6xl px-4 pb-2 pt-4 text-xs leading-relaxed text-zinc-600 sm:px-6">
        Market Regime and Market Brief summarize risk tone from sentiment and breadth. Use{" "}
        <a href="/compare" className="text-zinc-500 underline-offset-2 hover:text-[#d7ad82] hover:underline">
          Compare
        </a>{" "}
        for side-by-side prices, and coin pages for Compared to BTC.
      </p>
      <MarketSentimentStrip />

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
