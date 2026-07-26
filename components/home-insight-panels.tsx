"use client";

import { useEffect, useState } from "react";

type CatalystItem = {
  category: "Government" | "Policy" | "Listings";
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};

const SLOT_COUNT = 4;

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

function padSlots(items: CatalystItem[]): (CatalystItem | null)[] {
  const slots: (CatalystItem | null)[] = items.slice(0, SLOT_COUNT);
  while (slots.length < SLOT_COUNT) slots.push(null);
  return slots;
}

function CatalystCard({
  event,
  accent,
}: {
  event: CatalystItem;
  accent: "listing" | "policy";
}) {
  const dateCls = accent === "listing" ? "text-[#d7ad82]" : "text-[#9ec8ff]";
  const chipCls =
    accent === "listing"
      ? "border-[#d7ad82]/35 bg-[#d7ad82]/10 text-[#d7ad82]"
      : "border-[#9ec8ff]/35 bg-[#9ec8ff]/10 text-[#9ec8ff]";

  return (
    <a
      href={event.url}
      target={event.url.startsWith("http") ? "_blank" : undefined}
      rel={event.url.startsWith("http") ? "noopener noreferrer" : undefined}
      className="glass-card flex h-[5.75rem] flex-col justify-between rounded-lg px-3.5 py-3 transition-colors hover:border-[#d1a173]/40"
    >
      <p className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-100">{event.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className={`rounded border px-1.5 py-0.5 font-semibold ${chipCls}`}>
          {event.category}
        </span>
        <span className="rounded border border-white/15 px-1.5 py-0.5 text-zinc-300">
          {event.source}
        </span>
        <span className={`font-mono ${dateCls}`}>{formatWhen(new Date(event.publishedAt))}</span>
      </div>
    </a>
  );
}

function EmptySlot({ message }: { message?: string }) {
  return (
    <div className="flex h-[5.75rem] items-center rounded-lg border border-dashed border-white/10 bg-[rgba(12,14,20,0.35)] px-3.5 py-3">
      {message ? <p className="text-[11px] text-zinc-500">{message}</p> : null}
    </div>
  );
}

function CatalystColumn({
  title,
  titleClass,
  accent,
  events,
  emptyMessage,
  loadingMessage,
  stillLoading,
}: {
  title: string;
  titleClass: string;
  accent: "listing" | "policy";
  events: CatalystItem[];
  emptyMessage: string;
  loadingMessage: string;
  stillLoading: boolean;
}) {
  const slots = padSlots(events);
  const placeholder = stillLoading ? loadingMessage : emptyMessage;

  return (
    <section className="flex h-full flex-col rounded-lg border border-[#f4ddc3]/12 bg-[rgba(20,22,30,0.5)] p-3">
      <h3 className={`px-1 text-[11px] font-semibold uppercase tracking-wide ${titleClass}`}>
        {title}
      </h3>
      <div className="mt-2 grid flex-1 grid-rows-4 gap-2.5">
        {slots.map((event, i) =>
          event ? (
            <CatalystCard
              key={`${event.title}-${event.publishedAt}-${accent}-${i}`}
              event={event}
              accent={accent}
            />
          ) : (
            <EmptySlot
              key={`${accent}-empty-${i}`}
              message={events.length === 0 && i === 0 ? placeholder : undefined}
            />
          ),
        )}
      </div>
    </section>
  );
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

  const listingEvents = catalysts.filter(isListingCatalyst).slice(0, SLOT_COUNT);
  const policyEvents = catalysts.filter(isMajorPolicyCatalyst).slice(0, SLOT_COUNT);
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
          <div className="mt-4 grid items-stretch gap-3 md:grid-cols-2">
            <CatalystColumn
              title="Exchange Listings"
              titleClass="text-[#d7ad82]"
              accent="listing"
              events={listingEvents}
              emptyMessage="No high-impact listings right now."
              loadingMessage="Loading listings…"
              stillLoading={stillLoading}
            />
            <CatalystColumn
              title="Major Policy"
              titleClass="text-[#9ec8ff]"
              accent="policy"
              events={policyEvents}
              emptyMessage="No major policy catalysts right now."
              loadingMessage="Loading policy…"
              stillLoading={stillLoading}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
