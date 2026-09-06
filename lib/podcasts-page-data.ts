import { unstable_cache } from "next/cache";
import { CRYPTO_PODCASTS, type CryptoPodcast } from "@/lib/crypto-podcasts";
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

async function loadPodcastsWithEpisodesUncached(): Promise<PodcastWithEpisodes[]> {
  return Promise.all(
    CRYPTO_PODCASTS.map(async (p) => ({
      ...p,
      episodes: await getLatestYoutubeVideosForChannel(p.youtubeChannelId, 5, p.youtubeHandle, {
        minDurationSeconds: PODCAST_MIN_DURATION_SECONDS,
        revalidateSeconds: PODCASTS_REVALIDATE_SECONDS,
      }),
    })),
  );
}

export const loadPodcastsWithEpisodes = unstable_cache(
  loadPodcastsWithEpisodesUncached,
  ["podcasts-with-episodes-v1"],
  { revalidate: PODCASTS_REVALIDATE_SECONDS, tags: ["podcasts"] },
);
