import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CoinSearchBar } from "@/components/coin-search-bar";
import { SiteHeader } from "@/components/site-header";
import { MarketRow } from "@/components/market-row";
import { searchUniverse, type UniverseSearchHit } from "@/lib/universe-search";
import { DexRiskFootnote } from "@/components/dex-risk-footnote";

export const metadata: Metadata = {
  title: "Search coins & DEX tokens",
  description:
    "Search ~7,000 coins by ticker or contract. Live prices from DexScreener — verify the contract. Informational only, not financial advice.",
};

export const dynamic = "force-dynamic";

export default async function CoinSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
            Search ticker or contract
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Covers the cached ~7,000-coin universe plus any DexScreener contract. Live price from Dex
            — always verify the contract.
          </p>
          <div className="mx-auto mt-8 max-w-md text-left">
            <CoinSearchBar variant="wide" inputId="coin-page-search" />
          </div>
          <p className="mt-4 text-[11px] text-zinc-500">
            Or browse the{" "}
            <Link href="/dex-scanner" className="text-teal-300 underline-offset-2 hover:underline">
              DEX Scanner
            </Link>
            .
          </p>
          <DexRiskFootnote className="mt-8 text-left" />
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-teal-300 underline-offset-2 hover:underline"
          >
            ← Back home
          </Link>
        </main>
      </>
    );
  }

  let hits: UniverseSearchHit[] = [];
  let failed = false;
  try {
    hits = await searchUniverse(query, 12);
  } catch {
    hits = [];
    failed = true;
  }

  if (hits.length === 1) {
    redirect(hits[0]!.href);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Search results</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Query: <span className="font-mono text-zinc-200">{query}</span>
        </p>
        <div className="mt-6">
          <CoinSearchBar variant="wide" inputId="coin-page-search-results" />
        </div>

        {failed ? (
          <p className="mt-6 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Search failed. Try again shortly.
          </p>
        ) : hits.length === 0 ? (
          <p className="mt-6 rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-6 text-sm text-zinc-500">
            No pair found — check the contract. You can also open the{" "}
            <Link href="/dex-scanner" className="text-teal-300 underline-offset-2 hover:underline">
              DEX Scanner
            </Link>
            .
          </p>
        ) : (
          <ul className="ds-list-shell mt-6 divide-y divide-white/[0.06]">
            {hits.map((hit) => {
              const major =
                hit.rankTier === "major_usdt" || hit.rankTier === "major_other";
              return (
                <li key={`${hit.kind}:${hit.id}`}>
                  <MarketRow
                    href={hit.href}
                    symbol={hit.symbol}
                    name={hit.name}
                    imageUrl={hit.imageUrl}
                    chain={hit.chain}
                    contract={hit.address}
                    priceUsd={hit.priceUsd}
                    isMajor={major}
                    pairLabel={hit.pairLabel}
                    muted={!major && Boolean(hits[0] && (hits[0].rankTier === "major_usdt" || hits[0].rankTier === "major_other"))}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <DexRiskFootnote className="mt-6" />
      </main>
    </>
  );
}
