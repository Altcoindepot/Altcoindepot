import { loadMarketsBundle } from "@/lib/coingecko";
import { getTwitterHandleForGeckoId } from "@/lib/ecosystem-projects";
import { PROJECT_UPDATES, type ProjectUpdate } from "@/lib/project-updates";

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.1d4.us",
];

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseRssItems(xml: string, handle: string): ProjectUpdate[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.slice(0, 3).map((m, idx) => {
    const block = m[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? `Post from @${handle}`;
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? `https://x.com/${handle}`;
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    const description = block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";
    const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
    return {
      id: `${handle}-${publishedAt}-${idx}`,
      title: stripHtml(title).replace(/^RT by .*?:\s*/i, ""),
      summary: stripHtml(description) || `Latest update from @${handle}`,
      publishedAt,
      href: link.trim(),
    };
  });
}

async function fetchHandleRss(handle: string): Promise<ProjectUpdate[]> {
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
      return parseRssItems(xml, handle);
    } catch {
      // try next instance
    }
  }
  return [];
}

export async function getFeaturedCoinFeed(): Promise<ProjectUpdate[]> {
  try {
    const bundle = await loadMarketsBundle({ next: { revalidate: 60 } });
    const handles = [
      ...new Set(
        bundle.topMarkets
          .slice(0, 10)
          .map((c) => getTwitterHandleForGeckoId(c.id))
          .filter((h): h is string => Boolean(h)),
      ),
    ];

    if (handles.length === 0) return PROJECT_UPDATES;

    const updates = (await Promise.all(handles.map((h) => fetchHandleRss(h)))).flat();
    if (updates.length === 0) return PROJECT_UPDATES;

    return updates
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, 40);
  } catch {
    return PROJECT_UPDATES;
  }
}
