import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

/**
 * Real HTTP 404 responses: Next.js injects noindex automatically.
 * Do not set index/follow here — that caused Soft 404 conflicts in Search Console.
 */
export const metadata: Metadata = {
  title: "Asset syncing",
  description: "This asset profile is currently syncing on AltCoin Depot.",
};

export default function CoinNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[50vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-20 text-center sm:px-6">
        <h1 className="text-metallic-hero text-xl font-semibold sm:text-2xl">
          Asset Data Profile Currently Syncing.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          We couldn&apos;t load a complete profile for this asset right now. Market data may still
          be updating — check back shortly or browse from the homepage.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/15 px-6 text-sm font-semibold text-[#d7ad82] transition-[box-shadow,transform] hover:shadow-[0_0_24px_rgba(185,129,82,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.98]"
        >
          Return Home
        </Link>
      </main>
    </>
  );
}
