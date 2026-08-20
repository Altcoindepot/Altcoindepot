"use client";

import { useState } from "react";
import { getChainMeta } from "@/lib/chain-meta";

/** Small chain logo (~16–20px) with letter-circle fallback. Never blank. */
export function ChainIcon({
  chainId,
  size = 18,
  showLabel = false,
  className = "",
}: {
  chainId?: string | null;
  size?: number;
  /** Optional short label beside the icon (mobile denser rows usually omit). */
  showLabel?: boolean;
  className?: string;
}) {
  const meta = getChainMeta(chainId);
  const [failed, setFailed] = useState(false);
  const letter = meta.short.charAt(0) || "?";

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
    ) : (
      <span
        title={meta.name}
        className="inline-flex shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white"
        style={{
          width: size,
          height: size,
          backgroundColor: meta.color,
          fontSize: Math.max(8, Math.round(size * 0.45)),
        }}
        aria-hidden
      >
        {letter}
      </span>
    );

  if (!showLabel) {
    return (
      <span className={`inline-flex items-center ${className}`.trim()} title={meta.name}>
        {icon}
        <span className="sr-only">{meta.name}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`.trim()}
      title={meta.name}
    >
      {icon}
      <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
        {meta.short}
      </span>
    </span>
  );
}
