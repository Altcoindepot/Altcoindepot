"use client";

import { useEffect, useState } from "react";
import type { XFeedItem } from "@/lib/x-feed";
import { readResponseJsonSafely } from "@/lib/read-response-json";

const POLL_MS = 60_000;

function formatUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  } catch {
    return "—";
  }
}

export function CoinXFeed({
  coinId,
  initialTweets,
  twitterHandle,
}: {
  coinId: string;
  initialTweets: XFeedItem[];
  twitterHandle?: string;
}) {
  const [tweets, setTweets] = useState<XFeedItem[]>(initialTweets);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/coin-tweets?id=${encodeURIComponent(coinId)}`);
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (
          mounted &&
          data &&
          typeof data === "object" &&
          "tweets" in data &&
          Array.isArray((data as { tweets: unknown }).tweets)
        ) {
          setTweets((data as { tweets: XFeedItem[] }).tweets);
          setStale(Boolean((data as { stale?: unknown }).stale));
        }
      } catch {
        // keep last known good
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

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-[#111111]">
      {stale ? (
        <p className="border-b border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[10px] text-amber-200">
          Feed delayed. Showing cached posts.
        </p>
      ) : null}
      {tweets.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {tweets.slice(0, 5).map((tweet) => (
            <li key={tweet.id}>
              <a
                href={tweet.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <p className="text-xs font-medium text-zinc-100">{tweet.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{tweet.summary}</p>
                <time dateTime={tweet.publishedAt} className="mt-1 block text-[10px] text-zinc-500">
                  {formatUtc(tweet.publishedAt)} UTC
                </time>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {twitterHandle ? (
            <div className="p-3">
              <p className="text-xs text-zinc-500">
                Live posts are temporarily unavailable in this environment.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={`https://x.com/${twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
                >
                  Open @{twitterHandle} on X
                </a>
                <a
                  href={`https://x.com/search?q=from%3A${encodeURIComponent(
                    twitterHandle,
                  )}&f=live`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
                >
                  View latest posts
                </a>
              </div>
            </div>
          ) : (
            <p className="px-3 py-4 text-xs text-zinc-500">
              No recent posts available for this coin right now.
            </p>
          )}
        </>
      )}
    </div>
  );
}
