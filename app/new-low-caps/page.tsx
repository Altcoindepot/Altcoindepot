import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { LowCapsDisclaimerModal } from "@/components/low-caps-disclaimer-modal";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import { getDexScreenerLowCaps, peekDexLowCapsFetchedAt } from "@/lib/dexscreener-low-caps";
import type { LowCapRow } from "@/lib/dashboard-data";

const TITLE = "New & Low Cap Crypto Tokens – Live DEX Pairs | AltCoin Depot";
const DESCRIPTION =
  "Track new and low-cap crypto tokens from live DEX pairs. See liquidity, volume, 24h change, chain, and contract addresses. Data updated from DexScreener. Informational only — not financial advice.";

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

async function loadRows(): Promise<LowCapRow[]> {
  try {
    const rows = await getDexScreenerLowCaps();
    if (rows.length > 0) return rows;
  } catch (err) {
    console.warn("[new-low-caps] DexScreener failed; using mock rows", err);
  }
  return getMockDashboardSnapshot().lowCaps;
}

export default async function NewLowCapsPage() {
  const rows = await loadRows();
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
            Recently active DEX pairs with liquidity, 24h change, volume, and pair age. Data is
            cached about every 10 minutes from DexScreener. Informational only — not financial
            advice.
          </p>
          <p className="mt-3">
            <Link
              href="/just-launched"
              className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-teal-200 hover:underline"
            >
              Just launched pairs →
            </Link>
          </p>
          <Suspense fallback={<div className="mt-6 h-48 rounded-2xl border border-white/10 bg-[#0c0e14]" />}>
            <NewLowCapsTable rows={rows} showViewAll={false} className="mt-6" />
          </Suspense>
        </div>
      </main>
      <LowCapsDisclaimerModal />
    </>
  );
}
