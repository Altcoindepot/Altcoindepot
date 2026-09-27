import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { NewsPageView, type NewsDexMover } from "@/components/news-page-view";
import { getSiteNewsCached, SITE_NEWS_PAGE_LIMIT } from "@/lib/site-news";
import {
  chainMoverHref,
  getChainMovers,
  pickHomeTopMovers,
} from "@/lib/dex-chain-movers";
import { getDexScreenerLowCaps } from "@/lib/dexscreener-low-caps";
import type { NewsTickerCandidate } from "@/lib/news-tickers";

export const metadata: Metadata = {
  title: { absolute: "Crypto News – Latest Headlines | AltCoin Depot" },
  description:
    "Newest crypto headlines from CoinDesk, The Block, Decrypt, CryptoSlate, NewsBTC, BeInCrypto, and more — plus Dex movers. Sorted by publish time. Informational only — not financial advice.",
  alternates: { canonical: "/news" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

/** High-volume floor for low-cap chip candidates (24h USD). */
const LOW_CAP_CHIP_MIN_VOLUME = 50_000;

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

async function loadListedTickersForChips(
  movers: NewsDexMover[],
): Promise<NewsTickerCandidate[]> {
  const out: NewsTickerCandidate[] = [];
  const seen = new Set<string>();

  const push = (symbol: string, chain: string | undefined, address: string | undefined) => {
    const sym = symbol.trim().toUpperCase();
    const c = chain?.trim();
    const a = address?.trim();
    if (!sym || !c || !a) return;
    if (seen.has(sym)) return;
    seen.add(sym);
    out.push({ symbol: sym, chain: c, address: a });
  };

  for (const m of movers) {
    push(m.symbol, m.chain, m.address);
  }

  try {
    const lowCaps = await getDexScreenerLowCaps();
    const highVol = lowCaps
      .filter((r) => (r.volume ?? 0) >= LOW_CAP_CHIP_MIN_VOLUME && r.contractAddress && r.chain)
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
      .slice(0, 40);
    for (const r of highVol) {
      push(r.symbol, r.chain, r.contractAddress);
    }
  } catch {
    // Movers-only chips still work.
  }

  return out;
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
    // Fat list feeds chips; Moving on Dex / pulse still slice top 3–5 in the view.
    loadDexMoversForNews(40),
  ]);
  const listedTickers = await loadListedTickersForChips(movers);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell border-b border-white/10 px-3 py-6 sm:px-6 sm:py-8">
        <NewsPageView
          items={news.items}
          sourcesLabel={news.sourcesLabel}
          stale={news.stale}
          movers={movers}
          listedTickers={listedTickers}
        />
      </main>
    </>
  );
}
