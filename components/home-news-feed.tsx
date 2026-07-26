"use client";

import { useEffect, useState } from "react";
import type { CoinNewsItem } from "@/lib/coin-news";
import { formatNewsTimestampEst } from "@/lib/format-date";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import { SectionHeading } from "@/components/section-heading";

/** Poll interval; keep in sync with `NEWS_TTL_MS` in `lib/coin-news.ts`. */
const POLL_MS = 45_000;
const MAX_HEADLINES = 5;
/** Keep mobile news shorter so market data stays above the fold longer. */
const MAX_HEADLINES_MOBILE = 4;

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
      className="glass-panel rounded-xl p-5 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <SectionHeading id="home-news-heading" className="text-lg sm:text-xl">
          In the News
        </SectionHeading>
        {stale ? (
          <span className="rounded border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200">
            Feed delayed
          </span>
        ) : null}
      </div>

      <ul className="mt-5 flex flex-col gap-3.5 sm:gap-4">
        {headlines.length > 0 ? (
          headlines.map((item, index) => {
            const source = cleanDisplayText(item.source) || "News";
            const title = cleanDisplayText(item.title);
            return (
              <li
                key={item.id}
                className={index >= MAX_HEADLINES_MOBILE ? "hidden sm:block" : undefined}
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-white/[0.08] bg-[#111111]/70 px-4 py-4 transition-colors hover:border-[#d1a173]/35 hover:bg-[#141414] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:py-3.5"
                >
                  <span className="inline-flex max-w-full truncate rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    {source}
                  </span>
                  <span className="mt-2.5 line-clamp-2 block text-[15px] font-semibold leading-snug text-zinc-100 sm:text-sm">
                    {title}
                  </span>
                  <span className="mt-2 block text-xs text-zinc-500 sm:text-[11px]">
                    {formatNewsTimestampEst(item.publishedAt)}
                  </span>
                </a>
              </li>
            );
          })
        ) : (
          <li className="rounded-xl border border-white/[0.08] px-4 py-3.5 text-sm text-zinc-500">
            No crypto headlines available at the moment.
          </li>
        )}
      </ul>

      <a
        href={moreHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-[#d7ad82] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:min-h-10"
      >
        View more news →
      </a>
    </section>
  );
}
