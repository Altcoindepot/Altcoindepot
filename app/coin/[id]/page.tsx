import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { lookupCoinById } from "@/lib/coingecko";
import { resolveCoinIdAlias } from "@/lib/coin-id-aliases";
import { resolveProjectTwitterHandle } from "@/lib/ecosystem-projects";
import { getLatestXTweets } from "@/lib/x-feed";
import { getLatestMediumPostsCached, type CachedMediumFeed } from "@/lib/medium-feed";
import { getCoinNewsCached, type CachedCoinNews } from "@/lib/coin-news";
import {
  getYoutubeVideosForCoinCached,
  coinHasYoutubeLinks,
  type CachedYoutubeFeed,
} from "@/lib/youtube-feed";
import { SiteHeader } from "@/components/site-header";
import { CoinDetailView } from "@/components/coin-detail-view";
import { getReppoStatsForDisplay } from "@/lib/reppo-stats-live";
import { buildCoinSeoCopy } from "@/lib/coin-seo";

type Props = { params: Promise<{ id: string }> };

async function resolveCoinParam(rawId: string) {
  const requested = rawId.trim().toLowerCase();
  const id = resolveCoinIdAlias(requested);
  if (id !== requested) {
    permanentRedirect(`/coin/${encodeURIComponent(id)}`);
  }
  return id;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = await resolveCoinParam(rawId);
  const result = await lookupCoinById(id);
  if (result.status === "unavailable") {
    return {
      title: "Price data temporarily unavailable",
      description: "CoinGecko could not be reached. Try again shortly.",
      robots: { index: true, follow: true },
    };
  }
  if (result.status === "not_found") {
    notFound();
  }
  const coin = result.coin;
  const sym = (coin.symbol ?? "").toString().toUpperCase() || "—";
  const name = (coin.name ?? "Coin").toString();
  const { title, description } = buildCoinSeoCopy(name, sym, coin.id);
  return {
    title: { absolute: title },
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: `/coin/${encodeURIComponent(coin.id)}`,
    },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function CoinPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = await resolveCoinParam(rawId);
  const result = await lookupCoinById(id);
  if (result.status === "unavailable") {
    return (
      <>
        <SiteHeader />
        <main className="min-h-[50vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-20 text-center sm:px-6">
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            This coin page is taking a break
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
            We couldn’t reach CoinGecko for this asset. That usually clears in a minute — tap reload
            or browse another coin from Home.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
            <Link
              href={`/coin/${encodeURIComponent(id)}`}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/15 px-5 text-sm font-semibold text-[#d7ad82]"
            >
              Reload coin
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-medium text-zinc-300"
            >
              ← Back home
            </Link>
          </div>
        </main>
      </>
    );
  }
  if (result.status === "not_found") {
    notFound();
  }
  const coin = result.coin;

  // Prefer the CoinGecko canonical id in the URL when it differs (casing / drift).
  if (coin.id !== id) {
    permanentRedirect(`/coin/${encodeURIComponent(coin.id)}`);
  }

  const btcResult =
    coin.id === "bitcoin" ? result : await lookupCoinById("bitcoin");
  const btcMd = btcResult.status === "ok" ? btcResult.coin.market_data : undefined;
  const btcChange7d =
    typeof btcMd?.price_change_percentage_7d === "number"
      ? btcMd.price_change_percentage_7d
      : typeof btcMd?.price_change_percentage_7d_in_currency?.usd === "number"
        ? btcMd.price_change_percentage_7d_in_currency.usd
        : null;
  const btcChange30d =
    typeof btcMd?.price_change_percentage_30d === "number"
      ? btcMd.price_change_percentage_30d
      : null;
  const btcChange24h =
    typeof btcMd?.price_change_percentage_24h === "number"
      ? btcMd.price_change_percentage_24h
      : null;

  const handle = resolveProjectTwitterHandle(coin);
  const twitterHref = handle ? `https://x.com/${handle}` : undefined;

  const tweets = await (async () => {
    try {
      return handle ? await getLatestXTweets(handle, 5) : [];
    } catch {
      return [];
    }
  })();

  const mediumFeed = await (async () => {
    try {
      return await getLatestMediumPostsCached(coin, 5);
    } catch {
      const empty: CachedMediumFeed = {
        posts: [],
        sourceUrl: null,
        stale: true,
        cachedAt: null,
      };
      return empty;
    }
  })();

  const youtubeFeed = await (async () => {
    try {
      return await getYoutubeVideosForCoinCached(coin, 5);
    } catch {
      const empty: CachedYoutubeFeed = {
        videos: [],
        sourceHint: null,
        stale: true,
        cachedAt: null,
      };
      return empty;
    }
  })();

  const showYoutubeSidebar =
    youtubeFeed.videos.length > 0 || youtubeFeed.stale || coinHasYoutubeLinks(coin);

  const newsFeed = await (async () => {
    try {
      return await getCoinNewsCached(coin, 4);
    } catch {
      const empty: CachedCoinNews = {
        items: [],
        sourceUrl: "",
        stale: true,
        cachedAt: null,
      };
      return empty;
    }
  })();

  const reppoStats = coin.id === "reppo" ? await getReppoStatsForDisplay() : undefined;

  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh] border-t border-white/5 bg-[#0a0a0a]">
        <CoinDetailView
          coin={coin}
          twitterHref={twitterHref}
          tweets={tweets}
          mediumPosts={mediumFeed.posts}
          mediumSourceUrl={mediumFeed.sourceUrl ?? undefined}
          mediumStale={mediumFeed.stale}
          newsItems={newsFeed.items}
          newsSourceUrl={newsFeed.sourceUrl}
          newsStale={newsFeed.stale}
          youtubeVideos={youtubeFeed.videos}
          youtubeStale={youtubeFeed.stale}
          youtubeSourceHint={youtubeFeed.sourceHint}
          showYoutubeSidebar={showYoutubeSidebar}
          reppoStats={reppoStats}
          btcChange24h={btcChange24h}
          btcChange7d={btcChange7d}
          btcChange30d={btcChange30d}
        />
      </main>
    </>
  );
}
