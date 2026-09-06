/**
 * Site-wide headlines from official outlet RSS/Atom feeds.
 * Not CoinGecko. Used by homepage + /news + /api/news only.
 *
 * Freshness rules:
 * - Merge all sources, sort by pubDate descending (never feed/source order)
 * - Dedupe by canonical URL
 * - Cache 15–30 min; never treat empty/error as a successful cache write
 * - On per-feed failure, keep lastGood for that source; re-sort when any feed returns newer items
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

/** In-process merge cache — 20 minutes (within 15–30). */
export const SITE_NEWS_TTL_MS = 20 * 60_000;
/** /news serves this many newest headlines (25–50). */
export const SITE_NEWS_PAGE_LIMIT = 50;
/** Homepage strip uses the first N of the same newest-first list. */
export const SITE_NEWS_HOME_LIMIT = 4;
const FEED_TIMEOUT_MS = 5_000;
/** Parse this many raw entries per feed, then keep the newest after pubDate sort. */
const PER_FEED_PARSE_CAP = 40;
const PER_FEED_KEEP = 20;

type FeedSource = {
  name: string;
  url: string;
};

/**
 * Publisher RSS/Atom feeds. Runtime drops any source that 404s or returns 0 items.
 * Do not rebalance / pin by source — merge then sort by pubDate only.
 */
export const SITE_NEWS_FEEDS: readonly FeedSource[] = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss" },
  { name: "The Block", url: "https://www.theblock.co/rss.xml" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "Blockworks", url: "https://blockworks.com/feed" },
  { name: "The Defiant", url: "https://thedefiant.io/feed/" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { name: "The Daily Hodl", url: "https://dailyhodl.com/feed/" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed" },
  { name: "DL News", url: "https://www.dlnews.com/arc/outboundfeeds/rss/" },
] as const;

type CacheEntry = {
  items: SiteNewsItem[];
  sourcesSucceeded: string[];
  fetchedAt: number;
};

type FeedFetchResult = {
  name: string;
  items: SiteNewsItem[];
  ok: boolean;
  fetchedCount: number;
  newestPubDate: string | null;
};

let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry | null> | null = null;

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

function pubMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function toIsoDate(raw: string): string | null {
  const t = Date.parse(raw);
  if (!Number.isFinite(t) || t <= 0) return null;
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
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString();
  } catch {
    return href.trim().toLowerCase().replace(/\/+$/, "");
  }
}

export function sortNewsByPubDateDesc(items: SiteNewsItem[]): SiteNewsItem[] {
  return [...items].sort((a, b) => {
    const vb = pubMs(b.publishedAt);
    const va = pubMs(a.publishedAt);
    if (vb !== va) return vb - va;
    return normalizeNewsUrl(a.href).localeCompare(normalizeNewsUrl(b.href));
  });
}

function newestPubDateOf(items: SiteNewsItem[]): string | null {
  if (items.length === 0) return null;
  return sortNewsByPubDateDesc(items)[0]?.publishedAt ?? null;
}

function parseRssOrAtom(xml: string, source: string): SiteNewsItem[] {
  const raw: SiteNewsItem[] = [];
  const seen = new Set<string>();

  const push = (title: string, hrefRaw: string, publishedRaw: string) => {
    if (raw.length >= PER_FEED_PARSE_CAP) return;
    const titleClean = cleanText(title);
    const href = hrefRaw.trim();
    if (!titleClean || !href || !/^https?:\/\//i.test(href)) return;
    const publishedAt = toIsoDate(publishedRaw);
    // Skip undated items so they cannot pin slot 1 via epoch-0 / "now" fallbacks.
    if (!publishedAt) return;
    const norm = normalizeNewsUrl(href);
    if (seen.has(norm)) return;
    seen.add(norm);
    raw.push({
      id: `${source}::${norm}`,
      title: titleClean,
      href,
      source,
      publishedAt,
    });
  };

  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    if (raw.length >= PER_FEED_PARSE_CAP) break;
    const block = m[1]!;
    push(
      tagText(block, "title"),
      tagText(block, "link") ||
        block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]?.trim() ||
        "",
      tagText(block, "pubDate") || tagText(block, "published") || tagText(block, "dc:date"),
    );
  }

  if (raw.length < PER_FEED_PARSE_CAP) {
    for (const m of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
      if (raw.length >= PER_FEED_PARSE_CAP) break;
      const block = m[1]!;
      push(
        tagText(block, "title"),
        atomLink(block),
        tagText(block, "published") || tagText(block, "updated") || tagText(block, "dc:date"),
      );
    }
  }

  // Per-feed: newest by pubDate, then keep a slice — never keep feed document order.
  return sortNewsByPubDateDesc(raw).slice(0, PER_FEED_KEEP);
}

