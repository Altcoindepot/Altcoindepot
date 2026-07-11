"use client";

import { useEffect, useState } from "react";
import type { CoinNewsItem } from "@/lib/coin-news";
import { formatNewsTimestampEst } from "@/lib/format-date";
import { readResponseJsonSafely } from "@/lib/read-response-json";

/** Poll interval; keep in sync with `NEWS_TTL_MS` in `lib/coin-news.ts` so each tick can show new headlines. */
const POLL_MS = 45_000;

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

function sourceBadgeClass(source: string) {
  const s = source.toLowerCase();
  if (s.includes("coindesk")) return "border-[#f0b90b]/40 bg-[#f0b90b]/10 text-[#f0b90b]";
  if (s.includes("cointelegraph")) return "border-[#ffcc33]/40 bg-[#ffcc33]/10 text-[#ffcc33]";
  if (s.includes("decrypt")) return "border-[#7dd3fc]/40 bg-[#7dd3fc]/10 text-[#7dd3fc]";
  if (s.includes("the block")) return "border-zinc-300/40 bg-zinc-300/10 text-zinc-200";
  if (s.includes("bitcoin magazine")) return "border-[#f97316]/40 bg-[#f97316]/10 text-[#fdba74]";
  return "border-[#a855f7]/35 bg-[#a855f7]/10 text-[#d8b4fe]";
}

function safeThumb(url: string | undefined) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
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

  return (
    <section
      aria-labelledby="home-news-heading"
      className="glass-panel rounded-xl p-3"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 id="home-news-heading" className="text-sm font-semibold text-zinc-100">
            In the News
          </h2>
          {stale ? (
            <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200">
              Feed delayed
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Live crypto headlines, newest first. Timestamps are US Eastern (EST/EDT). Auto-refreshes
          about every 45s.
        </p>
        <div className="mt-3 space-y-2">
          {items.length > 0 ? (
            items.map((item) => (
              <article
                key={item.id}
                className="glass-card rounded-lg p-2.5"
              >
                {safeThumb(item.thumbnail) ? (
                  <div className="mb-2 overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a]">
                    <img
                      src={safeThumb(item.thumbnail) ?? ""}
                      alt=""
                      loading="lazy"
                      className="h-24 w-full object-cover"
                    />
                  </div>
                ) : null}
                {(() => {
                  const source = cleanDisplayText(item.source);
                  return (
                    <span
                      className={`mb-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${sourceBadgeClass(source)}`}
                    >
                      {source || "News"}
                    </span>
                  );
                })()}
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-xs font-semibold text-zinc-100 underline-offset-2 hover:text-[#d7ad82] hover:underline"
                >
                  {cleanDisplayText(item.title)}
                </a>
                <p className="mt-1 line-clamp-3 text-[11px] text-zinc-400">
                  {cleanDisplayText(item.summary) || "Read the full article."}
                </p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {formatNewsTimestampEst(item.publishedAt)}
                </p>
              </article>
            ))
          ) : (
            <div className="glass-card rounded-lg p-3 text-xs text-zinc-500">
              No crypto headlines available at the moment.
            </div>
          )}
        </div>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-xs font-medium text-[#d7ad82] underline-offset-2 hover:underline"
          >
            Open full crypto news feed
          </a>
        ) : null}
      </div>
    </section>
  );
}
