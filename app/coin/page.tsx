import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CoinSearchBar } from "@/components/coin-search-bar";
import { SiteHeader } from "@/components/site-header";
import { ChainIcon } from "@/components/chain-icon";
import { TokenAvatar } from "@/components/token-avatar";
import { searchDexPairs, truncateContract, type DexSearchHit } from "@/lib/dex-search";
import { formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatChainLabel } from "@/lib/format-chain";
import { DexRiskFootnote } from "@/components/dex-risk-footnote";

export const metadata: Metadata = {
  title: "Search DEX tokens",
  description:
    "Search any DexScreener-listed token by ticker or contract. Live prices from Dex — verify the contract. Informational only, not financial advice.",
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
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Search DEX tokens</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Paste a ticker or contract address. Live price from DexScreener — always verify the
            contract before any decision.
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

  let hits: DexSearchHit[] = [];
  let failed = false;
  try {
    hits = await searchDexPairs(query, 12);
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
            DexScreener search failed. Try again shortly.
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
          <ul className="mt-6 divide-y divide-white/5 overflow-hidden rounded-xl border border-teal-400/20 bg-white/[0.03]">
            {hits.map((hit) => (
              <li key={hit.id}>
                <Link
                  href={hit.href}
                  className="flex min-h-12 items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.04] sm:px-4"
                >
                  <TokenAvatar symbol={hit.symbol} imageUrl={hit.imageUrl} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-50">
                        {hit.symbol}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-zinc-500">
                        <ChainIcon chainId={hit.chain} size={14} />
                        {formatChainLabel(hit.chain)}
                      </span>
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">{hit.name}</span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-zinc-600">
                      {truncateContract(hit.address)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-zinc-100">
                    {formatDexPriceUsd(hit.priceUsd)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <DexRiskFootnote className="mt-6" />
      </main>
    </>
  );
}
