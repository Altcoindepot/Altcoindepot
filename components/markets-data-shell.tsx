import { getMarketsBundle } from "@/lib/coingecko";
import { MarketsProvider } from "@/components/markets-provider";
import { PriceMarquee } from "@/components/price-marquee";
import { MarketSentimentStrip } from "@/components/market-sentiment-strip";
import { HomeInsightPanels } from "@/components/home-insight-panels";
import { MarketsDashboard } from "@/components/markets-dashboard";

export async function MarketsDataShell() {
  let bundle;
  try {
    bundle = await getMarketsBundle();
  } catch {
    return (
      <section
        role="alert"
        aria-live="polite"
        className="border-b border-red-500/20 bg-[#0a0a0a] px-4 py-16 text-center sm:px-6"
      >
        <div className="mx-auto max-w-lg rounded-xl border border-red-500/30 bg-[#111111] p-8">
          <h2 className="text-lg font-semibold text-white">Market data unavailable</h2>
          <p className="mt-2 text-sm text-zinc-400">
            We couldn&apos;t load prices from CoinGecko. Please try again in a moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <MarketsProvider initialBundle={bundle}>
      <PriceMarquee />
      <MarketSentimentStrip />
      <MarketsDashboard />
      <HomeInsightPanels />
    </MarketsProvider>
  );
}
