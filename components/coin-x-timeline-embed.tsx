"use client";

import { useEffect, useRef, useState } from "react";
import { ds } from "@/lib/ui-classes";

const SCRIPT_ID = "twitter-wjs";
const EMBED_HEIGHT = 500;

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (el?: HTMLElement | null) => void;
      };
    };
  }
}

function loadTwitterWidgetsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.twttr?.widgets?.load) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve) => {
      if (window.twttr?.widgets?.load) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      // Script may already be loaded without firing again
      window.setTimeout(() => resolve(), 1500);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load X widgets"));
    document.body.appendChild(script);
  });
}

function sanitizeHandle(raw: string): string | null {
  const cleaned = raw.trim().replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "");
  return cleaned.length >= 1 && cleaned.length <= 15 ? cleaned : null;
}

/**
 * Official X profile timeline embed. Loads widgets.js once, and only when visible.
 * Falls back to a quiet “View on X” link if the embed fails.
 */
export function CoinXTimelineEmbed({ handle }: { handle: string }) {
  const clean = sanitizeHandle(handle);
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!clean || !rootRef.current) return;
    const node = rootRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [clean]);

  useEffect(() => {
    if (!shouldLoad || !clean || failed) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      // Widgets inject an iframe; if none appears, show a quiet fallback (adblock / CSP / etc.).
      if (rootRef.current && !rootRef.current.querySelector("iframe")) {
        setFailed(true);
      }
    }, 12_000);

    void (async () => {
      try {
        await loadTwitterWidgetsScript();
        if (cancelled) return;
        window.twttr?.widgets?.load(rootRef.current);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [shouldLoad, clean, failed]);

  if (!clean) return null;

  const profileUrl = `https://x.com/${clean}`;

  return (
    <section id="coin-x-feed" aria-labelledby="coin-x-feed-heading" className={`mt-6 ${ds.panel}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="coin-x-feed-heading" className="text-base font-semibold text-zinc-100 sm:text-lg">
            Latest from X
          </h2>
          <p className={ds.subtitle}>Official project updates</p>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={ds.btnSecondary}
        >
          View on X
        </a>
      </div>

      <div ref={rootRef} className="mt-4 overflow-hidden rounded-xl border border-[#f4ddc3]/12">
        {failed ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">Timeline couldn’t load in this browser.</p>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-[#d7ad82] underline-offset-2 hover:underline"
            >
              Open @{clean} on X
            </a>
          </div>
        ) : (
          <a
            className="twitter-timeline"
            href={profileUrl}
            data-theme="dark"
            data-height={String(EMBED_HEIGHT)}
            data-chrome="noheader nofooter noborders transparent"
          >
            Posts by @{clean}
          </a>
        )}
      </div>
      <p className={ds.disclaimer}>
        Embedded timeline from @{clean} · content owned by the project on X
      </p>
    </section>
  );
}
