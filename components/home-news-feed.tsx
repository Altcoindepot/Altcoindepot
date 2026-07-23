"use client";

import { useEffect, useState } from "react";
import type { CoinNewsItem } from "@/lib/coin-news";
import { formatNewsTimestampEst } from "@/lib/format-date";
import { readResponseJsonSafely } from "@/lib/read-response-json";

/** Poll interval; keep in sync with `NEWS_TTL_MS` in `lib/coin-news.ts`. */
const POLL_MS = 45_000;
const MAX_HEADLINES = 5;

const FALLBACK_MORE_NEWS =
  "https://news.google.com/search?q=cryptocurrency&hl=en-US&gl=US&ceid=US:en";

function cleanDisplayText(input: string) {
  return input
    .replace(/&amp;(?:nbsp|#0*160|#x0*A0);/gi, " ")
    .replace(/&nbsp;|&#0*160;|&#x0*A0;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/&lt;/gi, "")
    .replace(/&gt;/gi, "")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function HomeNewsFeed({
  initialItems,
  initialStale,
  initialSourceUrl,
}: {
  initialItems?: CoinNewsItem[];
  initialStale?: boolean;
  initialSourceUrl?: string;
}) {
  const [items, setItems] = useState<CoinNewsItem[]>(initialItems ?? []);
  const [stale, setStale] = useState(Boolean(initialStale));
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl ?? "");

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/news?_=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (!mounted || !data || typeof data !== "object") return;
        if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
          setItems((data as { items: CoinNewsItem[] }).items);
          setStale(Boolean((data as { stale?: unknown }).stale));
          const src = (data as { sourceUrl?: unknown }).sourceUrl;
          if (typeof src === "string") setSourceUrl(src);
        }
      } catch {
        // keep previous snapshot
      }
    }
    void refresh().catch(() => {});
    const id = window.setInterval(() => {
      void refresh().catch(() => {});
    }, POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const headlines = items.slice(0, MAX_HEADLINES);
  const moreHref = sourceUrl || FALLBACK_MORE_NEWS;

  return (
    <section
      aria-labelledby="home-news-heading"
      className="glass-panel rounded-xl p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="home-news-heading"
          className="text-base font-extrabold tracking-tight text-zinc-100"
        >
          In the News
        </h2>
        {stale ? (
          <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200">
            Feed delayed
          </span>
        ) : null}
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {headlines.length > 0 ? (
          headlines.map((item) => {
            const source = cleanDisplayText(item.source) || "News";
            const title = cleanDisplayText(item.title);
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-white/10 bg-[#111111]/80 px-3 py-3 transition-colors hover:border-[#d1a173]/40 hover:bg-[#141414] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
                >
                  <span className="inline-flex max-w-full truncate rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    {source}
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm font-semibold leading-snug text-zinc-100">
                    {title}
                  </span>
                  <span className="mt-2 block text-[11px] text-zinc-500">
                    {formatNewsTimestampEst(item.publishedAt)}
                  </span>
                </a>
              </li>
            );
          })
        ) : (
          <li className="rounded-lg border border-white/10 px-3 py-3 text-sm text-zinc-500">
            No crypto headlines available at the moment.
          </li>
        )}
      </ul>

      <a
        href={moreHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-[#d7ad82] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
      >
        View more news →
      </a>
    </section>
  );
}
