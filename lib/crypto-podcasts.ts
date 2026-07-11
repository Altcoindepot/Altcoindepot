export type CryptoPodcast = {
  slug: string;
  /** Display name (page lists podcasts sorted alphabetically by this field). */
  title: string;
  tagline: string;
  youtubeChannelId: string;
  /** Full channel / uploads page on YouTube. */
  youtubeCatalogUrl: string;
  spotifyCatalogUrl: string;
  amazonMusicCatalogUrl: string;
};

export const CRYPTO_PODCASTS: CryptoPodcast[] = [
  {
    slug: "bankless",
    title: "Bankless",
    tagline: "Crypto, DeFi, and Ethereum — level up and go bankless.",
    youtubeChannelId: "UCAl9Ld79qaZxp9JzEOwd3aA",
    youtubeCatalogUrl: "https://www.youtube.com/channel/UCAl9Ld79qaZxp9JzEOwd3aA/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/41TNnXSv5ExcQSzEGLlGhy",
    amazonMusicCatalogUrl:
      "https://music.amazon.com/podcasts/532e806f-83c4-4f5a-9c89-b0f80d0ef37e",
  },
  {
    slug: "the-milk-road-show",
    title: "The Milk Road Show",
    tagline: "Daily crypto news and interviews with builders and investors.",
    youtubeChannelId: "UC0tMvte4_cvUtkKf9APAvvA",
    youtubeCatalogUrl: "https://www.youtube.com/channel/UC0tMvte4_cvUtkKf9APAvvA/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/4kjIjZ7gBNgbYasqLQJEEy",
    amazonMusicCatalogUrl:
      "https://music.amazon.com/podcasts/01a87797-16bf-4d21-baaf-e8db413b56a0",
  },
  {
    slug: "the-pomp-podcast",
    title: "The Pomp Podcast",
    tagline: "Long-form conversations on Bitcoin, business, and markets.",
    youtubeChannelId: "UCML9PlpcOxM_H53IM0fa4XA",
    youtubeCatalogUrl: "https://www.youtube.com/channel/UCML9PlpcOxM_H53IM0fa4XA/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/2QwpFjzJ0ZteqmMqw2xIfA",
    amazonMusicCatalogUrl: "https://www.amazon.com/dp/B0G5Y1KQ58",
  },
  {
    slug: "the-wolf-of-all-streets",
    title: "The Wolf of All Streets",
    tagline: "Scott Melker on Bitcoin, trading, and conversations across crypto and finance.",
    youtubeChannelId: "UCxIU1RFIdDpvA8VOITswQ1A",
    youtubeCatalogUrl: "https://www.youtube.com/channel/UCxIU1RFIdDpvA8VOITswQ1A/videos",
    spotifyCatalogUrl: "https://spoti.fi/30N5FDe",
    amazonMusicCatalogUrl:
      "https://www.amazon.com/s?k=The+Wolf+of+All+Streets+podcast&i=digital-music-podcasts",
  },
].sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
