"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dexTokenPath } from "@/lib/dex-token-path";
import {
  clearRecentlyViewed,
  readRecentlyViewed,
  type RecentlyViewedToken,
} from "@/lib/recently-viewed";

export function RecentlyViewedStrip({ className = "" }: { className?: string }) {
  const [rows, setRows] = useState<RecentlyViewedToken[]>([]);

  useEffect(() => {
    const sync = () => setRows(readRecentlyViewed());
    sync();
    window.addEventListener("recently-viewed-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("recently-viewed-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <section className={`min-w-0 ${className}`.trim()} aria-label="Recently viewed">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Recently viewed
        </h2>
        <button
          type="button"
          onClick={() => {
            clearRecentlyViewed();
            setRows([]);
          }}
          className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
        >
          Clear history
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((row) => {
          const href =
            dexTokenPath(row.chain, row.address) ??
            `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`;
          return (
            <Link
              key={`${row.chain}-${row.address}`}
              href={href}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-[#0c0e14] px-3 text-xs font-medium text-zinc-200"
            >
              <span className="font-mono uppercase text-zinc-100">{row.symbol}</span>
              {row.dex ? <span className="text-[10px] text-zinc-500">{row.dex}</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
