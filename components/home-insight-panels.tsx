"use client";

import { useEffect, useState } from "react";

type CatalystItem = {
  category: "Government" | "Policy" | "Listings";
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};

function formatWhen(ts: Date) {
  return ts.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const LISTING_SIGNAL =
  /\b(listing|will list|lists|listed|delist|delisting|adds support|new listing)\b/i;
const MAJOR_POLICY_SIGNAL =
  /\b(clarity act|sec\b|cftc|mica|etf|lawsuit|hearing|ban|approval|regulation|bill|fomc|federal reserve|fed\b|government|congress|treasury)\b/i;

function isListingCatalyst(item: CatalystItem) {
  return item.category === "Listings" || LISTING_SIGNAL.test(item.title);
}

function isMajorPolicyCatalyst(item: CatalystItem) {
  return item.category !== "Listings" && MAJOR_POLICY_SIGNAL.test(item.title);
}

export function HomeInsightPanels() {
  const [catalysts, setCatalysts] = useState<CatalystItem[]>([]);
  const [catalystSourceProvider, setCatalystSourceProvider] = useState("Loading");

  useEffect(() => {
    let mounted = true;
    async function refreshCatalysts() {
      try {
        const res = await fetch(`/api/catalysts?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!mounted || !data || typeof data !== "object") return;
        const items = (data as { items?: unknown[] }).items;
        const sourceProvider = (data as { sourceProvider?: unknown }).sourceProvider;
        if (!Array.isArray(items)) return;
        if (typeof sourceProvider === "string" && sourceProvider) {
          setCatalystSourceProvider(sourceProvider);
        }
        setCatalysts(
          items
            .map((item) => {
              const r = item as Partial<CatalystItem>;
              if (
                typeof r.title !== "string" ||
                typeof r.url !== "string" ||
                typeof r.source !== "string" ||
                typeof r.publishedAt !== "string" ||
                (r.category !== "Government" && r.category !== "Policy" && r.category !== "Listings")
              ) {
                return null;
              }
              return r as CatalystItem;
            })
            .filter((v): v is CatalystItem => Boolean(v)),
        );
      } catch {
        // keep previous
      }
    }
    void refreshCatalysts();
    const id = window.setInterval(() => void refreshCatalysts(), 300000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const listingEvents = catalysts.filter(isListingCatalyst).slice(0, 4);
  const policyEvents = catalysts.filter(isMajorPolicyCatalyst).slice(0, 4);
  const stillLoading = catalysts.length === 0 && catalystSourceProvider === "Loading";

  return (
    <section className="border-b border-[#f4ddc3]/10 bg-[#0f131b]/60 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-4">
        <article className="glass-panel rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-3 text-base font-extrabold tracking-tight text-zinc-100 sm:text-lg">
              <span className="hidden h-6 w-1 shrink-0 rounded-full bg-[#d1a173]/80 sm:block" aria-hidden />
              Catalyst Calendar
            </h2>
            <span className="rounded border border-[#f4ddc3]/15 bg-[rgba(20,22,30,0.6)] px-1.5 py-0.5 text-[10px] text-zinc-300">
              Source: {catalystSourceProvider}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400 sm:pl-4">
            High-impact only: exchange listings/delistings and major policy. General headlines stay in In
            the News.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <section className="rounded-lg border border-[#f4ddc3]/12 bg-[rgba(20,22,30,0.5)] p-3">
              <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#d7ad82]">
                Exchange Listings
              </h3>
              <div className="mt-2 space-y-2.5">
                {listingEvents.length > 0 ? (
                  listingEvents.map((event) => (
                    <a
                      key={`${event.title}-${event.publishedAt}-listing`}
                      href={event.url}
                      target={event.url.startsWith("http") ? "_blank" : undefined}
                      rel={event.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="glass-card block rounded-lg px-3.5 py-3 transition-colors hover:border-[#d1a173]/40"
                    >
                      <p className="line-clamp-2 text-xs font-semibold text-zinc-100">{event.title}</p>
                      <p className="font-mono text-[11px] text-[#d7ad82]">
                        {formatWhen(new Date(event.publishedAt))}
                      </p>
                      <p className="text-[11px] text-zinc-400">{event.source}</p>
                    </a>
                  ))
                ) : (
                  <p className="px-1 py-2 text-[11px] text-zinc-500">
                    {stillLoading ? "Loading listings…" : "No high-impact listings right now."}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-[#f4ddc3]/12 bg-[rgba(20,22,30,0.5)] p-3">
              <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ec8ff]">
                Major Policy
              </h3>
              <div className="mt-2 space-y-2.5">
                {policyEvents.length > 0 ? (
                  policyEvents.map((event) => (
                    <a
                      key={`${event.title}-${event.publishedAt}-reg`}
                      href={event.url}
                      target={event.url.startsWith("http") ? "_blank" : undefined}
                      rel={event.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="glass-card block rounded-lg px-3.5 py-3 transition-colors hover:border-[#d1a173]/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-semibold text-zinc-100">{event.title}</p>
                        <span className="shrink-0 rounded border border-red-400/35 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-200">
                          High
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded border border-[#9ec8ff]/35 bg-[#9ec8ff]/10 px-1.5 py-0.5 text-[#9ec8ff]">
                          {event.category}
                        </span>
                        <span className="rounded border border-white/15 px-1.5 py-0.5 text-zinc-300">
                          {event.source}
                        </span>
                        <span className="font-mono text-[#9ec8ff]">
                          {formatWhen(new Date(event.publishedAt))}
                        </span>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="px-1 py-2 text-[11px] text-zinc-500">
                    {stillLoading ? "Loading policy…" : "No major policy catalysts right now."}
                  </p>
                )}
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}
