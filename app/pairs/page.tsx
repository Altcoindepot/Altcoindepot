import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { PairsExplorer } from "@/components/pairs-explorer";
import { DisclaimerNote } from "@/components/disclaimer-note";
import {
  DexScreenerFetchError,
  getCachedDexExplorerPairs,
  type DexLivePairRow,
} from "@/lib/dexscreener-live-pairs";

const TITLE = "DEX Trading Pairs – Filter by Chain | AltCoin Depot";
const DESCRIPTION =
  "Explore live DexScreener trading pairs with price, 24h change, volume, liquidity, and chain filters for Solana, Ethereum, Base, BSC, and more. Informational only — not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/pairs" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/pairs",
    siteName: "AltCoin Depot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const dynamic = "force-dynamic";

async function loadPairs(): Promise<{ rows: DexLivePairRow[]; error: string | null }> {
  try {
    const rows = await getCachedDexExplorerPairs();
    return { rows, error: null };
  } catch (err) {
    const message =
      err instanceof DexScreenerFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[pairs] explorer fetch failed:", message);
    return { rows: [], error: message };
  }
}

export default async function PairsPage() {
  const { rows, error } = await loadPairs();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[90rem]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Pairs
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl md:text-3xl">
            DEX trading pairs
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Broader DexScreener explorer · filter by chain · sort by volume, liquidity, % or age · min
            $10k liquidity floor · not financial advice
          </p>

          <div className="mt-5">
            <Suspense fallback={<div className="h-40 rounded-xl border border-white/10 bg-[#0c0e14]" />}>
              <PairsExplorer rows={rows} error={error} />
            </Suspense>
          </div>

          <DisclaimerNote className="mt-4 text-[11px]">
            Pair stats from DexScreener · informational only · not financial advice
          </DisclaimerNote>
        </div>
      </main>
    </>
  );
}
