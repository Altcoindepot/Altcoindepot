import { Suspense } from "react";
import { SiteHeaderClient } from "@/components/site-header-client";
import { PriceMarquee } from "@/components/price-marquee";

/** Server wrapper so pages that render the header satisfy the useSearchParams Suspense rule. */
export function SiteHeader({ fetchedAt }: { fetchedAt?: number | null }) {
  return (
    <>
      <Suspense fallback={<div className="site-header-shell"><div className="site-header-capsule min-h-12" /></div>}>
        <SiteHeaderClient fetchedAt={fetchedAt} />
      </Suspense>
      <PriceMarquee />
    </>
  );
}
