import type { CoinGeckoDetail } from "@/lib/coingecko";

export type YoutubeFeedItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  publishedAt: string;
  thumbnailUrl?: string;
};

export type CachedYoutubeFeed = {
  videos: YoutubeFeedItem[];
  /** Human-readable source hint for the UI */
  sourceHint: string | null;
  stale: boolean;
  cachedAt: string | null;
};

const CACHE_TTL_MS = 15 * 60_000;
const feedCache = new Map<string, { videos: YoutubeFeedItem[]; fetchedAt: number }>();

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** UC… channel id length on YouTube */
const UC_RE = /(UC[a-zA-Z0-9_-]{22})/;

function extractChannelIdFromYoutubeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const qp = u.searchParams.get("channel_id") ?? u.searchParams.get("uc");
    if (qp && UC_RE.test(qp)) {
      const m = qp.match(UC_RE);
      if (m) return m[1];
    }
    const fromPath = u.pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (fromPath) return fromPath[1];
    return null;
  } catch {
    return null;
  }
}

function extractHandleFromYoutubeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.replace(/^www\./, "").includes("youtube.com")) return null;
    const m = u.pathname.match(/^\/@([^/?#]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

export function coinHasYoutubeLinks(coin: CoinGeckoDetail): boolean {
  return collectYoutubeLinks(coin).length > 0;
}

function collectYoutubeLinks(coin: CoinGeckoDetail): string[] {
  const buckets = [
    ...(coin.links?.homepage ?? []),
    ...(coin.links?.announcement_url ?? []),
    ...(coin.links?.official_forum_url ?? []),
  ];
  const out: string[] = [];
  for (const u of buckets) {
    if (typeof u !== "string" || !u.startsWith("http")) continue;
    const lower = u.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      out.push(u);
    }
  }
  return [...new Set(out)];
}

async function resolveHandleToChannelId(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@${encodeURIComponent(handle)}`, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "AltcoinDepot/1.0 (youtube-discovery)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

async function gatherChannelIdsForCoin(coin: CoinGeckoDetail): Promise<string[]> {
  const ids = new Set<string>();
  for (const link of collectYoutubeLinks(coin)) {
    const direct = extractChannelIdFromYoutubeUrl(link);
    if (direct) {
      ids.add(direct);
      continue;
    }
    const handle = extractHandleFromYoutubeUrl(link);
    if (handle) {
      const resolved = await resolveHandleToChannelId(handle);
      if (resolved) ids.add(resolved);
    }
  }
  return [...ids];
}

function parseYoutubeVideoAtom(xml: string, limit: number): YoutubeFeedItem[] {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)];
  const out: YoutubeFeedItem[] = [];
  for (const m of entries) {
    if (out.length >= limit) break;
    const block = m[1];
    const fromIdTag = block.match(/yt:video:([a-zA-Z0-9_-]{5,})/i)?.[1];
    const fromVideoIdEl = block.match(/<(?:[a-z]+:)?videoId>([^<]+)<\//i)?.[1]?.trim();
    const vid = (fromVideoIdEl || fromIdTag || "").trim();
    const titleRaw =
      block.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const title = stripHtml(
      titleRaw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
    );
    const linkEl =
      block.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/i)?.[1]
      ?? block.match(/<link[^>]+href="([^"]+)"[^>]*rel="alternate"/i)?.[1]
      ?? block.match(/<link[^>]+href="([^"]+)"/i)?.[1];
    const href = (linkEl?.trim() || (vid ? `https://www.youtube.com/watch?v=${encodeURIComponent(vid)}` : "")) as string;
    const pub =
      block.match(/<published>([\s\S]*?)<\/published>/i)?.[1]?.trim()
      ?? block.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1]?.trim()
      ?? "";
    const thumb =
      block.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1]
      ?? block.match(/media:thumbnail[^>]+url="([^"]+)"/i)?.[1];
    if (!vid || !href) continue;
    const publishedAt = Number.isNaN(Date.parse(pub)) ? new Date().toISOString() : new Date(pub).toISOString();
    out.push({
      id: vid,
      title: title || "YouTube video",
      summary: "",
      href,
      publishedAt,
      thumbnailUrl: thumb,
    });
  }
  return out;
}

/** Latest uploads from a YouTube channel (public Atom feed). */
export async function getLatestYoutubeVideosForChannel(
  channelId: string,
  limit = 5,
): Promise<YoutubeFeedItem[]> {
  return fetchChannelFeed(channelId, limit);
}

