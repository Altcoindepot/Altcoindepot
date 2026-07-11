"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarkets } from "@/components/markets-provider";

type SentimentSnapshot = {
  fearGreedValue: number;
  fearGreedLabel: string;
  fearGreedTimeUntilUpdateSec: number;
};

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

function eventImpact(title: string) {
  const t = title.toLowerCase();
  if (/\b(fomc|fed|sec|etf|approval|ban|lawsuit|clarity act|regulation)\b/.test(t)) {
    return "High";
  }
  if (/\b(listing|delisting|adds support|launch|mainnet|vote)\b/.test(t)) {
    return "Medium";
  }
  return "Low";
}

function impactClass(impact: string) {
  if (impact === "High") return "border-red-400/35 bg-red-500/15 text-red-200";
  if (impact === "Medium") return "border-amber-400/35 bg-amber-500/15 text-amber-200";
  return "border-zinc-400/25 bg-zinc-500/10 text-zinc-300";
}

function nextUtcHour(from = new Date()) {
  const d = new Date(from);
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours(d.getUTCHours() + 1);
  return d;
}

function nextUtcDayBoundary(from = new Date()) {
  const d = new Date(from);
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

export function HomeInsightPanels() {
  const { topMarkets } = useMarkets();
  const [sentiment, setSentiment] = useState<SentimentSnapshot>({
    fearGreedValue: 50,
    fearGreedLabel: "Neutral",
    fearGreedTimeUntilUpdateSec: 0,
  });
  const [catalysts, setCatalysts] = useState<CatalystItem[]>([]);
  const [catalystSourceProvider, setCatalystSourceProvider] = useState("Loading");

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(`/api/market-sentiment?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!mounted || !data || typeof data !== "object") return;
        const fg = (data as { fearGreed?: Record<string, unknown> }).fearGreed ?? {};
        const fearGreedValue = Number(fg.value ?? 50);
        const fearGreedLabel = typeof fg.label === "string" ? fg.label : "Neutral";
        const fearGreedTimeUntilUpdateSec = Number(fg.timeUntilUpdateSec ?? 0);
        setSentiment({
          fearGreedValue: Number.isFinite(fearGreedValue) ? fearGreedValue : 50,
          fearGreedLabel,
          fearGreedTimeUntilUpdateSec: Number.isFinite(fearGreedTimeUntilUpdateSec)
            ? fearGreedTimeUntilUpdateSec
            : 0,
        });
      } catch {
        // keep previous snapshot
      }
    }
    void refresh();
    const id = window.setInterval(() => void refresh(), 120000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

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

  const fallbackEvents = [
    {
      category: "Government" as const,
      title: "Next macro/policy catalysts loading...",
      source: "Catalyst feed",
      url: "#",
      publishedAt: new Date().toISOString(),
    },
  ];
  const events = catalysts.length > 0 ? catalysts : fallbackEvents;
  const listingEvents = events.filter((e) => e.category === "Listings");
  const regulatoryEvents = events.filter((e) => e.category !== "Listings");

  return (
    <section className="border-b border-[#f4ddc3]/15 bg-[#0f131b]/60 px-4 py-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-3">
        <article className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">Catalyst Calendar</h2>
            <span className="rounded border border-[#f4ddc3]/25 bg-[rgba(20,22,30,0.6)] px-1.5 py-0.5 text-[10px] text-zinc-300">
              Source: {catalystSourceProvider}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Prioritized: exchange token listings/delistings, then major policy/government updates.
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <section className="rounded-lg border border-[#f4ddc3]/18 bg-[rgba(20,22,30,0.5)] p-2">
              <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#d7ad82]">
                Listings Watch
              </h3>
              <div className="mt-1.5 space-y-2">
                {(listingEvents.length > 0 ? listingEvents : events.slice(0, 3)).slice(0, 4).map((event) => (
                  <a
                    key={`${event.title}-${event.publishedAt}-listing`}
                    href={event.url}
                    target={event.url.startsWith("http") ? "_blank" : undefined}
                    rel={event.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="glass-card block rounded-lg px-2.5 py-2 transition-colors hover:border-[#d1a173]/45"
                  >
                    <p className="line-clamp-2 text-xs font-semibold text-zinc-100">{event.title}</p>
                    <p className="font-mono text-[11px] text-[#d7ad82]">
                      {formatWhen(new Date(event.publishedAt))}
                    </p>
                    <p className="text-[11px] text-zinc-400">{event.source}</p>
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#f4ddc3]/18 bg-[rgba(20,22,30,0.5)] p-2">
              <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ec8ff]">
                CoinMarketCal Style Events
              </h3>
              <div className="mt-1.5 space-y-2">
                {(regulatoryEvents.length > 0 ? regulatoryEvents : events.slice(0, 3))
                  .slice(0, 4)
                  .map((event) => (
                    <a
                      key={`${event.title}-${event.publishedAt}-reg`}
                      href={event.url}
                      target={event.url.startsWith("http") ? "_blank" : undefined}
                      rel={event.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="glass-card block rounded-lg px-2.5 py-2 transition-colors hover:border-[#d1a173]/45"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-semibold text-zinc-100">{event.title}</p>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${impactClass(
                            eventImpact(event.title),
                          )}`}
                        >
                          {eventImpact(event.title)}
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
                  ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}
