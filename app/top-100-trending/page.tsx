import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { TokensPageView } from "@/components/tokens-page-view";
import { DisclaimerNote } from "@/components/disclaimer-note";
import {
  DexScreenerFetchError,
  getCachedDexExplorerPairs,
  type DexLivePairRow,
} from "@/lib/dexscreener-live-pairs";

const TITLE = "Tokens & Live Dex Pairs | AltCoin Depot";
const DESCRIPTION =
  "Browse live DexScreener pairs with price, 24h change, volume, and liquidity. Recently viewed and related picks stay on-page. Informational only — not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/top-100-trending" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/top-100-trending",
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
    console.error("[top-100-trending] explorer fetch failed:", message);
    return { rows: [], error: message };
  }
}

/** Tokens nav destination — Dex pairs board (no CoinGecko /coins/markets). */
export default async function TokensPage() {
  const { rows, error } = await loadPairs();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell border-b border-white/10 px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[90rem]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Tokens
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl md:text-3xl">
            Tokens
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Live Dex pairs · recently viewed · related picks · not financial advice
          </p>

          <div className="mt-5">
            <Suspense fallback={<div className="h-48 rounded-2xl glass-panel animate-pulse" />}>
              <TokensPageView rows={rows} error={error} />
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
