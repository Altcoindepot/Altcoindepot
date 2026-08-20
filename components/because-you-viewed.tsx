"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { dexTokenPath } from "@/lib/dex-token-path";
import { formatChainLabel } from "@/lib/format-chain";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import {
  becauseYouViewedLabel,
  readRecentlyViewed,
  recommendFromHistory,
  type RecentlyViewedToken,
  type RecommendableRow,
} from "@/lib/recently-viewed";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { TokenAvatar } from "@/components/token-avatar";

type DenseRecommendRow = RecommendableRow & {
  name: string;
  symbol: string;
  priceUsd?: number | null;
  change24h?: number | null;
  change7d?: number | null;
  volume?: number | null;
  volume24h?: number | null;
  liquidity?: number | null;
  liquidityUsd?: number | null;
  dexId?: string | null;
  image?: string | null;
};

function changeOf(row: DenseRecommendRow) {
  return row.change24h ?? row.change7d ?? null;
}

function volumeOf(row: DenseRecommendRow) {
  return row.volume24h ?? row.volume ?? null;
}

function liquidityOf(row: DenseRecommendRow) {
  return row.liquidityUsd ?? row.liquidity ?? null;
}

/** Dense “Because you viewed…” strip — mockup-style rows with pills + metrics. */
export function BecauseYouViewed<T extends DenseRecommendRow>({
  rows,
  className = "",
  limit = 5,
}: {
  rows: T[];
  className?: string;
  limit?: number;
}) {
  const [history, setHistory] = useState<RecentlyViewedToken[]>([]);

  useEffect(() => {
    const sync = () => setHistory(readRecentlyViewed());
    sync();
    window.addEventListener("recently-viewed-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("recently-viewed-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const picks = useMemo(() => recommendFromHistory(history, rows, limit), [history, rows, limit]);
  const label = becauseYouViewedLabel(history);

  if (history.length === 0 || picks.length === 0 || !label) return null;

  return (
    <section className={`min-w-0 ${className}`.trim()} aria-label={label}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</h2>
      <ul className="mt-2 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14]">
        {picks.map((row) => {
          const href =
            dexTokenPath(row.chain, row.contractAddress) ??
            `/token/${encodeURIComponent(row.chain ?? "")}/${encodeURIComponent(row.contractAddress ?? "")}`;
          const ch = changeOf(row);
          return (
            <li key={row.id}>
              <Link
                href={href}
                className="flex min-h-11 items-center gap-2.5 px-3 py-1.5 active:bg-white/[0.04] hover:bg-white/[0.03]"
              >
                <TokenAvatar symbol={row.symbol} imageUrl={row.image} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-mono text-[12px] font-semibold uppercase text-zinc-100">
                      {row.symbol}
                    </span>
                    <span className="truncate text-[11px] text-zinc-500">{row.name}</span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1">
                    {row.chain ? (
                      <span className="rounded bg-zinc-800 px-1 py-px font-mono text-[9px] uppercase text-zinc-400">
                        {formatChainLabel(row.chain)}
                      </span>
                    ) : null}
                    <DexVenueBadge dexId={row.dexId} dexLabel={row.dexLabel} compact />
                    <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                      {formatDexPriceUsd(row.priceUsd)} · Vol {formatCompactUsd(volumeOf(row))}
                    </span>
                  </span>
                </span>
                <span
                  className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                    (ch ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {formatDexPct(ch)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
