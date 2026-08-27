/**
 * Site-wide headlines from official outlet RSS/Atom feeds.
 * Not CoinGecko. Used by homepage + /news + /api/news only.
 */

export type SiteNewsItem = {
  id: string;
  title: string;
  href: string;
  source: string;
  publishedAt: string;
};

export type SiteNewsResult = {
  items: SiteNewsItem[];
  /** Outlet names that returned at least one item this refresh. */
  sourcesSucceeded: string[];
  /** Human label for UI: "Headlines from CoinDesk, The Block, …" */
  sourcesLabel: string;
  stale: boolean;
  cachedAt: string | null;
};

/** Merged feed cache — near-live (5–10 min). */
export const SITE_NEWS_TTL_MS = 7 * 60_000;
const FEED_TIMEOUT_MS = 4_000;
const PER_FEED_CAP = 12;

type FeedSource = {
  name: string;
  url: string;
};

/**
 * Official publisher feeds (verified Aug 2026).
 * Blockworks serves Atom at blockworks.com/feed after redirect from .co.
 */
export const SITE_NEWS_FEEDS: readonly FeedSource[] = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss" },
  { name: "The Block", url: "https://www.theblock.co/rss.xml" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "Blockworks", url: "https://blockworks.com/feed" },
  { name: "The Defiant", url: "https://thedefiant.io/feed/" },
] as const;

type CacheEntry = {
  items: SiteNewsItem[];
  sourcesSucceeded: string[];
  fetchedAt: number;
};

let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;(?:nbsp|#0*160|#x0*A0);/gi, " ")
    .replace(/&nbsp;|&#0*160;|&#x0*A0;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanText(input: string): string {
  return stripHtml(decodeEntities(input)).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function tagText(block: string, tag: string): string {
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
  )?.[1];
  if (cdata != null) return cleanText(cdata);
  return cleanText(block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
}

function atomLink(block: string): string {
  const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)?.[1];
  if (alt) return alt.trim();
  const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)?.[1];
  if (href) return href.trim();
  return tagText(block, "link");
}

function toIsoDate(raw: string): string {
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return new Date(0).toISOString();
  return new Date(t).toISOString();
}

/** Normalize for dedupe: host lowercased, no trailing slash, drop tracking params. */
export function normalizeNewsUrl(href: string): string {
  try {
    const u = new URL(href.trim());
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];
    for (const k of drop) u.searchParams.delete(k);
    let path = u.pathname.replace(/\/+$/, "") || "/";
    u.pathname = path;
    return u.toString();
  } catch {
    return href.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function parseRssOrAtom(xml: string, source: string, limit: number): SiteNewsItem[] {
  const out: SiteNewsItem[] = [];
  const seen = new Set<string>();

  const push = (title: string, hrefRaw: string, publishedRaw: string) => {
    const titleClean = cleanText(title);
    const href = hrefRaw.trim();
    if (!titleClean || !href || !/^https?:\/\//i.test(href)) return;
    const norm = normalizeNewsUrl(href);
    if (seen.has(norm)) return;
    seen.add(norm);
    const publishedAt = toIsoDate(publishedRaw);
    out.push({
      id: `${source}::${norm}`,
      title: titleClean,
      href,
      source,
      publishedAt,
    });
  };

  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    if (out.length >= limit) break;
    const block = m[1];
    push(
      tagText(block, "title"),
      tagText(block, "link") ||
        block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]?.trim() ||
        "",
      tagText(block, "pubDate") || tagText(block, "published") || tagText(block, "dc:date"),
    );
  }

  if (out.length < limit) {
    for (const m of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
      if (out.length >= limit) break;
      const block = m[1];
      push(
        tagText(block, "title"),
        atomLink(block),
        tagText(block, "published") || tagText(block, "updated"),
      );
    }
  }

  return out;
}

