import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { LiveTrendingMovers } from "@/components/live-trending-movers";

export const metadata: Metadata = {
  title: "Crypto Gainers and Losers Today",
  description:
    "Live cryptocurrency gainers and losers among liquid coins ($5M+ volume). Track the biggest 24h movers on AltCoin Depot.",
  robots: { index: true, follow: true },
};

export default function GainersLosersPage() {
  return (
    <>
      <SiteHeader />
      <div className="border-b border-[#f4ddc3]/08 bg-[#0a0a0a] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-[#d7ad82]">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Gainers &amp; Losers
          </p>
          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Crypto gainers and losers
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            See which liquid coins are rising and falling the most over the last 24 hours. Boards
            refresh automatically about every 25 seconds.
          </p>
        </div>
      </div>
      <LiveTrendingMovers variant="page" />
    </>
  );
}
