"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import { buildLaunchPulse, type LaunchPulseBucketId } from "@/lib/launch-pulse";
import { LaunchPulse } from "@/components/launch-pulse";
import { JustLaunchedTable } from "@/components/just-launched-table";
import { DexListControls } from "@/components/dex-list-controls";
import { DexPulseChips } from "@/components/dex-pulse-chips";
import { DexListSegment } from "@/components/dex-list-segment";
import { RecentlyViewedStrip } from "@/components/recently-viewed-strip";
import { BecauseYouViewed } from "@/components/because-you-viewed";
import {
  applyDexListQuery,
  dexListQuerySearchParams,
  JUST_LAUNCHED_DEFAULT_QUERY,
  parseDexListQuery,
  type DexListPulse,
} from "@/lib/dex-list-query";

function asPulse(id: LaunchPulseBucketId | null): DexListPulse {
  return id ?? "all";
}

/** Just Launched page body: Launch Pulse summary + filterable pair list. */
export function JustLaunchedSection({ rows }: { rows: JustLaunchedRow[] }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/just-launched";
  const searchParams = useSearchParams();
  const query = parseDexListQuery(searchParams, JUST_LAUNCHED_DEFAULT_QUERY);

  const visible = useMemo(
    () =>
      applyDexListQuery(
        rows.map((row) => ({ ...row, change24h: row.change })),
        query,
      ),
    [rows, query],
  );

  const nodes = useMemo(() => buildLaunchPulse(rows), [rows]);
  const chainIds = useMemo(
    () => [...new Set(rows.map((row) => row.chain).filter(Boolean))],
    [rows],
  );

  const activePulse = query.pulse === "all" ? null : (query.pulse as LaunchPulseBucketId);
  const activeTitle = activePulse
    ? nodes.find((n) => n.id === activePulse)?.title ?? null
    : null;

  const onSelect = (id: LaunchPulseBucketId | null) => {
    const href = `${pathname}${dexListQuerySearchParams(
      { ...query, pulse: asPulse(id) },
      searchParams,
      JUST_LAUNCHED_DEFAULT_QUERY,
    )}`;
    router.replace(href, { scroll: false });
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
    <div className="mt-6 space-y-4">
      <DexListSegment />
      {rows.length > 0 ? (
        <LaunchPulse nodes={nodes} active={activePulse} onSelect={onSelect} />
      ) : null}
      <DexPulseChips defaults={JUST_LAUNCHED_DEFAULT_QUERY} />
      <RecentlyViewedStrip />
      <BecauseYouViewed rows={visible} />
      {rows.length > 0 ? (
        <DexListControls chains={chainIds} defaults={JUST_LAUNCHED_DEFAULT_QUERY} />
      ) : null}
      <JustLaunchedTable
        rows={visible}
        filterLabel={activeTitle}
        totalCount={rows.length}
        onClearFilter={
          activePulse
            ? () => onSelect(null)
            : undefined
        }
      />
    </div>
  );
}
