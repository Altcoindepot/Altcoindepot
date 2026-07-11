import { MarqueeSkeleton } from "@/components/marquee-skeleton";
import { MarketsSectionSkeleton } from "@/components/markets-section-skeleton";

/** Full-page markets loading: ticker + grid + table placeholders */
export function HomeMarketsFallback() {
  return (
    <>
      <MarqueeSkeleton />
      <MarketsSectionSkeleton />
    </>
  );
}
