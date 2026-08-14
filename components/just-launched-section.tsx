"use client";

import { useMemo, useState } from "react";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import {
  buildLaunchPulse,
  filterRowsByPulse,
  type LaunchPulseBucketId,
} from "@/lib/launch-pulse";
import { LaunchPulse } from "@/components/launch-pulse";
import { JustLaunchedTable } from "@/components/just-launched-table";

/** Just Launched page body: Launch Pulse summary + filterable pair list. */
export function JustLaunchedSection({ rows }: { rows: JustLaunchedRow[] }) {
  const [active, setActive] = useState<LaunchPulseBucketId | null>(null);
  const nodes = useMemo(() => buildLaunchPulse(rows), [rows]);
  const filtered = useMemo(
    () => filterRowsByPulse(rows, nodes, active),
    [rows, nodes, active],
  );

  const activeTitle = active
    ? nodes.find((n) => n.id === active)?.title ?? null
    : null;

  const onSelect = (id: LaunchPulseBucketId | null) => {
    setActive(id);
    if (id) {
      requestAnimationFrame(() => {
        document.getElementById("just-launched-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {rows.length > 0 ? (
        <LaunchPulse nodes={nodes} active={active} onSelect={onSelect} />
      ) : null}
      <JustLaunchedTable
        rows={filtered}
        filterLabel={activeTitle}
        totalCount={rows.length}
        onClearFilter={active ? () => setActive(null) : undefined}
      />
    </div>
  );
}
