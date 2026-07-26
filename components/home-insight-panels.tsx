"use client";

import { useEffect, useState } from "react";
import {
  formatEventCountdown,
  impactBadgeClass,
  scoreCatalystImpact,
  type CatalystImpact,
} from "@/lib/catalyst-impact";
import { SectionHeading } from "@/components/section-heading";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { ds } from "@/lib/ui-classes";

type CatalystItem = {
  category: "Government" | "Policy" | "Listings";
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  eventAt?: string | null;
  impact?: CatalystImpact;
  countdown?: string | null;
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
  const impact = event.impact ?? scoreCatalystImpact(event);
  const countdown =
    event.countdown ??
    (event.eventAt ? formatEventCountdown(event.eventAt) : null);
  const high = impact === "High";
  const dateCls = accent === "listing" ? "text-[#d7ad82]" : "text-zinc-400";

  return (
    <a
      href={event.url}
      target={event.url.startsWith("http") ? "_blank" : undefined}
      rel={event.url.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`ds-card flex h-[6.25rem] flex-col justify-between px-3.5 py-3 transition-colors hover:border-[#d1a173]/40 ${
        high ? "ring-1 ring-amber-300/25" : ""
      }`}
    >
      <p className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-100">{event.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className={ds.badgeInfo}>{event.category}</span>
        <span className={`ds-badge ${impactBadgeClass(impact)}`}>{impact}</span>
        {countdown ? <span className={ds.badgeAccent}>in {countdown}</span> : null}
        <span className={ds.badgeInfo}>{event.source}</span>
        <span className={`font-mono text-[10px] ${dateCls}`}>
          {formatWhen(new Date(event.eventAt || event.publishedAt))}
        </span>
      </div>
    </a>
  );
}

function EmptySlot({ message }: { message?: string }) {
  return (
    <div className="flex h-[6.25rem] items-center rounded-xl border border-dashed border-white/10 bg-[rgba(12,14,20,0.35)] px-3.5 py-3">
      {message ? <p className="text-[11px] text-zinc-500">{message}</p> : null}
    </div>
  );
}

function CatalystColumn({
  title,
  accent,
  events,
  emptyMessage,
  loadingMessage,
  stillLoading,
}: {
  title: string;
  accent: "listing" | "policy";
  events: CatalystItem[];
  emptyMessage: string;
  loadingMessage: string;
  stillLoading: boolean;
}) {
  const slots = padSlots(events);
  const placeholder = stillLoading ? loadingMessage : emptyMessage;

  return (
    <section className={`${ds.card} flex h-full flex-col !p-3`}>
      <h3 className={`px-1 ${ds.label}`}>{title}</h3>
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
              const base: CatalystItem = {
                category: r.category,
                title: r.title,
                url: r.url,
                source: r.source,
                publishedAt: r.publishedAt,
                eventAt: typeof r.eventAt === "string" ? r.eventAt : null,
                countdown: typeof r.countdown === "string" ? r.countdown : null,
                impact:
                  r.impact === "High" || r.impact === "Medium" || r.impact === "Low"
                    ? r.impact
                    : scoreCatalystImpact({ category: r.category, title: r.title }),
              };
              return base;
            })
            .filter((v): v is CatalystItem => v != null),
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

  const listingEvents = catalysts
    .filter(isListingCatalyst)
    .sort((a, b) => {
      const rank = { High: 0, Medium: 1, Low: 2 } as const;
      const ia = a.impact ?? "Medium";
      const ib = b.impact ?? "Medium";
      return rank[ia] - rank[ib];
    })
    .slice(0, SLOT_COUNT);
  const policyEvents = catalysts
    .filter(isMajorPolicyCatalyst)
    .sort((a, b) => {
      const rank = { High: 0, Medium: 1, Low: 2 } as const;
      const ia = a.impact ?? "Medium";
      const ib = b.impact ?? "Medium";
      return rank[ia] - rank[ib];
    })
    .slice(0, SLOT_COUNT);
  const stillLoading = catalysts.length === 0 && catalystSourceProvider === "Loading";

  return (
    <section className="section-band border-b border-[#f4ddc3]/08 bg-[#0f131b]/60 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-4">
        <article className={ds.panelLg}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeading>Catalyst Calendar</SectionHeading>
            <span className={ds.badgeInfo}>Source: {catalystSourceProvider}</span>
          </div>
          <p className={ds.subtitle}>
            High-impact listings and major policy · impact scores are informational heuristics
          </p>
          <DisclaimerNote className="sm:pl-4" />
          <div className="mt-5 grid items-stretch gap-3 md:grid-cols-2">
            <CatalystColumn
              title="Exchange Listings"
              accent="listing"
              events={listingEvents}
              emptyMessage="No high-impact listings right now."
              loadingMessage="Loading listings…"
              stillLoading={stillLoading}
            />
            <CatalystColumn
              title="Major Policy"
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
