"use client";

import { useMemo, useState } from "react";
import { allWikiEntries, wikiDisplayName } from "@/lib/ecosystem-wiki";
import { EcosystemResourcesPanel } from "@/components/ecosystem-resources-panel";
import { ds } from "@/lib/ui-classes";

export function EcosystemWikiBrowser() {
  const all = useMemo(() => allWikiEntries(), []);
  const [selected, setSelected] = useState("all");
  const entries = selected === "all" ? all : all.filter((row) => row.id === selected);

  return (
    <div>
      <label className="block max-w-sm">
        <span className={ds.label}>Ecosystem</span>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-1.5 min-h-[44px] w-full rounded-lg border border-white/12 bg-[#0c0e14] px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:border-[#d1a173]/60"
        >
          <option value="all">All ecosystems</option>
          {all.map((row) => (
            <option key={row.id} value={row.id}>
              {wikiDisplayName(row.id)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-6">
        <EcosystemResourcesPanel entries={entries} hideHeading />
      </div>
    </div>
  );
}