async function fetchOneFeed(feed: FeedSource): Promise<FeedFetchResult> {
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
      cache: "no-store",
    });
    if (!res.ok) {
      console.info("[site-news] feed status", {
        source: feed.name,
        status: res.status,
        fetchedCount: 0,
        newestPubDate: null,
      });
      return { name: feed.name, items: [], ok: false, fetchedCount: 0, newestPubDate: null };
    }
    const xml = await res.text();
    if (!xml || xml.length < 40) {
      console.info("[site-news] feed empty body", {
        source: feed.name,
        fetchedCount: 0,
        newestPubDate: null,
      });
      return { name: feed.name, items: [], ok: false, fetchedCount: 0, newestPubDate: null };
    }
    const items = parseRssOrAtom(xml, feed.name);
    const newestPubDate = newestPubDateOf(items);
    console.info("[site-news] feed ok", {
      source: feed.name,
      fetchedCount: items.length,
      newestPubDate,
    });
    return {
      name: feed.name,
      items,
      ok: items.length > 0,
      fetchedCount: items.length,
      newestPubDate,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.info("[site-news] feed failed", {
      source: feed.name,
      error: msg,
      fetchedCount: 0,
      newestPubDate: null,
    });
    return { name: feed.name, items: [], ok: false, fetchedCount: 0, newestPubDate: null };
  } finally {
    clearTimeout(timer);
  }
}

function sourcesLabel(names: string[]): string {
  if (names.length === 0) return "Headlines from major crypto outlets";
  if (names.length === 1) return `Headlines from ${names[0]}`;
  if (names.length === 2) return `Headlines from ${names[0]} and ${names[1]}`;
  const head = names.slice(0, -1).join(", ");
  return `Headlines from ${head}, and ${names[names.length - 1]}`;
}

/**
 * Merge successful fetches onto lastGood.
 * Failed/empty feeds keep their previous articles; any newer pubDate wins on URL collide.
 * Final list is always pubDate-desc.
 */
function mergeWithLastGood(
  results: FeedFetchResult[],
  lastGood: SiteNewsItem[] | null,
): SiteNewsItem[] {
  const byUrl = new Map<string, SiteNewsItem>();

  if (lastGood) {
    for (const item of lastGood) {
      byUrl.set(normalizeNewsUrl(item.href), item);
    }
  }

  for (const r of results) {
    if (!r.ok || r.items.length === 0) continue;
    for (const item of r.items) {
      const key = normalizeNewsUrl(item.href);
      const prev = byUrl.get(key);
      if (!prev || pubMs(item.publishedAt) >= pubMs(prev.publishedAt)) {
        byUrl.set(key, { ...item, href: item.href, id: `${item.source}::${key}` });
      }
    }
  }

  return sortNewsByPubDateDesc([...byUrl.values()]);
}

async function refreshSiteNews(): Promise<CacheEntry | null> {
  const results = await Promise.all(SITE_NEWS_FEEDS.map((f) => fetchOneFeed(f)));
  const okFeeds = results.filter((r) => r.ok);
  const fetchedCount = Object.fromEntries(results.map((r) => [r.name, r.fetchedCount]));

  // Never treat total failure / all-empty as a successful cache write.
  if (okFeeds.length === 0) {
    console.info("[site-news] merge skipped — no successful feeds", {
      fetchedCount,
      newestPubDate: newestPubDateOf(cache?.items ?? []),
      keptLastGood: Boolean(cache?.items.length),
    });
    return null;
  }

  const merged = mergeWithLastGood(results, cache?.items ?? null).slice(
    0,
    SITE_NEWS_PAGE_LIMIT,
  );
  if (merged.length === 0) {
    console.info("[site-news] merge empty after ok feeds — not caching", { fetchedCount });
    return null;
  }

  const newestPubDate = newestPubDateOf(merged);
  // Label = feeds that returned items this refresh (even if older than the top 50).
  const sourcesSucceeded = SITE_NEWS_FEEDS.map((f) => f.name).filter((n) =>
    okFeeds.some((r) => r.name === n),
  );
  const dropped = results.filter((r) => !r.ok).map((r) => r.name);

  console.info("[site-news] merge", {
    fetchedCount,
    newestPubDate,
    mergedCount: merged.length,
    sourcesSucceeded,
    dropped,
    top: merged.slice(0, 4).map((i) => ({
      source: i.source,
      publishedAt: i.publishedAt,
      title: i.title.slice(0, 72),
    })),
  });

  return {
    items: merged,
    sourcesSucceeded,
    fetchedAt: Date.now(),
  };
}

/**
 * Merged publisher RSS/Atom headlines. Never throws.
 * Partial success merges onto lastGood and re-sorts by pubDate — no source balancing.
 */
export async function getSiteNewsCached(limit = SITE_NEWS_HOME_LIMIT): Promise<SiteNewsResult> {
  const capped = Math.min(SITE_NEWS_PAGE_LIMIT, Math.max(1, Math.floor(limit)));
  const now = Date.now();
  if (cache && cache.items.length > 0 && now - cache.fetchedAt < SITE_NEWS_TTL_MS) {
    return {
      items: sortNewsByPubDateDesc(cache.items).slice(0, capped),
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
    if (next && next.items.length > 0) {
      cache = next;
      return {
        items: next.items.slice(0, capped),
        sourcesSucceeded: next.sourcesSucceeded,
        sourcesLabel: sourcesLabel(next.sourcesSucceeded),
        stale: false,
        cachedAt: new Date(next.fetchedAt).toISOString(),
      };
    }
  } catch (err) {
    console.warn("[site-news] refresh failed", err);
  }

  if (cache && cache.items.length > 0) {
    return {
      items: sortNewsByPubDateDesc(cache.items).slice(0, capped),
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
    stale: true,
    cachedAt: null,
  };
}
