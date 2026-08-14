import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { getMockDashboardSnapshot } from "@/lib/dashboard-mock";
import { getDexScreenerLowCaps } from "@/lib/dexscreener-low-caps";
import type { LowCapRow } from "@/lib/dashboard-data";

const TITLE = "New & Low Cap Crypto Tokens | AltCoin Depot";
const DESCRIPTION =
  "Live new and low-cap crypto tokens from DexScreener: recently active pairs with market cap, liquidity, 24h change, volume, pair age, and contract addresses.";

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

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[90rem]">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            New &amp; Low Caps
          </p>
          <h1 className="text-brand-altcoindepot mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            New &amp; low cap crypto tokens
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Recently active DEX pairs with liquidity, 24h change, volume, and pair age. Data is
            cached about every 10 minutes from DexScreener. Informational only — not financial
            advice.
          </p>
          <NewLowCapsTable rows={rows} showViewAll={false} className="mt-6" />
        </div>
      </main>
    </>
  );
}
