import { unstable_cache } from "next/cache";
import {
  CRYPTO_PODCASTS,
  getPodcastBySlug,
  type CryptoPodcast,
} from "@/lib/crypto-podcasts";
import {
  getLatestYoutubeVideosForChannel,
  PODCAST_MIN_DURATION_SECONDS,
  type YoutubeFeedItem,
} from "@/lib/youtube-feed";

/** Refresh latest episodes about once per day. */
export const PODCASTS_REVALIDATE_SECONDS = 86_400;

export type PodcastWithEpisodes = CryptoPodcast & {
  episodes: YoutubeFeedItem[];
};

async function loadEpisodesForShow(p: CryptoPodcast): Promise<YoutubeFeedItem[]> {
  return getLatestYoutubeVideosForChannel(p.youtubeChannelId, 5, p.youtubeHandle, {
    minDurationSeconds: PODCAST_MIN_DURATION_SECONDS,
    revalidateSeconds: PODCASTS_REVALIDATE_SECONDS,
  });
}

async function loadPodcastsWithEpisodesUncached(): Promise<PodcastWithEpisodes[]> {
  // Always return all eight shows — empty episode lists still render cards.
  return Promise.all(
    CRYPTO_PODCASTS.map(async (p) => ({
      ...p,
      episodes: await loadEpisodesForShow(p).catch(() => [] as YoutubeFeedItem[]),
    })),
  );
}

export const loadPodcastsWithEpisodes = unstable_cache(
  loadPodcastsWithEpisodesUncached,
  ["podcasts-with-episodes-v2"],
  { revalidate: PODCASTS_REVALIDATE_SECONDS, tags: ["podcasts"] },
);

export async function loadPodcastWithEpisodes(slug: string): Promise<PodcastWithEpisodes | null> {
  const resolved = getPodcastBySlug(slug);
  if (!resolved) return null;
  const all = await loadPodcastsWithEpisodes();
  return all.find((p) => p.slug === resolved.slug) ?? { ...resolved, episodes: [] };
}
