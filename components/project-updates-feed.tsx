"use client";

import { useEffect, useState } from "react";
import { PROJECT_UPDATES, type ProjectUpdate } from "@/lib/project-updates";
import { readResponseJsonSafely } from "@/lib/read-response-json";

const FEED_POLL_MS = 60_000;

function formatRssDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ProjectUpdatesFeed() {
  const [updates, setUpdates] = useState<ProjectUpdate[]>(PROJECT_UPDATES);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/project-feed");
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (
          mounted &&
          data &&
          typeof data === "object" &&
          "updates" in data &&
          Array.isArray((data as { updates: unknown }).updates)
        ) {
          setUpdates((data as { updates: ProjectUpdate[] }).updates);
        }
      } catch {
        // keep current feed snapshot
      }
    }
    void load().catch(() => {});
    const id = window.setInterval(() => {
      void load().catch(() => {});
    }, FEED_POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <aside
      aria-labelledby="updates-feed-heading"
      className="rounded-xl border border-white/10 bg-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <div className="border-b border-white/10 px-4 py-3">
        <h2
          id="updates-feed-heading"
          className="text-sm font-semibold uppercase tracking-wider text-zinc-400"
        >
          Project feed
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          RSS-style updates · follow live on{" "}
          <a
            href="https://x.com/altcoindepot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-metallic font-medium underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff9f]"
          >
            X
          </a>
        </p>
      </div>
      <div className="max-h-[min(420px,55vh)] overflow-y-auto overscroll-contain px-1 py-2 [scrollbar-color:rgba(63,63,70,0.8)_transparent] [scrollbar-width:thin] sm:max-h-[min(520px,60vh)]">
        <ul className="divide-y divide-white/[0.06]">
          {updates.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-3 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a855f7]"
              >
                <time
                  dateTime={item.publishedAt}
                  className="font-mono text-[10px] text-zinc-500"
                >
                  {formatRssDate(item.publishedAt)} UTC
                </time>
                <p className="mt-1 text-sm font-medium text-zinc-100">{item.title}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-500">
                  {item.summary}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
