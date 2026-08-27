import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ChainGainersLosers } from "@/components/dashboard/chain-gainers-losers";
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

export default async function GainersLosersPage({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const params = await searchParams;
  const chainFilter = normalizeDexChainId(params.chain ?? "") ?? "";
  const allBoards = await getChainMovers();
  const boards: ChainMoversBoard[] = chainFilter
    ? allBoards.filter((b) => sameDexChain(b.chainId, chainFilter))
    : allBoards;
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
            {chainFilter
              ? `${formatChainLabel(chainFilter)} gainers & losers`
              : "Top gainers & losers by chain"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            {chainFilter ? (
              <>
                Showing <span className="text-zinc-300">{formatChainLabel(chainFilter)}</span> only ·{" "}
                <Link href="/gainers-losers" className="text-teal-300 underline-offset-2 hover:underline">
                  All chains
                </Link>
                {" · "}
              </>
            ) : null}
            Per-chain DexScreener pairs · each board uses <span className="text-zinc-300">1H</span>{" "}
            when most pairs have it, otherwise <span className="text-zinc-300">24H</span> · min $10k
            liquidity · natives/stables excluded · not financial advice
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
            {chainFilter ? (
              <Link
                href={`/pairs?chain=${encodeURIComponent(chainFilter)}`}
                className="text-teal-300/90 underline-offset-2 hover:underline"
              >
                All {formatChainLabel(chainFilter)} pairs →
              </Link>
            ) : null}
          </p>

          <DisclaimerNote className="mt-4 text-[11px]">
            Pair stats from DexScreener · informational only · not financial advice
          </DisclaimerNote>
        </div>
      </main>
    </>
  );
}
