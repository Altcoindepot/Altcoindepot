"use client";

import { assessLiquidity, type LiquidityFlag } from "@/lib/liquidity";
import { ds } from "@/lib/ui-classes";

export function LiquidityBadge({
  totalVolume,
  marketCap,
  compact = false,
}: {
  totalVolume?: number | null;
  marketCap?: number | null;
  compact?: boolean;
}) {
  const flag: LiquidityFlag | null = assessLiquidity({ totalVolume, marketCap });
  if (!flag) return null;

  const cls = flag.level === "thin" ? ds.badgeNeg : ds.badgeWarn;

  return (
    <span title={flag.detail} className={cls}>
      {compact ? (flag.level === "thin" ? "Thin liq." : "Vol watch") : flag.label}
    </span>
  );
}
