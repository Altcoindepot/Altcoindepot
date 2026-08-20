"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import { buildLaunchPulse, type LaunchPulseBucketId } from "@/lib/launch-pulse";
import { LaunchPulse } from "@/components/launch-pulse";
import {
  dexListQuerySearchParams,
  JUST_LAUNCHED_DEFAULT_QUERY,
  parseDexListQuery,
  type DexListPulse,
} from "@/lib/dex-list-query";

function asPulse(id: LaunchPulseBucketId | null): DexListPulse {
  return id ?? "all";
}

/** Compact Launch Pulse only — for scanner homepage above the price table. */
export function HomeLaunchPulse({ rows }: { rows: JustLaunchedRow[] }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const query = parseDexListQuery(searchParams, JUST_LAUNCHED_DEFAULT_QUERY);
  const nodes = useMemo(() => buildLaunchPulse(rows), [rows]);
  const activePulse = query.pulse === "all" ? null : (query.pulse as LaunchPulseBucketId);

  const onSelect = (id: LaunchPulseBucketId | null) => {
    const href = `${pathname}${dexListQuerySearchParams(
      { ...query, pulse: asPulse(id) },
      searchParams,
      JUST_LAUNCHED_DEFAULT_QUERY,
    )}`;
    router.replace(href, { scroll: false });
  };

  if (rows.length === 0 || nodes.length === 0) return null;

  return (
    <LaunchPulse nodes={nodes} active={activePulse} onSelect={onSelect} compact />
  );
}
