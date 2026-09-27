"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SiteNewsItem } from "@/lib/site-news";
import { formatTimeAgo } from "@/lib/format-date";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import { matchNewsTickerChips } from "@/lib/news-tickers";

/** Poll inside the 15–30m server cache window so slot 1 can flip when feeds update. */
const POLL_MS = 10 * 60_000;
const HOME_NEWS_LIMIT = 8;

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

function HomeNewsCard({ item }: { item: SiteNewsItem }) {
  const source = cleanDisplayText(item.source) || "News";
  const title = cleanDisplayText(item.title);
  const excerpt = item.excerpt ? cleanDisplayText(item.excerpt) : "";
  const chips = useMemo(() => matchNewsTickerChips(item.title), [item.title]);
  const summaryHref = `/news/read?u=${encodeURIComponent(item.href)}`;

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3 transition-colors hover:border-teal-400/25 hover:bg-white/[0.04]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
        <span className="font-semibold uppercase tracking-wider text-teal-200/90">{source}</span>
        <span className="tabular-nums text-zinc-600">·</span>
        <span className="tabular-nums text-zinc-500">{formatTimeAgo(item.publishedAt)}</span>
      </div>

      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] font-semibold leading-snug text-zinc-50 hover:text-teal-100 sm:text-sm"
      >
        {title}
      </a>

      {excerpt ? (
        <p className="line-clamp-3 text-[12px] leading-relaxed text-zinc-400 sm:text-[13px]">
          {excerpt}
        </p>
      ) : null}

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Link
              key={chip.symbol}
              href={chip.href}
              className="inline-flex min-h-9 items-center rounded-full border border-teal-400/45 bg-teal-500/20 px-2.5 font-mono text-[11px] font-bold uppercase tracking-wide text-teal-100 transition-colors hover:border-teal-300/60 hover:bg-teal-500/30"
            >
              {chip.symbol}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-0.5 text-[11px] font-semibold">
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-300/90 hover:text-teal-200 hover:underline"
        >
          Read →
        </a>
        <Link
          href={summaryHref}
          className="text-zinc-500 underline-offset-2 hover:text-teal-200 hover:underline"
        >
          Summary
        </Link>
      </div>
    </article>
  );
}

/**
 * Home Market News — 8 text-only cards (RSS excerpt, no images).
 * Desktop: 2 columns. Mobile: stacked (home order places this first).
 */
export function HomeNewsFeed({
  initialItems,
  initialStale,
  initialSourcesLabel,
  maxItems = HOME_NEWS_LIMIT,
}: {
  initialItems?: SiteNewsItem[];
  initialStale?: boolean;
  initialSourcesLabel?: string;
  maxItems?: number;
  /** @deprecated Home always shows the same card count on all breakpoints. */
  maxItemsMobile?: number;
}) {
  const [items, setItems] = useState<SiteNewsItem[]>(() =>
    sortByPubDateDesc(initialItems ?? []),
  );
  const [stale, setStale] = useState(Boolean(initialStale));
  const [sourcesLabel, setSourcesLabel] = useState(
    initialSourcesLabel ?? "Headlines from major crypto outlets",
  );
  const pollLimit = Math.max(maxItems, HOME_NEWS_LIMIT);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/news?limit=${pollLimit}&_=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (!mounted || !data || typeof data !== "object") return;
        if ("items" in data && Array.isArray((data as { items: unknown }).items)) {
          const next = (data as { items: SiteNewsItem[] }).items;
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
  }, [pollLimit]);

  const shown = items.slice(0, maxItems);

  return (
    <section aria-labelledby="home-news-heading" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="home-news-heading"
            className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-zinc-50 sm:text-base"
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
              <path
                d="M16 6h2.5A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20H16"
                strokeLinecap="round"
              />
              <path d="M7 8h6M7 11h6M7 14h4" strokeLinecap="round" />
            </svg>
            Market News
          </h2>
          {stale ? (
            <p className="mt-0.5 text-[10px] text-amber-200/90">Feed delayed</p>
          ) : (
            <p className="mt-0.5 truncate text-[10px] text-zinc-500">{sourcesLabel}</p>
          )}
        </div>
        <Link
          href="/news"
          className="shrink-0 text-xs font-semibold text-teal-300/90 hover:text-teal-200 sm:text-[13px]"
        >
          All news →
        </Link>
      </div>

      {shown.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
          {shown.map((item) => (
            <li key={item.id}>
              <HomeNewsCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-4 text-sm text-zinc-500">
          No headlines available right now.
        </p>
      )}
    </section>
  );
}
