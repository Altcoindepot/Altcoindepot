"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { YoutubeFeedItem } from "@/lib/youtube-feed";
import { formatShortMonthDay } from "@/lib/format-date";
import { readResponseJsonSafely } from "@/lib/read-response-json";

const POLL_MS = 120_000;

export function CoinYoutubeFeed({
  coinId,
  initialVideos,
  initialStale,
  initialSourceHint,
}: {
  coinId: string;
  initialVideos: YoutubeFeedItem[];
  initialStale?: boolean;
  initialSourceHint?: string | null;
}) {
  const [videos, setVideos] = useState<YoutubeFeedItem[]>(initialVideos);
  const [stale, setStale] = useState(Boolean(initialStale));
  const [hint, setHint] = useState(initialSourceHint ?? "");

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(
          `/api/coin-youtube?id=${encodeURIComponent(coinId)}&_=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (!mounted || !data || typeof data !== "object") return;
        const v = (data as { videos?: unknown }).videos;
        if (Array.isArray(v)) {
          setVideos(v as YoutubeFeedItem[]);
          setStale(Boolean((data as { stale?: unknown }).stale));
          const h = (data as { sourceHint?: unknown }).sourceHint;
          if (typeof h === "string") setHint(h);
        }
      } catch {
        /* keep snapshot */
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
  }, [coinId]);

  const hasVideos = videos.length > 0;

  return (
    <section
      aria-labelledby="coin-youtube-feed"
      className="rounded-xl border border-white/10 bg-[#101217] p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="coin-youtube-feed" className="text-sm font-semibold text-zinc-100">
          YouTube <span className="font-normal text-zinc-500">· latest 5</span>
        </h2>
        {stale ? (
          <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200">
            Delayed
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-[10px] leading-snug text-zinc-500">{hint}</p> : null}
      <div className="mt-3 space-y-2">
        {hasVideos ? (
          videos.slice(0, 5).map((v) => (
            <a
              key={v.id}
              href={v.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2 rounded-lg border border-white/10 bg-[#0d0f14] p-2 transition-colors hover:border-red-500/40"
            >
              {v.thumbnailUrl ? (
                <Image
                  src={v.thumbnailUrl}
                  alt=""
                  width={110}
                  height={62}
                  sizes="(max-width:640px) 50px,110px"
                  className="h-[50px] w-[50px] shrink-0 rounded-md object-cover sm:h-[62px] sm:w-[110px]"
                />
              ) : (
                <div className="flex size-[50px] shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] text-zinc-500 sm:h-[62px] sm:w-[110px]">
                  ▶
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-semibold text-zinc-100">{v.title}</p>
                {v.summary ? (
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">{v.summary}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-zinc-600">{formatShortMonthDay(v.publishedAt)}</p>
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-2.5 py-2">
            <p className="text-[11px] text-zinc-400">
              No recent videos found. Link a YouTube channel on the project website (CoinGecko), or set{" "}
              <span className="font-mono text-zinc-300">YOUTUBE_API_KEY</span> to include title matches.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
