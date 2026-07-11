import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CoinSearchBar } from "@/components/coin-search-bar";
import { CoinSearchResultsList } from "@/components/coin-search-results-list";
import { SiteHeader } from "@/components/site-header";
import {
  getTopCoinsSearchIndex,
  pickBestTopCoinMatch,
  searchTopCoinsIndex,
  TOP_COINS_SEARCH_LIMIT,
} from "@/lib/top-coins-index";

export const metadata: Metadata = {
  title: "Find a coin",
  description: "Search the top 3,000 cryptocurrencies by market cap on Altcoin Depot.",
};

export default async function CoinSearchRedirectPage({
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
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-xl font-semibold text-white">Search</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Search the top {TOP_COINS_SEARCH_LIMIT.toLocaleString()} coins by name or ticker. Each
            result opens a full stats page with price, ATH/ATL, charts, and feeds.
          </p>
          <div className="mx-auto mt-8 max-w-md text-left">
            <CoinSearchBar variant="wide" inputId="coin-page-search" />
          </div>
          <Link
            href="/"
            className="mt-8 inline-block text-sm text-[#00ff9f] underline-offset-2 hover:underline"
          >
            ← Back home
          </Link>
        </main>
      </>
    );
  }

  let index;
  try {
    index = await getTopCoinsSearchIndex();
  } catch {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <h1 className="text-xl font-semibold text-white">Search unavailable</h1>
          <p className="mt-2 text-sm text-zinc-400">
            The coin index could not be loaded. Try again shortly.
          </p>
          <Link href="/" className="mt-8 inline-block text-sm text-[#00ff9f] hover:underline">
            ← Back home
          </Link>
        </main>
      </>
    );
  }

  const best = pickBestTopCoinMatch(index, query);
  if (best) {
    redirect(`/coin/${best.id}`);
  }

  const hits = searchTopCoinsIndex(index, query, 20);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className="text-xl font-semibold text-white">Search results</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Top {index.length.toLocaleString()} coins by market cap · query{" "}
          <span className="font-mono text-zinc-200">{query}</span>
        </p>
        <CoinSearchResultsList query={query} coins={hits} totalIndexed={index.length} />
        <Link href="/" className="mt-8 inline-block text-sm text-[#00ff9f] hover:underline">
          ← Back home
        </Link>
      </main>
    </>
  );
}
