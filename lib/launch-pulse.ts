import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import { formatCompactUsd } from "@/lib/format-compact-usd";

export type LaunchPulseBucketId = "pumping" | "dumping" | "high-liq" | "fresh";

export type LaunchPulseNode = {
  id: LaunchPulseBucketId;
  title: string;
  /** Short label under the title (e.g. strongest move). */
  headline: string;
  color: string;
  count: number;
  rowIds: string[];
  empty: boolean;
};

const BUCKET_LIMIT = 8;

function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

/** Derive Launch Pulse buckets from the same Just Launched DexScreener rows. */
export function buildLaunchPulse(rows: JustLaunchedRow[]): LaunchPulseNode[] {
  const pumping = [...rows]
    .filter((r) => r.change != null && Number.isFinite(r.change) && r.change > 0)
    .sort((a, b) => (b.change ?? 0) - (a.change ?? 0))
    .slice(0, BUCKET_LIMIT);

  const dumping = [...rows]
    .filter((r) => r.change != null && Number.isFinite(r.change) && r.change < 0)
    .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
    .slice(0, BUCKET_LIMIT);

  const highLiq = [...rows]
    .filter((r) => r.liquidity != null && Number.isFinite(r.liquidity) && (r.liquidity ?? 0) > 0)
    .sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))
    .slice(0, BUCKET_LIMIT);

  const fresh = [...rows]
    .sort((a, b) => b.pairCreatedAt - a.pairCreatedAt)
    .slice(0, BUCKET_LIMIT);

  return [
    {
      id: "pumping",
      title: "Pumping",
      color: "#34d399",
      count: pumping.length,
      rowIds: pumping.map((r) => r.id),
      empty: pumping.length === 0,
      headline: pumping[0]?.change != null ? formatPct(pumping[0].change) : "—",
    },
    {
      id: "dumping",
      title: "Dumping",
      color: "#f87171",
      count: dumping.length,
      rowIds: dumping.map((r) => r.id),
      empty: dumping.length === 0,
      headline: dumping[0]?.change != null ? formatPct(dumping[0].change) : "—",
    },
    {
      id: "high-liq",
      title: "High liq",
      color: "#2dd4bf",
      count: highLiq.length,
      rowIds: highLiq.map((r) => r.id),
      empty: highLiq.length === 0,
      headline: highLiq[0]?.liquidity != null ? formatCompactUsd(highLiq[0].liquidity) : "—",
    },
    {
      id: "fresh",
      title: "Fresh",
      color: "#fbbf24",
      count: fresh.length,
      rowIds: fresh.map((r) => r.id),
      empty: fresh.length === 0,
      headline: fresh[0]?.ageLabel ?? "—",
    },
  ];
}

export function filterRowsByPulse(
  rows: JustLaunchedRow[],
  nodes: LaunchPulseNode[],
  active: LaunchPulseBucketId | null,
): JustLaunchedRow[] {
  if (!active) return rows;
  const node = nodes.find((n) => n.id === active);
  if (!node || node.empty) return rows;
  const allow = new Set(node.rowIds);
  return rows.filter((r) => allow.has(r.id));
}
