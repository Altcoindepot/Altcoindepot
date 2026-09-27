/**
 * 0–3 site RSS headlines that mention a token ticker/name.
 * Hide the block when empty. No CoinGecko.
 */

import {
  getSiteNewsCached,
  SITE_NEWS_PAGE_LIMIT,
  type SiteNewsItem,
} from "@/lib/site-news";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleMentions(title: string, alias: string): boolean {
  const a = alias.trim();
  if (!a || a.length < 2) return false;
  const pattern =
    a.includes(" ")
      ? new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(a)}(?:[^a-z0-9]|$)`, "i")
      : new RegExp(`\\b${escapeRegExp(a)}\\b`, "i");
  return pattern.test(title);
}

export async function getTokenMentionHeadlines(input: {
  symbol: string;
  name?: string | null;
  limit?: number;
}): Promise<SiteNewsItem[]> {
  const limit = Math.min(3, Math.max(0, input.limit ?? 3));
  if (limit === 0) return [];
  const symbol = input.symbol.trim().toUpperCase();
  const name = (input.name ?? "").trim();
  if (!symbol && !name) return [];

  const aliases = [symbol, name].filter((a) => a.length >= 2);
  if (aliases.length === 0) return [];

  try {
    const news = await getSiteNewsCached(SITE_NEWS_PAGE_LIMIT);
    return news.items
      .filter((item) => aliases.some((a) => titleMentions(item.title, a)))
      .slice(0, limit);
  } catch {
    return [];
  }
}