async function fetchChannelFeed(channelId: string, limit: number): Promise<YoutubeFeedItem[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const res = await fetch(feedUrl, {
    next: { revalidate: 600 },
    headers: {
      Accept: "application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "User-Agent": "AltcoinDepot/1.0 (youtube-feed)",
    },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  if (!xml.includes("<entry")) return [];
  return parseYoutubeVideoAtom(xml, limit);
}

type YoutubeSearchApiItem = {
  id: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleMentionsCoin(title: string, name: string, sym: string): boolean {
  const t = title.toLowerCase();
  const nameLower = name.toLowerCase().trim();
  const symLower = sym.toLowerCase().trim();
  if (nameLower.length >= 3 && t.includes(nameLower)) return true;
  if (symLower.length < 2) return false;
  if (symLower.length <= 4) {
    try {
      return new RegExp(`\\b${escapeRe(symLower)}\\b`, "i").test(title);
    } catch {
      return t.includes(symLower);
    }
  }
  return t.includes(symLower);
}

async function searchVideosViaApi(coin: CoinGeckoDetail, limit: number): Promise<YoutubeFeedItem[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return [];

  const name = (coin.name ?? "").toString().trim();
  const sym = (coin.symbol ?? "").toString().trim();
  const q = [name, sym, "crypto"].filter(Boolean).join(" ");
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", String(Math.min(10, limit + 5)));
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!data || typeof data !== "object" || !("items" in data)) return [];
    const items = (data as { items?: YoutubeSearchApiItem[] }).items ?? [];
    const out: YoutubeFeedItem[] = [];
    for (const it of items) {
      const vid = it.id?.videoId;
      const sn = it.snippet;
      const title = (sn?.title ?? "").trim();
      if (!vid || !title) continue;
      if (!titleMentionsCoin(title, name, sym)) continue;
      const publishedAt = sn?.publishedAt
        ? new Date(sn.publishedAt).toISOString()
        : new Date().toISOString();
      const thumb = sn?.thumbnails?.medium?.url ?? sn?.thumbnails?.default?.url;
      out.push({
        id: vid,
        title,
        summary: (sn?.description ?? "").slice(0, 220),
        href: `https://www.youtube.com/watch?v=${vid}`,
        publishedAt,
        thumbnailUrl: thumb,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

function mergeAndDedupeVideos(rows: YoutubeFeedItem[], limit: number): YoutubeFeedItem[] {
  const seen = new Set<string>();
  const merged: YoutubeFeedItem[] = [];
  const sorted = [...rows].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  for (const v of sorted) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    merged.push(v);
    if (merged.length >= limit) break;
  }
  return merged;
}

export async function getYoutubeVideosForCoinCached(
  coin: CoinGeckoDetail,
  limit = 5,
): Promise<CachedYoutubeFeed> {
  const keyBase = `${coin.id.toLowerCase()}::${limit}`;
  const cacheKey = `${keyBase}::v1`;
  const existing = feedCache.get(cacheKey);
  const now = Date.now();
  if (existing && now - existing.fetchedAt < CACHE_TTL_MS) {
    return {
      videos: existing.videos,
      sourceHint: existing.videos.length ? "Recent videos" : null,
      stale: false,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  const collected: YoutubeFeedItem[] = [];
  let sourceHint: string | null = null;

  try {
    const channelIds = await gatherChannelIdsForCoin(coin);
    if (channelIds.length > 0) {
      for (const ch of channelIds) {
        const batch = await fetchChannelFeed(ch, limit);
        collected.push(...batch);
      }
      if (collected.length > 0) {
        sourceHint = "Official / linked YouTube channels";
      }
    }

    let merged = mergeAndDedupeVideos(collected, limit);

    if (merged.length < limit && process.env.YOUTUBE_API_KEY) {
      const searchHits = await searchVideosViaApi(coin, limit);
      if (searchHits.length > 0) {
        merged = mergeAndDedupeVideos([...merged, ...searchHits], limit);
        sourceHint =
          sourceHint
            ? `${sourceHint} · + title matches`
            : "Recent uploads mentioning this project in the title";
      }
    }

    if (merged.length > 0) {
      feedCache.set(cacheKey, { videos: merged, fetchedAt: now });
      return {
        videos: merged,
        sourceHint,
        stale: false,
        cachedAt: new Date(now).toISOString(),
      };
    }
  } catch {
    /* fall through */
  }

  if (existing) {
    return {
      videos: existing.videos,
      sourceHint: existing.videos.length ? "Recent videos (cached)" : null,
      stale: true,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  return { videos: [], sourceHint: null, stale: false, cachedAt: null };
}
