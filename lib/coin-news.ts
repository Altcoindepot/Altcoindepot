import type { CoinGeckoDetail } from "@/lib/coingecko";
import { getCoinById } from "@/lib/coingecko";

export type CoinNewsItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  source: string;
  publishedAt: string;
  thumbnail?: string;
};

export type CachedCoinNews = {
  items: CoinNewsItem[];
  sourceUrl: string;
  stale: boolean;
  cachedAt: string | null;
};

/** How long identical news JSON is reused before re-fetching RSS (must be ≤ client poll for visible updates). */
const NEWS_TTL_MS = 45_000;
const NEWS_CACHE_VERSION = "v6";
const newsCache = new Map<string, { items: CoinNewsItem[]; fetchedAt: number }>();
const globalNewsCache = new Map<string, { items: CoinNewsItem[]; fetchedAt: number }>();

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

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

function stripUrls(input: string): string {
  return input
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\b[a-z0-9-]+\.(com|io|co|net|org|news|finance|xyz|app|ai)(\/\S*)?\b/gi, "")
    .trim();
}

function cleanHeadline(input: string): string {
  return stripUrls(input)
    .replace(/\s*[-|]\s*(https?:\/\/\S+|www\.\S+)\s*$/i, "")
    .replace(/\(\s*(https?:\/\/\S+|www\.\S+)\s*\)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanNewsText(input: string): string {
  const decoded = decodeEntities(input);
  const noHtml = stripHtml(decoded);
  return stripUrls(noHtml)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractThumbnail(block: string): string | undefined {
  const candidates = [
    block.match(/<media:thumbnail[^>]*url="([^"]+)"/i)?.[1],
    block.match(/<media:content[^>]*url="([^"]+)"[^>]*type="image\/[^"]+"/i)?.[1],
    block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image\/[^"]+"/i)?.[1],
    block.match(/<img[^>]*src="([^"]+)"/i)?.[1],
    block.match(/&lt;img[^&]*src=&quot;([^&]+)&quot;/i)?.[1],
  ];
  const hit = candidates.find((c) => typeof c === "string" && /^https?:\/\//i.test(c));
  return hit?.trim();
}

function escapeRegExp(v: string): string {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Drop items that are clearly not English (CJK, Arabic, Cyrillic-heavy titles, etc.).
 * Uses Unicode script on letters; allows mixed Latin + punctuation/numbers.
 */
function isLikelyEnglish(text: string): boolean {
  const sample = text.normalize("NFKC").slice(0, 420);
  let letterCount = 0;
  let nonLatinLetterCount = 0;
  for (const ch of sample) {
    if (!/\p{L}/u.test(ch)) continue;
    letterCount++;
    if (!/\p{Script=Latin}/u.test(ch)) nonLatinLetterCount++;
  }
  if (letterCount < 2) return true;
  return nonLatinLetterCount / letterCount <= 0.12;
}

function parseGoogleNewsRss(xml: string, limit: number): CoinNewsItem[] {
  const rawItems = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const out: CoinNewsItem[] = [];
  for (let i = 0; i < rawItems.length && out.length < limit; i++) {
    const m = rawItems[i];
    const block = m[1];
    const title = cleanHeadline(cleanNewsText(
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1]
        ?? block.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
        ?? "",
    ));
    const href = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? "";
    const desc = cleanNewsText(
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1]
        ?? block.match(/<description>([\s\S]*?)<\/description>/i)?.[1]
        ?? "",
    );
    if (!href || !title) continue;
    if (!isLikelyEnglish(`${title} ${desc}`)) continue;
    const thumbnail = extractThumbnail(block);
    const source = cleanHeadline(
      cleanNewsText(block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "News"),
    );
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
    out.push({
      id: `${href}-${i}`,
      title,
      summary: desc.slice(0, 190),
      href,
      source,
      publishedAt: Number.isNaN(Date.parse(pubDate))
        ? new Date().toISOString()
        : new Date(pubDate).toISOString(),
      thumbnail,
    });
  }
  return out;
}

