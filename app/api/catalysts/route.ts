import { NextResponse } from "next/server";
import {
  formatEventCountdown,
  scoreCatalystImpact,
  type CatalystImpact,
} from "@/lib/catalyst-impact";

type CatalystItem = {
  category: "Government" | "Policy" | "Listings";
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  /** When known and in the future, used for countdown. */
  eventAt?: string | null;
  impact: CatalystImpact;
};

/** Exchange listing / delisting signals only. */
const LISTING_KEYWORDS =
  /\b(listing|will list|lists|listed|delist|delisting|adds support|new listing)\b/i;

/** Major policy / regulatory catalysts only (not general crypto news). */
const MAJOR_POLICY_KEYWORDS =
  /\b(clarity act|sec\b|cftc|mica|etf|lawsuit|hearing|ban|approval|regulation|bill|fomc|federal reserve|fed\b|government|congress|treasury)\b/i;

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m?.[1]?.trim() ?? "";
}

function withImpact(
  item: Omit<CatalystItem, "impact"> & { impact?: CatalystImpact },
): CatalystItem {
  const impact = item.impact ?? scoreCatalystImpact(item);
  return { ...item, impact };
}

async function fetchRss(
  url: string,
  category: CatalystItem["category"],
  source: string,
  limit = 4,
): Promise<CatalystItem[]> {
  const res = await fetch(url, {
    next: { revalidate: 900 },
    headers: { Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1" },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const out: CatalystItem[] = [];
  for (const m of items) {
    if (out.length >= limit) break;
    const block = m[1];
    const title = decodeHtml(extractTag(block, "title")).replace(/\s+/g, " ").trim();
    const link = decodeHtml(extractTag(block, "link")).trim();
    const pubDate = extractTag(block, "pubDate");
    if (!title || !link) continue;
    const publishedAt = Number.isNaN(Date.parse(pubDate))
      ? new Date().toISOString()
      : new Date(pubDate).toISOString();
    out.push(withImpact({ category, title, url: link, source, publishedAt, eventAt: null }));
  }
  return out;
}

function onlyListingSignals(items: CatalystItem[]): CatalystItem[] {
  return items.filter((item) => LISTING_KEYWORDS.test(item.title));
}

function onlyMajorPolicy(items: CatalystItem[]): CatalystItem[] {
  return items.filter((item) => MAJOR_POLICY_KEYWORDS.test(item.title));
}

function isHighImpact(item: CatalystItem): boolean {
  return item.impact === "High" || item.impact === "Medium";
}

function dedupe(items: CatalystItem[]): CatalystItem[] {
  const seen = new Set<string>();
  const out: CatalystItem[] = [];
  for (const item of items) {
    const key = `${item.title.toLowerCase()}|${item.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function classifyEvent(title: string): CatalystItem["category"] | null {
  if (LISTING_KEYWORDS.test(title)) return "Listings";
  if (MAJOR_POLICY_KEYWORDS.test(title)) {
    return /\b(government|congress|treasury|fed\b|fomc|federal reserve)\b/i.test(title)
      ? "Government"
      : "Policy";
  }
  return null;
}

async function fetchCoinMarketCalEvents(limit = 12): Promise<CatalystItem[]> {
  const apiKey = process.env.COINMARKETCAL_API_KEY?.trim();
  if (!apiKey) return [];

  const endpoints = [
    `https://developers.coinmarketcal.com/v1/events?max=${limit}&sortBy=created_desc`,
    `https://developers.coinmarketcal.com/v1/events?max=${limit}`,
  ];

  let payload: unknown = null;
  for (const url of endpoints) {
    const res = await fetch(url, {
      next: { revalidate: 900 },
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) continue;
    payload = await res.json();
    break;
  }
  if (!payload) return [];

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { body?: unknown }).body)
      ? ((payload as { body: unknown[] }).body)
      : Array.isArray((payload as { data?: unknown }).data)
        ? ((payload as { data: unknown[] }).data)
        : [];

  const out: CatalystItem[] = [];
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const titleRaw =
      (typeof r.title === "string" ? r.title : "") ||
      (typeof r.event === "string" ? r.event : "") ||
      (typeof r.name === "string" ? r.name : "");
    const title = decodeHtml(titleRaw).replace(/\s+/g, " ").trim();
    if (!title) continue;

    const category = classifyEvent(title);
    if (!category) continue;

    const source =
      (typeof r.source === "string" ? r.source : "") ||
      (typeof (r.coin as Record<string, unknown> | undefined)?.name === "string"
        ? ((r.coin as Record<string, string>).name)
        : "CoinMarketCal");

    const url =
      (typeof r.proof === "string" ? r.proof : "") ||
      (typeof r.url === "string" ? r.url : "") ||
      (typeof r.source_url === "string" ? r.source_url : "") ||
      "https://coinmarketcal.com/en/";

    const dateRaw =
      (typeof r.date_event === "string" ? r.date_event : "") ||
      (typeof r.published_at === "string" ? r.published_at : "") ||
      (typeof r.created_at === "string" ? r.created_at : "");

    const publishedAt = Number.isNaN(Date.parse(dateRaw))
      ? new Date().toISOString()
      : new Date(dateRaw).toISOString();

    const eventAt =
      typeof r.date_event === "string" && !Number.isNaN(Date.parse(r.date_event))
        ? new Date(r.date_event).toISOString()
        : null;

    out.push(
      withImpact({
        category,
        title,
        url,
        source,
        publishedAt,
        eventAt,
      }),
    );
  }

  return dedupe(out).slice(0, limit);
}

export async function GET() {
  try {
    const [coinMarketCalEvents, clarityAct, listings, krakenListings, listingSignals] =
      await Promise.all([
        fetchCoinMarketCalEvents(20),
        fetchRss(
          "https://news.google.com/rss/search?q=CLARITY+Act+OR+SEC+crypto+OR+ETF+crypto&hl=en-US&gl=US&ceid=US:en",
          "Policy",
          "Google News",
          6,
        ),
        fetchRss(
          "https://news.google.com/rss/search?q=crypto+exchange+listing+binance+coinbase+kraken&hl=en-US&gl=US&ceid=US:en",
          "Listings",
          "Google News",
          5,
        ),
        fetchRss("https://blog.kraken.com/feed", "Listings", "Kraken Blog", 8),
        fetchRss(
          "https://news.google.com/rss/search?q=(binance+OR+coinbase+OR+kraken+OR+okx+OR+kucoin+OR+bybit)+(%22will+list%22+OR+listing+OR+delisting)&hl=en-US&gl=US&ceid=US:en",
          "Listings",
          "Google News",
          10,
        ),
      ]);

    const listingItems = dedupe(
      [
        ...onlyListingSignals(krakenListings),
        ...onlyListingSignals(listings),
        ...onlyListingSignals(listingSignals),
        ...coinMarketCalEvents.filter((e) => e.category === "Listings"),
      ]
        .sort((a, b) => {
          const impactRank = { High: 0, Medium: 1, Low: 2 } as const;
          const ir = impactRank[a.impact] - impactRank[b.impact];
          if (ir !== 0) return ir;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        })
        .slice(0, 5),
    );

    const policyItems = dedupe(
      [
        ...onlyMajorPolicy(clarityAct),
        ...coinMarketCalEvents.filter((e) => e.category !== "Listings"),
      ]
        .filter(isHighImpact)
        .sort((a, b) => {
          const impactRank = { High: 0, Medium: 1, Low: 2 } as const;
          const ir = impactRank[a.impact] - impactRank[b.impact];
          if (ir !== 0) return ir;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        })
        .slice(0, 5),
    );

    const items = dedupe([...listingItems, ...policyItems]).map((item) => ({
      ...item,
      countdown: item.eventAt ? formatEventCountdown(item.eventAt) : null,
    }));

    const usingCoinMarketCal = coinMarketCalEvents.length > 0;

    return NextResponse.json({
      items,
      sourceProvider: usingCoinMarketCal ? "CoinMarketCal + Feeds" : "Aggregated News Feeds",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load catalysts" },
      { status: 502 },
    );
  }
}
