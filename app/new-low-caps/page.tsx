import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DexPairPriceTable } from "@/components/dex-pair-price-table";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { LowCapsDisclaimerModal } from "@/components/low-caps-disclaimer-modal";
import { peekDexLowCapsFetchedAt } from "@/lib/dexscreener-low-caps";
import {
  DexScreenerFetchError,
  getLiveDexPairs,
  type DexLivePairRow,
} from "@/lib/dexscreener-live-pairs";
import { livePairsToLowCapRows } from "@/lib/live-pairs-to-low-cap";
import type { LowCapRow } from "@/lib/dashboard-data";

const TITLE = "New & Low Cap Crypto Tokens – Live DEX Pairs | AltCoin Depot";
const DESCRIPTION =
  "Track new and low-cap crypto tokens from live DEX pairs. See price, liquidity, 24h change, volume, and contract addresses. Data from DexScreener. Informational only — not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/new-low-caps" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/new-low-caps",
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

function liveToLowCapRows(live: DexLivePairRow[]): LowCapRow[] {
  return livePairsToLowCapRows(live);
}

async function loadLive(): Promise<{ rows: DexLivePairRow[]; error: string | null }> {
  try {
    const rows = await getLiveDexPairs(50);
    return { rows, error: null };
  } catch (err) {
    const message =
      err instanceof DexScreenerFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[new-low-caps] getLiveDexPairs failed:", message);
    return { rows: [], error: message };
  }
}

export default async function NewLowCapsPage() {
  const live = await loadLive();
  const rows = liveToLowCapRows(live.rows);
  const fetchedAt = peekDexLowCapsFetchedAt();

  return (
    <>
      <SiteHeader fetchedAt={fetchedAt} />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[90rem]">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            New &amp; Low Caps
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            New &amp; low cap crypto tokens
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Live DEX pairs with price, liquidity, 24h change, volume, and pair age from DexScreener.
            Informational only — not financial advice.
          </p>

          <DexPairPriceTable rows={live.rows} error={live.error} title="Live DEX pairs (prices)" />

          {!live.error && rows.length > 0 ? (
            <Suspense fallback={<div className="mt-6 h-48 rounded-2xl border border-white/10 bg-[#0c0e14]" />}>
              <NewLowCapsTable rows={rows} showViewAll={false} className="mt-6" />
            </Suspense>
          ) : null}
        </div>
      </main>
      <LowCapsDisclaimerModal />
    </>
  );
}
