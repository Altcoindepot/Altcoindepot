"use client";

import { useMemo, useState } from "react";
import { allWikiEntries, wikiDisplayName } from "@/lib/ecosystem-wiki";
import type { WikiChange24hMap, WikiLogoMap } from "@/lib/ecosystem-quotes";
import { EcosystemResourcesPanel } from "@/components/ecosystem-resources-panel";
import { WikiCoinLogo } from "@/components/wiki-coin-logo";
import { WikiChange24h } from "@/components/wiki-change-24h";
import { ds } from "@/lib/ui-classes";

export function EcosystemWikiBrowser({
  change24h = {},
  logos = {},
}: {
  change24h?: WikiChange24hMap;
  logos?: WikiLogoMap;
}) {
  const all = useMemo(() => allWikiEntries(), []);
  const [selected, setSelected] = useState("all");
  const entries = selected === "all" ? all : all.filter((row) => row.id === selected);

  return (
    <div>
      <p className={ds.label}>Ecosystem</p>
      <div className="mt-2 flex flex-wrap gap-2" aria-label="Filter by ecosystem">
        <button
          type="button"
          aria-pressed={selected === "all"}
          onClick={() => setSelected("all")}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
            selected === "all"
              ? "border-[#d1a173]/55 bg-[#d1a173]/15 text-[#d7ad82] shadow-[0_0_16px_rgba(185,129,82,0.18)]"
              : "border-white/10 bg-[#0c0e14] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
          }`}
        >
          All
        </button>
        {all.map((row) => {
          const active = selected === row.id;
          return (
            <button
              key={row.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(row.id)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-[#d1a173]/55 bg-[#d1a173]/15 text-[#d7ad82] shadow-[0_0_16px_rgba(185,129,82,0.18)]"
                  : "border-white/10 bg-[#0c0e14] text-zinc-300 hover:border-white/20 hover:text-zinc-100"
              }`}
            >
              <WikiCoinLogo id={row.id} src={logos[row.id]} size={22} />
              <span>{wikiDisplayName(row.id)}</span>
              <WikiChange24h value={change24h[row.id]} className="text-[11px] font-semibold" />
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <EcosystemResourcesPanel
          entries={entries}
          hideHeading
          change24h={change24h}
          logos={logos}
        />
      </div>
    </div>
  );
}
