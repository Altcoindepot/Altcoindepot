import { getMarketsBundle } from "@/lib/coingecko";
import { MarketsProvider } from "@/components/markets-provider";
import { PriceMarquee } from "@/components/price-marquee";
import { MarketSentimentStrip } from "@/components/market-sentiment-strip";
import { HomeInsightPanels } from "@/components/home-insight-panels";
import { MarketsDashboard } from "@/components/markets-dashboard";
import { LiveTrendingMovers } from "@/components/live-trending-movers";
import { MarketsUnavailable } from "@/components/markets-unavailable";

export async function MarketsDataShell() {
  let bundle;
  try {
    bundle = await getMarketsBundle();
  } catch {
    return <MarketsUnavailable />;
  }

  return (
    <MarketsProvider initialBundle={bundle}>
      <PriceMarquee />
      <MarketSentimentStrip />
      <MarketsDashboard />
      <LiveTrendingMovers />
      <HomeInsightPanels />
    </MarketsProvider>
  );
}
