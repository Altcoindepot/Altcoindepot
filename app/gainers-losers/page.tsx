import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GainersPageView } from "@/components/dashboard/gainers-page-view";
import { DisclaimerNote } from "@/components/disclaimer-note";
import {
  getChainMovers,
  peekChainMoversFetchedAt,
  type ChainMoversBoard,
} from "@/lib/dex-chain-movers";
import { normalizeDexChainId, sameDexChain } from "@/lib/dex-token-path";
import { formatChainLabel } from "@/lib/format-chain";

const TITLE = "Top Crypto Gainers & Losers by Chain | AltCoin Depot";
const DESCRIPTION =
  "Top DexScreener gainers and losers on Ethereum, Solana, Base, and Injective — Dex first, CEX pad. Informational only, not financial advice.";

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

export default async function GainersLosersPage({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const params = await searchParams;
  const chainFilter = normalizeDexChainId(params.chain ?? "") ?? "";
  const allBoards = await getChainMovers();
  const boards: ChainMoversBoard[] = chainFilter
    ? allBoards.filter((b) => sameDexChain(b.chainId, chainFilter) || b.chainId === chainFilter)
    : allBoards;
  const fetchedAt = peekChainMoversFetchedAt();

  return (
    <>
      <SiteHeader fetchedAt={fetchedAt} />
      <main id="main-content" className="page-shell border-b border-white/10 px-3 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4">
        <div className="mx-auto max-w-lg sm:max-w-2xl lg:max-w-3xl">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Gainers
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
            {chainFilter
              ? `${formatChainLabel(chainFilter)} gainers`
              : "Gainers & losers"}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Live Dex movers · ETH · SOL · BASE · INJ · not financial advice
          </p>

          <div className="mt-4 sm:mt-5">
            <GainersPageView boards={boards} chainFilter={chainFilter} />
          </div>

          <DisclaimerNote className="mt-5 text-[11px]">
            Dex prices from DexScreener · CEX pads from Binance USDT / Coinbase · informational only
          </DisclaimerNote>
        </div>
      </main>
    </>
  );
}
