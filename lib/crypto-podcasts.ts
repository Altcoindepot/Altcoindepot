export type CryptoPodcast = {
  slug: string;
  /** Display name (page lists podcasts sorted alphabetically by this field). */
  title: string;
  tagline: string;
  youtubeChannelId: string;
  /** Optional @handle — used to re-resolve channel id if the feed/API fails. */
  youtubeHandle?: string;
  /** Full channel / uploads page on YouTube. */
  youtubeCatalogUrl: string;
  spotifyCatalogUrl: string;
  amazonMusicCatalogUrl: string;
};

/**
 * Canonical show slugs for /podcasts/[slug].
 * Keep all eight — do not drop any.
 */
export const CRYPTO_PODCASTS: CryptoPodcast[] = [
  {
    slug: "bankless",
    title: "Bankless",
    tagline: "Crypto, DeFi, and Ethereum — level up and go bankless.",
    youtubeChannelId: "UCCRxYlYOmLE2l5wxs3ckJtg",
    youtubeHandle: "Bankless",
    youtubeCatalogUrl: "https://www.youtube.com/@Bankless/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/41TNnXSv5ExcQSzEGLlGhy",
    amazonMusicCatalogUrl:
      "https://music.amazon.com/podcasts/532e806f-83c4-4f5a-9c89-b0f80d0ef37e",
  },
  {
    slug: "coffee-with-captain",
    title: "Coffee with Captain",
    tagline: "Daily weekday morning show on crypto markets, products, and onchain culture.",
    // Resolved from @coffeewithcaptainshow channel page
    youtubeChannelId: "UCfYdmS4SMxI-kQeMguO0VWA",
    youtubeHandle: "coffeewithcaptainshow",
    youtubeCatalogUrl: "https://www.youtube.com/@coffeewithcaptainshow/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/5SnBGrAMVlqjUtEfeUlf78",
    amazonMusicCatalogUrl:
      "https://music.amazon.com/podcasts/2c1fae9f-8c67-4ae3-9864-ce2485ba135a",
  },
  {
    slug: "coin-stories",
    title: "Coin Stories",
    tagline:
      "Natalie Brunell on Bitcoin, money, and long-form interviews with builders and macro voices.",
    // Resolved from @NatalieBrunell channel page
    youtubeChannelId: "UCru3nlhzHrbgK21x0MdB_eg",
    youtubeHandle: "NatalieBrunell",
    youtubeCatalogUrl: "https://www.youtube.com/@NatalieBrunell/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/0YOEwxAR1uIx1a15QpqE0l",
    amazonMusicCatalogUrl:
      "https://music.amazon.com/podcasts/dc0bb56c-a826-4570-984b-a2a7c5a6849e/coin-stories-with-natalie-brunell",
  },
  {
    slug: "milk-road",
    title: "The Milk Road Show",
    tagline: "Daily crypto news and interviews with builders and investors.",
    youtubeChannelId: "UCWPil6c2lnmMbh2cJRwuHzQ",
    youtubeHandle: "MilkRoadDaily",
    youtubeCatalogUrl: "https://www.youtube.com/@MilkRoadDaily/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/4kjIjZ7gBNgbYasqLQJEEy",
    amazonMusicCatalogUrl:
      "https://music.amazon.com/podcasts/01a87797-16bf-4d21-baaf-e8db413b56a0",
  },
  {
    slug: "pomp",
    title: "The Pomp Podcast",
    tagline: "Long-form conversations on Bitcoin, business, and markets.",
    youtubeChannelId: "UCML9PlpcOxM_H53IM0fa4XA",
    youtubeHandle: "AnthonyPompliano",
    youtubeCatalogUrl: "https://www.youtube.com/@AnthonyPompliano/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/2QwpFjzJ0ZteqmMqw2xIfA",
    amazonMusicCatalogUrl: "https://www.amazon.com/dp/B0G5Y1KQ58",
  },
  {
    slug: "unchained",
    title: "Unchained",
    tagline:
      "Laura Shin on crypto news, regulation, DeFi, and industry interviews — no-hype journalism.",
    // Resolved from @UnchainedCrypto channel page
    youtubeChannelId: "UCuKiSkbYrUOOEEiYQEVPniQ",
    youtubeHandle: "UnchainedCrypto",
    youtubeCatalogUrl: "https://www.youtube.com/@UnchainedCrypto/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/1cJrrfGY1SKBIRn5noKSAf",
    amazonMusicCatalogUrl:
      "https://www.amazon.com/s?k=Unchained+Laura+Shin+podcast&i=digital-music-podcasts",
  },
  {
    slug: "what-bitcoin-did",
    title: "What Bitcoin Did",
    tagline: "Danny Knowles on Bitcoin, macro, and the future of money.",
    // Resolved from @WhatBitcoinDidPod channel page
    youtubeChannelId: "UCtvg5cXLY_tHDJeBoRySBtg",
    youtubeHandle: "WhatBitcoinDidPod",
    youtubeCatalogUrl: "https://www.youtube.com/@WhatBitcoinDidPod/videos",
    spotifyCatalogUrl: "https://open.spotify.com/show/18Pixm6jNMATYXSO6cUnTH",
    amazonMusicCatalogUrl:
      "https://www.amazon.com/s?k=What+Bitcoin+Did+podcast&i=digital-music-podcasts",
  },
  {
    slug: "wolf-of-all-streets",
    title: "The Wolf of All Streets",
    tagline: "Scott Melker on Bitcoin, trading, and conversations across crypto and finance.",
    youtubeChannelId: "UCxIU1RFIdDpvA8VOITswQ1A",
    youtubeHandle: "scottmelker",
    youtubeCatalogUrl: "https://www.youtube.com/@scottmelker/videos",
    spotifyCatalogUrl: "https://spoti.fi/30N5FDe",
    amazonMusicCatalogUrl:
      "https://www.amazon.com/s?k=The+Wolf+of+All+Streets+podcast&i=digital-music-podcasts",
  },
].sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));

/** Old / alternate slugs → canonical show slug. */
export const PODCAST_SLUG_ALIASES: Record<string, string> = {
  "the-milk-road-show": "milk-road",
  "milk-road-show": "milk-road",
  "the-pomp-podcast": "pomp",
  "pomp-podcast": "pomp",
  "the-wolf-of-all-streets": "wolf-of-all-streets",
};

export function podcastPath(slug: string): string {
  return `/podcasts/${encodeURIComponent(slug)}`;
}

export function resolvePodcastSlug(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  const aliased = PODCAST_SLUG_ALIASES[key] ?? key;
  return CRYPTO_PODCASTS.some((p) => p.slug === aliased) ? aliased : null;
}

export function getPodcastBySlug(raw: string): CryptoPodcast | null {
  const slug = resolvePodcastSlug(raw);
  if (!slug) return null;
  return CRYPTO_PODCASTS.find((p) => p.slug === slug) ?? null;
}

/** All eight show paths for sitemap / SEO checks. */
export const PODCAST_SHOW_PATHS = CRYPTO_PODCASTS.map((p) => podcastPath(p.slug));
