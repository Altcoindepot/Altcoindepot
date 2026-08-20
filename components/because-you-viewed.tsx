"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { dexTokenPath } from "@/lib/dex-token-path";
import {
  becauseYouViewedLabel,
  readRecentlyViewed,
  recommendFromHistory,
  type RecentlyViewedToken,
  type RecommendableRow,
} from "@/lib/recently-viewed";

export function BecauseYouViewed<T extends RecommendableRow & { name: string; symbol: string }>({
  rows,
  className = "",
}: {
  rows: T[];
  className?: string;
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

  const picks = useMemo(() => recommendFromHistory(history, rows, 6), [history, rows]);
  const label = becauseYouViewedLabel(history);

  if (history.length === 0 || picks.length === 0 || !label) return null;

  return (
    <section className={className} aria-label={label}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</h2>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
        {picks.map((row) => {
          const href =
            dexTokenPath(row.chain, row.contractAddress) ??
            `/token/${encodeURIComponent(row.chain ?? "")}/${encodeURIComponent(row.contractAddress ?? "")}`;
          return (
            <li key={row.id}>
              <Link
                href={href}
                className="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-[#0c0e14] px-3 text-xs font-medium text-zinc-200"
              >
                {row.name}
                <span className="ml-1.5 font-mono text-[10px] uppercase text-zinc-500">{row.symbol}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
