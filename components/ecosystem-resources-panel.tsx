import Link from "next/link";
import { ds } from "@/lib/ui-classes";
import { WikiCoinLogo } from "@/components/wiki-coin-logo";
import { WikiChange24h } from "@/components/wiki-change-24h";
import {
  allWikiEntries,
  resolveTokenResources,
  wikiDisplayName,
  wikiEntriesForNarrative,
  wikiSymbol,
  type TokenResources,
  type WikiFallbackLinks,
} from "@/lib/ecosystem-wiki";
import type { WikiChange24hMap } from "@/lib/ecosystem-quotes";

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5 11 11 5M6.5 5H11v4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const RESOURCE_META: Array<{
  key: keyof TokenResources;
  tag: string;
  label: string;
}> = [
  { key: "portal", tag: "WEB", label: "Official Project Portal" },
  { key: "auditExplorer", tag: "SCAN", label: "Smart Contract Audits" },
  { key: "docs", tag: "DOCS", label: "Technical Architecture" },
  { key: "community", tag: "SOCIAL", label: "Community Network Node" },
];

function ResourceLinks({ resources }: { resources: TokenResources }) {
  const items = RESOURCE_META.filter((row) => {
    const href = resources[row.key];
    return typeof href === "string" && href.length > 0;
  });
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((row) => {
        const href = resources[row.key]!;
        return (
          <li key={row.key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0c0e14] px-3 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
            >
              <span className="min-w-0">
                <span className="mr-2 inline-flex rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-zinc-500">
                  {row.tag}
                </span>
                <span className="text-sm font-medium text-zinc-200">{row.label}</span>
              </span>
              <ArrowUpRight className="size-3.5 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function EcosystemResourcesPanel({
  coinId,
  title,
  fallback,
  narrativeSlug,
  entries: entriesProp,
  hideHeading = false,
  change24h = {},
  className = "",
}: {
  coinId?: string;
  title?: string;
  fallback?: WikiFallbackLinks;
  narrativeSlug?: string;
  entries?: Array<{ id: string; resources: TokenResources }>;
  hideHeading?: boolean;
  change24h?: WikiChange24hMap;
  className?: string;
}) {
  if (coinId) {
    const resources = resolveTokenResources(coinId, fallback);
    if (!resources) return null;
    return (
      <section
        aria-labelledby="ecosystem-wiki-heading"
        className={`${ds.panelLg} ${className}`.trim()}
      >
        {hideHeading ? (
          <h2 id="ecosystem-wiki-heading" className="sr-only">
            {title ?? "Ecosystem & Developer Resources"}
          </h2>
        ) : (
          <>
            <h2 id="ecosystem-wiki-heading" className="text-base font-semibold text-zinc-100">
              {title ?? "Ecosystem & Developer Resources"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Verified off-chain portals for {wikiDisplayName(coinId)}. Outbound links open in a new
              tab.
            </p>
          </>
        )}
        <div className={`${hideHeading ? "" : "mt-4 border-t border-white/10 pt-4"}`}>
          <ResourceLinks resources={resources} />
        </div>
      </section>
    );
  }

  const entries =
    entriesProp ??
    (narrativeSlug ? wikiEntriesForNarrative(narrativeSlug) : allWikiEntries());
  if (entries.length === 0) return null;

  return (
    <section
      aria-labelledby="ecosystem-wiki-heading"
      className={`${hideHeading ? className : `${ds.panelLg} ${className}`.trim()}`}
    >
      {hideHeading ? (
        <h2 id="ecosystem-wiki-heading" className="sr-only">
          {title ?? "Ecosystem & Developer Resources"}
        </h2>
      ) : (
        <>
          <h2 id="ecosystem-wiki-heading" className="text-base font-semibold text-zinc-100">
            {title ?? "Ecosystem & Developer Resources"}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Curated documentation and explorers for core assets — served from a local wiki map, not a
            live API.
          </p>
        </>
      )}
      <div className={`${hideHeading ? "" : "mt-5"} grid grid-cols-1 gap-4 md:grid-cols-2`}>
        {entries.map(({ id, resources }) => (
          <article key={id} className="rounded-xl border border-white/10 bg-[#0c0e14] p-4">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex min-w-0 items-center gap-3">
                <WikiCoinLogo id={id} size={40} />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-zinc-100">
                    {wikiDisplayName(id)}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] tracking-wider text-zinc-500">
                    <span>{wikiSymbol(id)}</span>
                    <WikiChange24h value={change24h[id]} className="text-xs font-semibold" />
                    <span className="text-zinc-600">24h</span>
                  </p>
                </div>
              </div>
              <Link
                href={`/coin/${encodeURIComponent(id)}`}
                className="shrink-0 text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline"
              >
                Profile →
              </Link>
            </div>
            <ResourceLinks resources={resources} />
          </article>
        ))}
      </div>
    </section>
  );
}