function isCoinRelevant(item: CoinNewsItem, coin: CoinGeckoDetail): boolean {
  try {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    const name = (coin.name ?? "").trim().toLowerCase();
    const symbol = (coin.symbol ?? "").trim().toLowerCase();
    const id = (coin.id ?? "").trim().toLowerCase();
    const nameMatch = name.length > 2 && text.includes(name);
    const idMatch = id.length > 2 && text.includes(id.replace(/-/g, " "));
    const symbolMatch =
      symbol.length >= 2
        ? new RegExp(`\\b${escapeRegExp(symbol)}\\b`, "i").test(`${item.title} ${item.summary}`)
        : false;
    return nameMatch || idMatch || symbolMatch;
  } catch {
    return false;
  }
}

function getNewsQuery(coin: CoinGeckoDetail): string {
  const sym = (coin.symbol ?? "").toString().toUpperCase();
  const name = (coin.name ?? "").toString().trim() || "crypto";
  return `${name} ${sym} crypto`.trim();
}

function topSourceQuery(coin: CoinGeckoDetail): string {
  const sym = (coin.symbol ?? "").toString().toUpperCase();
  const name = (coin.name ?? "").toString().trim() || "crypto";
  const coinPart = `"${name}" OR "${sym}"`;
  const sources = [
    "coindesk.com",
    "cointelegraph.com",
    "decrypt.co",
    "theblock.co",
    "bitcoinmagazine.com",
    "cryptopotato.com",
    "u.today",
    "blockworks.co",
    "cryptoslate.com",
    "beincrypto.com",
    "crypto.news",
    "ambcrypto.com",
    "newsbtc.com",
    "yahoo.com",
    "reuters.com",
    "forbes.com",
  ];
  const sourcePart = sources.map((s) => `site:${s}`).join(" OR ");
  return `(${coinPart}) (crypto OR blockchain) (${sourcePart})`;
}

function newsFeedUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en&lr=lang_en`;
}

async function fetchNewsByQuery(query: string, limit: number): Promise<CoinNewsItem[]> {
  const sourceUrl = newsFeedUrl(query);
  const res = await fetch(sourceUrl, {
    next: { revalidate: 600 },
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "AltcoinDepot/1.0 (coin-news)",
    },
  });
  if (!res.ok) throw new Error(`News RSS error: ${res.status}`);
  const xml = await res.text();
  return parseGoogleNewsRss(xml, limit);
}

export async function getCoinNewsCached(coin: CoinGeckoDetail, limit = 4): Promise<CachedCoinNews> {
  const broadQuery = getNewsQuery(coin);
  const priorityQuery = topSourceQuery(coin);
  const sourceUrl = newsFeedUrl(priorityQuery);
  const key = `${NEWS_CACHE_VERSION}::${coin.id.toLowerCase()}::${limit}`;
  const existing = newsCache.get(key);
  const now = Date.now();

  if (existing && now - existing.fetchedAt < NEWS_TTL_MS) {
    return {
      items: sortNewsByPublishedDesc(existing.items),
      sourceUrl,
      stale: false,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  try {
    const priority = await fetchNewsByQuery(priorityQuery, limit).catch(() => [] as CoinNewsItem[]);
    const broad = await fetchNewsByQuery(broadQuery, limit * 2).catch(() => [] as CoinNewsItem[]);
    const merged = [...priority, ...broad];
    const seen = new Set<string>();
    const filtered = merged.filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return isCoinRelevant(item, coin);
    });
    const items = sortNewsByPublishedDesc(filtered).slice(0, limit);
    if (items.length > 0) {
      newsCache.set(key, { items, fetchedAt: now });
      return {
        items,
        sourceUrl,
        stale: false,
        cachedAt: new Date(now).toISOString(),
      };
    }
  } catch {
    // stale fallback below
  }

  if (existing) {
    return {
      items: sortNewsByPublishedDesc(existing.items),
      sourceUrl,
      stale: true,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  return { items: [], sourceUrl, stale: false, cachedAt: null };
}

export async function getCoinNewsCachedById(id: string, limit = 4): Promise<CachedCoinNews> {
  const coin = await getCoinById(id);
  if (!coin) {
    return { items: [], sourceUrl: "", stale: false, cachedAt: null };
  }
  return getCoinNewsCached(coin, limit);
}

/** Split outlets into batches so Google News does not return one publisher for the whole feed. */
const GLOBAL_NEWS_BATCHES = [
  "(crypto OR bitcoin OR ethereum OR altcoin) (site:coindesk.com OR site:cointelegraph.com OR site:decrypt.co OR site:theblock.co)",
  "(crypto OR bitcoin OR ethereum OR altcoin) (site:blockworks.co OR site:cryptoslate.com OR site:beincrypto.com OR site:crypto.news)",
  "(crypto OR bitcoin OR ethereum OR altcoin) (site:bitcoinmagazine.com OR site:cryptopotato.com OR site:ambcrypto.com OR site:newsbtc.com)",
  "(crypto OR bitcoin OR ethereum OR altcoin) (site:u.today OR site:yahoo.com OR site:reuters.com OR site:forbes.com)",
  "(crypto OR bitcoin OR ethereum OR altcoin) (site:dlnews.com OR site:thedefiant.io OR site:bitcoinist.com OR site:coingape.com)",
];

function sortNewsByPublishedDesc(items: CoinNewsItem[]): CoinNewsItem[] {
  return [...items].sort((a, b) => {
    const tb = Date.parse(b.publishedAt);
    const ta = Date.parse(a.publishedAt);
    const vb = Number.isNaN(tb) ? 0 : tb;
    const va = Number.isNaN(ta) ? 0 : ta;
    if (vb !== va) return vb - va;
    return a.href.localeCompare(b.href);
  });
}

export async function getGlobalCryptoNewsCached(limit = 8): Promise<CachedCoinNews> {
  const broadQuery = "crypto OR cryptocurrency OR bitcoin OR ethereum OR altcoin";
  const sourceUrl = newsFeedUrl(
    "(crypto OR bitcoin OR ethereum OR altcoin) (site:coindesk.com OR site:cointelegraph.com OR site:decrypt.co OR site:blockworks.co OR site:theblock.co)",
  );
  const key = `${NEWS_CACHE_VERSION}::global::${limit}`;
  const existing = globalNewsCache.get(key);
  const now = Date.now();

  if (existing && now - existing.fetchedAt < NEWS_TTL_MS) {
    return {
      items: sortNewsByPublishedDesc(existing.items),
      sourceUrl,
      stale: false,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  try {
    const perBatch = Math.max(10, Math.ceil((limit * 5) / GLOBAL_NEWS_BATCHES.length));
    const batchResults = await Promise.all(
      GLOBAL_NEWS_BATCHES.map((q) => fetchNewsByQuery(q, perBatch).catch(() => [] as CoinNewsItem[])),
    );
    const merged = batchResults.flat();
    const seenHref = new Set<string>();
    const deduped = merged.filter((item) => {
      if (seenHref.has(item.href)) return false;
      seenHref.add(item.href);
      return true;
    });

    let items = sortNewsByPublishedDesc(deduped).slice(0, limit);

    if (items.length < limit) {
      const broad = await fetchNewsByQuery(broadQuery, 40).catch(() => [] as CoinNewsItem[]);
      const combined: CoinNewsItem[] = [...deduped];
      const hrefs = new Set(deduped.map((i) => i.href));
      for (const it of broad) {
        if (hrefs.has(it.href)) continue;
        hrefs.add(it.href);
        combined.push(it);
      }
      items = sortNewsByPublishedDesc(combined).slice(0, limit);
    }

    if (items.length > 0) {
      globalNewsCache.set(key, { items, fetchedAt: now });
      return {
        items,
        sourceUrl,
        stale: false,
        cachedAt: new Date(now).toISOString(),
      };
    }
  } catch {
    // stale fallback below
  }

  if (existing) {
    return {
      items: sortNewsByPublishedDesc(existing.items),
      sourceUrl,
      stale: true,
      cachedAt: new Date(existing.fetchedAt).toISOString(),
    };
  }

  return { items: [], sourceUrl, stale: false, cachedAt: null };
}
