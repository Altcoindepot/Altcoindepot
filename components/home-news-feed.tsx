"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SiteNewsItem } from "@/lib/site-news";
import { formatTimeAgo } from "@/lib/format-date";
import { readResponseJsonSafely } from "@/lib/read-response-json";

/** Poll inside the 15–30m server cache window so slot 1 can flip when feeds update. */
const POLL_MS = 10 * 60_000;

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

function sortByPubDateDesc(items: SiteNewsItem[]): SiteNewsItem[] {
  return [...items].sort((a, b) => {
    const tb = Date.parse(b.publishedAt);
    const ta = Date.parse(a.publishedAt);
    const vb = Number.isFinite(tb) ? tb : 0;
    const va = Number.isFinite(ta) ? ta : 0;
    if (vb !== va) return vb - va;
    return a.href.localeCompare(b.href);
  });
}

/**
 * Market News — desktop horizontal strip (mock composition);
 * mobile keeps a short stacked list. Always newest-first by pubDate.
 */
export function HomeNewsFeed({
  initialItems,
  initialStale,
  initialSourcesLabel,
  maxItems = 4,
  maxItemsMobile = 4,
}: {
  initialItems?: SiteNewsItem[];
  initialStale?: boolean;
  initialSourcesLabel?: string;
  maxItems?: number;
  maxItemsMobile?: number;
}) {
  const [items, setItems] = useState<SiteNewsItem[]>(() =>
    sortByPubDateDesc(initialItems ?? []),
  );
  const [stale, setStale] = useState(Boolean(initialStale));
  const [sourcesLabel, setSourcesLabel] = useState(
    initialSourcesLabel ?? "Headlines from major crypto outlets",
  );

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/news?limit=4&_=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (!mounted || !data || typeof data !== "object") return;
        if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
          const next = (data as { items: SiteNewsItem[] }).items;
          // Never wipe a good strip with an empty/error payload.
          if (next.length === 0) return;
          setItems(sortByPubDateDesc(next));
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

  const desktop = items.slice(0, maxItems);
  const mobile = items.slice(0, maxItemsMobile);

  return (
    <section aria-labelledby="home-news-heading" className="ds-panel overflow-hidden p-0">
      {/* Desktop: single horizontal strip */}
      <div className="hidden items-stretch lg:flex">
        <div className="flex shrink-0 flex-col justify-center border-r border-white/10 px-4 py-3">
          <h2
            id="home-news-heading"
            className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-zinc-50"
          >
            <svg
              className="size-3.5 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H16v14.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5V5.5Z" />
              <path d="M16 6h2.5A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20H16" strokeLinecap="round" />
              <path d="M7 8h6M7 11h6M7 14h4" strokeLinecap="round" />
            </svg>
            Market News
          </h2>
          {stale ? (
            <span className="mt-1 text-[10px] text-amber-200/90">Feed delayed</span>
          ) : (
            <span className="mt-1 max-w-[9rem] truncate text-[10px] text-zinc-500">
              {sourcesLabel}
            </span>
          )}
        </div>

        <ul className="flex min-w-0 flex-1 divide-x divide-white/10">
          {desktop.length > 0 ? (
            desktop.map((item) => {
              const source = cleanDisplayText(item.source) || "News";
              const title = cleanDisplayText(item.title);
              return (
                <li key={item.id} className="min-w-0 flex-1">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full flex-col gap-1 px-3 py-3 transition-colors hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-400/50"
                  >
                    <span className="flex items-center gap-1.5 text-[10px]">
                      <span className="size-1.5 shrink-0 rounded-full bg-teal-400" aria-hidden />
                      <span className="truncate font-semibold uppercase tracking-wider text-teal-200/90">
                        {source}
                      </span>
                      <span className="shrink-0 tabular-nums text-zinc-600">·</span>
                      <span className="shrink-0 tabular-nums text-zinc-500">
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-[12px] font-medium leading-snug text-zinc-100">
                      {title}
                    </span>
                  </a>
                </li>
              );
            })
          ) : (
            <li className="flex flex-1 items-center px-4 text-sm text-zinc-500">
              No headlines available right now.
            </li>
          )}
        </ul>

        <Link
          href="/news"
          className="flex shrink-0 items-center justify-center border-l border-white/10 px-3 text-teal-300/90 hover:bg-white/[0.03] hover:text-teal-200"
          aria-label="More headlines"
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-white/15 text-lg">
            →
          </span>
        </Link>
      </div>

      {/* Mobile: short stack */}
      <div className="p-3 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-zinc-50">Market News</h2>
          <Link href="/news" className="text-[11px] font-semibold text-teal-300/90">
            More →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {mobile.length > 0 ? (
            mobile.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2.5 active:bg-white/[0.03]"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-200/80">
                    {cleanDisplayText(item.source) || "News"}
                    <span className="ml-2 font-normal normal-case tracking-normal text-zinc-500">
                      {formatTimeAgo(item.publishedAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[13px] font-medium leading-snug text-zinc-100">
                    {cleanDisplayText(item.title)}
                  </span>
                </a>
              </li>
            ))
          ) : (
            <li className="py-3 text-sm text-zinc-500">No headlines right now.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
