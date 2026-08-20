import { Suspense } from "react";
import { SiteHeaderClient } from "@/components/site-header-client";

/** Server wrapper so pages that render the header satisfy the useSearchParams Suspense rule. */
export function SiteHeader({ fetchedAt }: { fetchedAt?: number | null }) {
  return (
    <Suspense fallback={<div className="h-12 border-b border-white/10 bg-[#0a0a0a]" />}>
      <SiteHeaderClient fetchedAt={fetchedAt} />
    </Suspense>
  );
}
