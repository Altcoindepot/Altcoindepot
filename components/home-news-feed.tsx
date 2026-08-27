"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SiteNewsItem } from "@/lib/site-news";
import { formatTimeAgo } from "@/lib/format-date";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import { SectionHeading } from "@/components/section-heading";

/** Poll under the ~7m server TTL so home stays near-live. */
const POLL_MS = 6 * 60_000;

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
  initialSourcesLabel,
  maxItems = 10,
  maxItemsMobile = 3,
}: {
  initialItems?: SiteNewsItem[];
  initialStale?: boolean;
  initialSourcesLabel?: string;
  maxItems?: number;
  maxItemsMobile?: number;
}) {
  const [items, setItems] = useState<SiteNewsItem[]>(initialItems ?? []);
  const [stale, setStale] = useState(Boolean(initialStale));
  const [sourcesLabel, setSourcesLabel] = useState(
    initialSourcesLabel ?? "Headlines from major crypto outlets",
  );

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/news?limit=12&_=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (!mounted || !data || typeof data !== "object") return;
        if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
          setItems((data as { items: SiteNewsItem[] }).items);
          setStale(Boolean((data as { stale?: unknown }).stale));
          const label = (data as { sourcesLabel?: unknown }).sourcesLabel;
          if (typeof label === "string" && label.trim()) setSourcesLabel(label);
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

  const headlines = items.slice(0, maxItems);

  return (
    <section
      aria-labelledby="home-news-heading"
      className="ds-panel p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <SectionHeading id="home-news-heading" className="text-lg sm:text-xl">
          In the News
        </SectionHeading>
        {stale ? (
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">
            Feed delayed
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">{sourcesLabel}</p>

      <ul className="mt-4 flex flex-col gap-2.5 sm:gap-3">
        {headlines.length > 0 ? (
          headlines.map((item, index) => {
            const source = cleanDisplayText(item.source) || "News";
            const title = cleanDisplayText(item.title);
            return (
              <li
                key={item.id}
                className={index >= maxItemsMobile ? "hidden sm:block" : undefined}
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card block px-3 py-2.5 transition-[border-color,box-shadow] hover:border-teal-400/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/50 active:bg-white/[0.04] sm:px-3.5 sm:py-3"
                >
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex max-w-[70%] truncate rounded-full border border-teal-400/20 bg-teal-500/10 px-2 py-px text-[9px] font-semibold uppercase tracking-wider text-teal-200/90">
                      {source}
                    </span>
                    <span className="text-[10px] tabular-nums text-zinc-500">
                      {formatTimeAgo(item.publishedAt)}
                    </span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block overflow-hidden break-words text-[13px] font-semibold leading-snug text-zinc-100 sm:text-sm">
                    {title}
                  </span>
                </a>
              </li>
            );
          })
        ) : (
          <li className="rounded-lg border border-white/[0.08] px-3 py-3 text-sm text-zinc-500">
            No headlines available right now — try again shortly.
          </li>
        )}
      </ul>

      <Link
        href="/news"
        className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-teal-300/90 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/50 sm:min-h-10"
      >
        More headlines →
      </Link>
    </section>
  );
}
