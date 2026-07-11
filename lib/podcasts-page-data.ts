import { CRYPTO_PODCASTS, type CryptoPodcast } from "@/lib/crypto-podcasts";
import { getLatestYoutubeVideosForChannel, type YoutubeFeedItem } from "@/lib/youtube-feed";

export type PodcastWithEpisodes = CryptoPodcast & {
  episodes: YoutubeFeedItem[];
};

export async function loadPodcastsWithEpisodes(): Promise<PodcastWithEpisodes[]> {
  return Promise.all(
    CRYPTO_PODCASTS.map(async (p) => ({
      ...p,
      episodes: await getLatestYoutubeVideosForChannel(p.youtubeChannelId, 5),
    })),
  );
}
