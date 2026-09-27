import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { NewsPageView, type NewsDexMover } from "@/components/news-page-view";
import { getSiteNewsCached, SITE_NEWS_PAGE_LIMIT } from "@/lib/site-news";
import {
  chainMoverHref,
  getChainMovers,
  pickHomeTopMovers,
} from "@/lib/dex-chain-movers";

export const metadata: Metadata = {
  title: { absolute: "Crypto News – Latest Headlines | AltCoin Depot" },
  description:
    "Newest crypto headlines from CoinDesk, The Block, Decrypt, CryptoSlate, NewsBTC, BeInCrypto, and more — plus Dex movers. Sorted by publish time. Informational only — not financial advice.",
  alternates: { canonical: "/news" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

async function loadDexMoversForNews(limit: number): Promise<NewsDexMover[]> {
  try {
    const boards = await getChainMovers();
    return pickHomeTopMovers(boards, Math.max(limit, 8))
      .filter((r) => r.venue === "dex" && Boolean(r.address))
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        symbol: r.symbol,
        name: r.name,
        chain: r.chain,
        address: r.address,
        changePct: r.changePct,
        window: r.window,
        href: chainMoverHref(r),
        priceUsd: r.priceUsd,
      }));
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const [news, movers] = await Promise.all([
    getSiteNewsCached(SITE_NEWS_PAGE_LIMIT).catch(() => ({
      items: [],
      sourcesSucceeded: [] as string[],
      sourcesLabel: "Headlines from major crypto outlets",
      stale: true,
      cachedAt: null as string | null,
    })),
    loadDexMoversForNews(5),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell border-b border-white/10 px-3 py-6 sm:px-6 sm:py-8">
        <NewsPageView
          items={news.items}
          sourcesLabel={news.sourcesLabel}
          stale={news.stale}
          movers={movers}
        />
      </main>
    </>
  );
}
