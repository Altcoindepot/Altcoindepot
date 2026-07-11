import type { CoinGeckoDetail } from "@/lib/coingecko";

export type MediumFeedItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  publishedAt: string;
};

export type CachedMediumFeed = {
  posts: MediumFeedItem[];
  sourceUrl: string | null;
  stale: boolean;
  cachedAt: string | null;
};

const CACHE_TTL_MS = 10 * 60_000;
const mediumCache = new Map<string, { posts: MediumFeedItem[]; fetchedAt: number }>();
const MEDIUM_FALLBACK_BY_GECKO_ID: Record<string, string> = {
  solana: "https://medium.com/solana-labs",
  injective: "https://medium.com/injective-labs",
  "injective-protocol": "https://medium.com/injective-labs",
};

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toFeedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("medium.com")) return null;
    const host = u.hostname.toLowerCase();
    const cleanPath = u.pathname.replace(/\/+$/, "");

    if (cleanPath.startsWith("/feed/")) return `${u.origin}${cleanPath}`;
    if (host !== "medium.com" && host.endsWith(".medium.com")) {
      return `${u.origin}/feed`;
    }
    if (!cleanPath || cleanPath === "/") return null;
    return `${u.origin}/feed${cleanPath}`;
  } catch {
    return null;
  }
}

function feedCandidates(url: string): string[] {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("medium.com")) return [];
    const host = u.hostname.toLowerCase();
    const cleanPath = u.pathname.replace(/\/+$/, "");
    const candidates: string[] = [];

    if (cleanPath.startsWith("/feed/")) candidates.push(`${u.origin}${cleanPath}`);
    if (host !== "medium.com" && host.endsWith(".medium.com")) {
      candidates.push(`${u.origin}/feed`);
      if (cleanPath && cleanPath !== "/") candidates.push(`${u.origin}/feed${cleanPath}`);
    } else {
      if (cleanPath && cleanPath !== "/") candidates.push(`${u.origin}/feed${cleanPath}`);
      if (cleanPath.startsWith("/@")) candidates.push(`https://medium.com/feed${cleanPath}`);
      const first = cleanPath.split("/").filter(Boolean)[0];
      if (first && !first.startsWith("@") && first !== "feed") {
        candidates.push(`https://medium.com/feed/${first}`);
      }
    }

    const base = toFeedUrl(url);
    if (base) candidates.unshift(base);
    return [...new Set(candidates)];
  } catch {
    return [];
  }
}

function parseRss(xml: string, limit: number): MediumFeedItem[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, limit);
  return items
    .map((m, i) => {
      const block = m[1];
      const title = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1]
        ?? block.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
        ?? "";
      const href = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? "";
      const descRaw = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1]
        ?? block.match(/<description>([\s\S]*?)<\/description>/i)?.[1]
        ?? "";
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
      if (!href) return null;
      const summary = stripHtml(descRaw).slice(0, 190);
      const publishedAt = Number.isNaN(Date.parse(pubDate)) ? new Date().toISOString() : new Date(pubDate).toISOString();
      return {
        id: `${href}-${i}`,
        title: stripHtml(title) || "Untitled post",
        summary,
        href,
        publishedAt,
      } as MediumFeedItem;
    })
    .filter((v): v is MediumFeedItem => Boolean(v));
}

function parseAtom(xml: string, limit: number): MediumFeedItem[] {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].slice(0, limit);
  return entries
    .map((m, i) => {
      const block = m[1];
      const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
      const href =
        block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i)?.[1]
        ?? block.match(/<id>([\s\S]*?)<\/id>/i)?.[1]
        ?? "";
      const summaryRaw =
        block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]
        ?? block.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1]
        ?? "";
      const pubDate =
        block.match(/<published>([\s\S]*?)<\/published>/i)?.[1]
        ?? block.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1]
        ?? "";
      if (!href) return null;
      const summary = stripHtml(summaryRaw).slice(0, 190);
      const publishedAt = Number.isNaN(Date.parse(pubDate)) ? new Date().toISOString() : new Date(pubDate).toISOString();
      return {
        id: `${href}-${i}`,
        title: stripHtml(title) || "Untitled post",
        summary,
        href,
        publishedAt,
      } as MediumFeedItem;
    })
    .filter((v): v is MediumFeedItem => Boolean(v));
}

export function getMediumUrlForCoin(coin: CoinGeckoDetail): string | null {
  const urls = [
    ...(coin.links?.homepage ?? []),
    ...(coin.links?.announcement_url ?? []),
    ...(coin.links?.official_forum_url ?? []),
  ].filter((v): v is string => typeof v === "string" && v.startsWith("http"));

  for (const url of urls) {
    if (url.toLowerCase().includes("medium.com")) return url;
  }
  return MEDIUM_FALLBACK_BY_GECKO_ID[coin.id] ?? null;
}

export async function getLatestMediumPostsCached(
  coin: CoinGeckoDetail,
  limit = 5,
): Promise<CachedMediumFeed> {
  const mediumUrl = getMediumUrlForCoin(coin);
  if (!mediumUrl) {
    return { posts: [], sourceUrl: null, stale: false, cachedAt: null };
  }
  const feedUrls = feedCandidates(mediumUrl);
  if (feedUrls.length === 0) {
    return { posts: [], sourceUrl: mediumUrl, stale: false, cachedAt: null };
  }

  const key = `${feedUrls[0].toLowerCase()}::${limit}`;
  const existing = mediumCache.get(key);
  const now = Date.now();
  if (existing && now - existing.fetchedAt < CACHE_TTL_MS) {
    return {
      posts: existing.posts,
      sourceUrl: mediumUrl,
      stale: false,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  try {
    for (const feedUrl of feedUrls) {
      const res = await fetch(feedUrl, {
        next: { revalidate: 600 },
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
          "User-Agent": "AltcoinDepot/1.0 (medium-feed)",
        },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const posts = parseRss(xml, limit);
      const parsed = posts.length > 0 ? posts : parseAtom(xml, limit);
      if (parsed.length > 0) {
        mediumCache.set(key, { posts: parsed, fetchedAt: now });
        return {
          posts: parsed,
          sourceUrl: mediumUrl,
          stale: false,
          cachedAt: new Date(now).toISOString(),
        };
      }
    }
  } catch {
    // handled by stale fallback below
  }

  if (existing) {
    return {
      posts: existing.posts,
      sourceUrl: mediumUrl,
      stale: true,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  return { posts: [], sourceUrl: mediumUrl, stale: false, cachedAt: null };
}
