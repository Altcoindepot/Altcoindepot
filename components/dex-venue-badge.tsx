"use client";

import { useState } from "react";
import { getDexMeta } from "@/lib/dex-meta";

/**
 * DEX venue icon (~16–20px). Falls back to a compact abbreviated pill — never blank.
 */
export function DexVenueBadge({
  dexId,
  dexLabel,
  compact = false,
  iconOnly = false,
  size = 18,
  className = "",
}: {
  dexId?: string | null;
  dexLabel?: string | null;
  compact?: boolean;
  /** Logo only (tooltip = full name). Desktop chain/DEX columns. */
  iconOnly?: boolean;
  size?: number;
  className?: string;
}) {
  const meta = getDexMeta(dexId, dexLabel);
  const [failed, setFailed] = useState(false);

  const icon =
    meta.icon && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element -- local/static brand marks
      <img
        src={meta.icon}
        alt=""
        width={size}
        height={size}
        title={meta.name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    ) : null;

  if (iconOnly) {
    if (icon) {
      return (
        <span className={`inline-flex items-center ${className}`.trim()} title={meta.name}>
          {icon}
          <span className="sr-only">{meta.name}</span>
        </span>
      );
    }
    return (
      <span
        title={meta.name}
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-mono font-bold text-zinc-100 ${className}`.trim()}
        style={{
          width: size,
          height: size,
          backgroundColor: meta.color,
          fontSize: Math.max(7, Math.round(size * 0.38)),
        }}
      >
        {meta.short.slice(0, 2)}
      </span>
    );
  }

  if (icon) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${className}`.trim()}
        title={meta.name}
      >
        {icon}
        {!compact ? (
          <span className="truncate font-mono text-[10px] uppercase tracking-wide text-zinc-400">
            {meta.short}
          </span>
        ) : null}
        <span className="sr-only">{meta.name}</span>
      </span>
    );
  }

  return (
    <span
      title={meta.name}
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-px font-mono uppercase tracking-wide text-zinc-200 ${
        compact ? "text-[9px]" : "text-[10px]"
      } ${className}`.trim()}
      style={{ backgroundColor: `${meta.color}33`, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}
    >
      {meta.short}
    </span>
  );
}
