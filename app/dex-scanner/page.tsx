import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DexScannerExplorer } from "@/components/dex-scanner-explorer";
import { DexScannerDisclaimerModal } from "@/components/dex-scanner-disclaimer-modal";
import { DexRiskFootnote } from "@/components/dex-risk-footnote";
import { DexScreenerFetchError } from "@/lib/dexscreener-live-pairs";
import { getDexScannerRows, type DexScannerRow } from "@/lib/dex-scanner-data";

const TITLE =
  "DEX Scanner – Advanced Pair Filters by Chain, Liquidity, Volume, Mcap | AltCoin Depot";
const DESCRIPTION =
  "Advanced DexScreener pair scanner with chain, liquidity, volume, market cap, and search filters. No age gate. High risk — informational only, not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/dex-scanner" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/dex-scanner",
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

async function loadRows(): Promise<{ rows: DexScannerRow[]; error: string | null }> {
  try {
    const rows = await getDexScannerRows();
    return { rows, error: null };
  } catch (err) {
    const message =
      err instanceof DexScreenerFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[dex-scanner] fetch failed:", message);
    return { rows: [], error: message };
  }
}

export default async function DexScannerPage() {
  const { rows, error } = await loadRows();

  return (
    <>
      <SiteHeader />
      <DexScannerDisclaimerModal />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[90rem]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            DEX Scanner
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl md:text-3xl">
            DEX Scanner
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Advanced filters · all chains · no age gate · high risk · browse any mapped pair
          </p>

          <DexRiskFootnote className="mt-4" />

          <div className="mt-5">
            <Suspense fallback={<div className="h-48 rounded-xl border border-white/10 bg-[#0c0e14]" />}>
              <DexScannerExplorer rows={rows} error={error} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
