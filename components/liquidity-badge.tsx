"use client";

import { assessLiquidity, type LiquidityFlag } from "@/lib/liquidity";

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

  const cls =
    flag.level === "thin"
      ? "border-zinc-500/40 bg-zinc-800/50 text-zinc-300"
      : "border-[#d1a173]/30 bg-[#d1a173]/10 text-[#d7ad82]";

  return (
    <span
      title={flag.detail}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {compact ? (flag.level === "thin" ? "Thin liq." : "Vol watch") : flag.label}
    </span>
  );
}
