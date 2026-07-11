export type XFeedItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  publishedAt: string;
};

export type CachedXFeed = {
  tweets: XFeedItem[];
  stale: boolean;
  cachedAt: string | null;
};

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.1d4.us",
];
const CACHE_TTL_MS = 60_000;
const feedCache = new Map<string, { tweets: XFeedItem[]; fetchedAt: number }>();

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseRss(xml: string, handle: string, limit: number): XFeedItem[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.slice(0, limit).map((m, idx) => {
    const block = m[1];
    const title = stripHtml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? `Post from @${handle}`);
    const link = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? `https://x.com/${handle}`).trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    const description = stripHtml(block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "");
    return {
      id: `${handle}-${idx}-${pubDate ?? "now"}`,
      title,
      summary: description || `Latest update from @${handle}`,
      href: link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    };
  });
}

export async function getLatestXTweets(
  handle: string,
  limit = 5,
): Promise<XFeedItem[]> {
  for (const base of NITTER_INSTANCES) {
    const url = `${base}/${encodeURIComponent(handle)}/rss`;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" },
        next: { revalidate: 60 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes("<item>")) continue;
      return parseRss(xml, handle, limit);
    } catch {
      // try next instance
    }
  }
  return [];
}

export async function getLatestXTweetsCached(
  handle: string,
  limit = 5,
): Promise<CachedXFeed> {
  const key = `${handle.toLowerCase()}::${limit}`;
  const existing = feedCache.get(key);
  const now = Date.now();

  if (existing && now - existing.fetchedAt < CACHE_TTL_MS) {
    return {
      tweets: existing.tweets,
      stale: false,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  const fresh = await getLatestXTweets(handle, limit);
  if (fresh.length > 0) {
    feedCache.set(key, { tweets: fresh, fetchedAt: now });
    return { tweets: fresh, stale: false, cachedAt: new Date(now).toISOString() };
  }

  if (existing) {
    return {
      tweets: existing.tweets,
      stale: true,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  return { tweets: [], stale: false, cachedAt: null };
}
