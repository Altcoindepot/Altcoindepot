import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ChainGainersLosers } from "@/components/dashboard/chain-gainers-losers";
import { DisclaimerNote } from "@/components/disclaimer-note";
import {
  getChainMovers,
  peekChainMoversFetchedAt,
} from "@/lib/dex-chain-movers";

const TITLE = "Top Crypto Gainers & Losers by Chain | AltCoin Depot";
const DESCRIPTION =
  "Top 5 DexScreener gainers and losers on Solana, Ethereum, Base, and BSC. Prefers 1h change when available. Live DEX pairs with price and % — informational only, not financial advice.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/gainers-losers" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/gainers-losers",
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

export default async function GainersLosersPage() {
  const boards = await getChainMovers();
  const fetchedAt = peekChainMoversFetchedAt();

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
            Gainers &amp; Losers
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl md:text-3xl">
            Top gainers &amp; losers by chain
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            DexScreener pairs · prefers <span className="text-zinc-300">1h</span> change when
            available (otherwise labeled <span className="text-zinc-300">24h</span>) · min $10k
            liquidity · not financial advice
          </p>

          <div className="mt-5">
            <ChainGainersLosers boards={boards} />
          </div>

          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600">
            <Link href="/just-launched" className="text-teal-300/90 underline-offset-2 hover:underline">
              Just Launched →
            </Link>
            <Link href="/new-low-caps" className="text-teal-300/90 underline-offset-2 hover:underline">
              New &amp; Low Caps →
            </Link>
          </p>

          <DisclaimerNote className="mt-4 text-[11px]">
            Pair stats from DexScreener · informational only · not financial advice
          </DisclaimerNote>
        </div>
      </main>
    </>
  );
}
