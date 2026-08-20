import { dexVenueLabel } from "@/lib/dex-venue";

export function DexVenueBadge({
  dexId,
  dexLabel,
  compact = false,
}: {
  dexId?: string | null;
  dexLabel?: string | null;
  compact?: boolean;
}) {
  const label = dexLabel || dexVenueLabel(dexId);
  return (
    <span
      className={`shrink-0 rounded bg-zinc-800 px-1 py-px font-mono uppercase tracking-wide text-zinc-400 ${
        compact ? "text-[9px]" : "text-[10px]"
      }`}
    >
      {label}
    </span>
  );
}