async function fetchOneFeed(feed: FeedSource): Promise<{ name: string; items: SiteNewsItem[] }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "User-Agent": "AltCoinDepotNewsBot/1.0 (+https://altcoindepot.com)",
      },
      // Freshness owned by SITE_NEWS_TTL_MS in-process cache.
      cache: "no-store",
    });
    if (!res.ok) {
      console.info("[site-news] feed status", { source: feed.name, status: res.status });
      return { name: feed.name, items: [] };
    }
    const xml = await res.text();
    if (!xml || xml.length < 40) {
      console.info("[site-news] feed empty body", { source: feed.name });
      return { name: feed.name, items: [] };
    }
    const items = parseRssOrAtom(xml, feed.name, PER_FEED_CAP);
    return { name: feed.name, items };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.info("[site-news] feed failed", { source: feed.name, error: msg });
    return { name: feed.name, items: [] };
  } finally {
    clearTimeout(timer);
  }
}

function sortNewest(items: SiteNewsItem[]): SiteNewsItem[] {
  return [...items].sort((a, b) => {
    const tb = Date.parse(b.publishedAt);
    const ta = Date.parse(a.publishedAt);
    const vb = Number.isFinite(tb) ? tb : 0;
    const va = Number.isFinite(ta) ? ta : 0;
    if (vb !== va) return vb - va;
    return a.href.localeCompare(b.href);
  });
}

function sourcesLabel(names: string[]): string {
  if (names.length === 0) return "Headlines from major crypto outlets";
  if (names.length === 1) return `Headlines from ${names[0]}`;
  if (names.length === 2) return `Headlines from ${names[0]} and ${names[1]}`;
  const head = names.slice(0, -1).join(", ");
  return `Headlines from ${head}, and ${names[names.length - 1]}`;
}

async function refreshSiteNews(): Promise<CacheEntry> {
  const results = await Promise.all(SITE_NEWS_FEEDS.map((f) => fetchOneFeed(f)));
  const sourcesSucceeded = results.filter((r) => r.items.length > 0).map((r) => r.name);
  const failed = results.filter((r) => r.items.length === 0).map((r) => r.name);

  console.info("[site-news] merge", {
    succeeded: sourcesSucceeded,
    failedOrEmpty: failed,
    counts: Object.fromEntries(results.map((r) => [r.name, r.items.length])),
  });

  const seen = new Set<string>();
  const merged: SiteNewsItem[] = [];
  for (const r of results) {
    for (const item of r.items) {
      const key = normalizeNewsUrl(item.href);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return {
    items: sortNewest(merged),
    sourcesSucceeded,
    fetchedAt: Date.now(),
  };
}

/**
 * Merged official RSS/Atom headlines. Never throws.
 * Partial success is fine — returns whatever feeds responded.
 */
export async function getSiteNewsCached(limit = 12): Promise<SiteNewsResult> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < SITE_NEWS_TTL_MS) {
    return {
      items: cache.items.slice(0, limit),
      sourcesSucceeded: cache.sourcesSucceeded,
      sourcesLabel: sourcesLabel(cache.sourcesSucceeded),
      stale: false,
      cachedAt: new Date(cache.fetchedAt).toISOString(),
    };
  }

  try {
    if (!inflight) {
      inflight = refreshSiteNews().finally(() => {
        inflight = null;
      });
    }
    const next = await inflight;
    if (next.items.length > 0) {
      cache = next;
      return {
        items: next.items.slice(0, limit),
        sourcesSucceeded: next.sourcesSucceeded,
        sourcesLabel: sourcesLabel(next.sourcesSucceeded),
        stale: false,
        cachedAt: new Date(next.fetchedAt).toISOString(),
      };
    }
  } catch (err) {
    console.warn("[site-news] refresh failed", err);
  }

  if (cache) {
    return {
      items: cache.items.slice(0, limit),
      sourcesSucceeded: cache.sourcesSucceeded,
      sourcesLabel: sourcesLabel(cache.sourcesSucceeded),
      stale: true,
      cachedAt: new Date(cache.fetchedAt).toISOString(),
    };
  }

  return {
    items: [],
    sourcesSucceeded: [],
    sourcesLabel: sourcesLabel([]),
    stale: false,
    cachedAt: null,
  };
}
