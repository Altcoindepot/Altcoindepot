import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { DexPairPriceTable } from "@/components/dex-pair-price-table";
import { JustLaunchedSection } from "@/components/just-launched-section";
import { JustLaunchedDisclaimerModal } from "@/components/just-launched-disclaimer-modal";
import {
  getJustLaunchedPairs,
  peekJustLaunchedFetchedAt,
  type JustLaunchedRow,
} from "@/lib/dexscreener-just-launched";
import {
  DexScreenerFetchError,
  getLiveDexPairs,
  type DexLivePairRow,
} from "@/lib/dexscreener-live-pairs";

const TITLE = "Just Launched Crypto Tokens – New DEX Pairs | AltCoin Depot";
const DESCRIPTION =
  "See just launched crypto tokens and new DEX pairs. Track price, liquidity, volume, age, and contract addresses from live DexScreener data. Extremely high risk — informational only, not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/just-launched" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/just-launched",
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

async function loadLive(): Promise<{ rows: DexLivePairRow[]; error: string | null }> {
  try {
    const rows = await getLiveDexPairs(25);
    return { rows, error: null };
  } catch (err) {
    const message =
      err instanceof DexScreenerFetchError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[just-launched] getLiveDexPairs failed:", message);
    return { rows: [], error: message };
  }
}

export default async function JustLaunchedPage() {
  let rows: JustLaunchedRow[] = [];
  let failed = false;
  const live = await loadLive();

  try {
    rows = await getJustLaunchedPairs();
  } catch (err) {
    console.warn("[just-launched] page fetch failed", err);
    rows = [];
    failed = true;
  }

  const fetchedAt = peekJustLaunchedFetchedAt();

  return (
    <>
      <SiteHeader fetchedAt={fetchedAt} />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[90rem]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Just Launched
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
            Just launched pairs
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Live price, liq, vol, age · high risk · not financial advice
          </p>

          <DexPairPriceTable rows={live.rows} error={live.error} title="Live pairs" />

          {failed && rows.length === 0 && live.rows.length === 0 ? (
            <p className="mt-4 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-4 text-sm text-red-300">
              DexScreener fetch failed: no just-launched pairs returned.
            </p>
          ) : rows.length > 0 ? (
            <Suspense fallback={<div className="mt-4 h-40 rounded-xl border border-white/10 bg-[#0c0e14]" />}>
              <JustLaunchedSection rows={rows} compactPulse />
            </Suspense>
          ) : null}
        </div>
      </main>
      <JustLaunchedDisclaimerModal />
    </>
  );
}
