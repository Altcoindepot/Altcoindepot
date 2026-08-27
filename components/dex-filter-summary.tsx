"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatChainLabel } from "@/lib/format-chain";
import {
  DEFAULT_DEX_LIST_QUERY,
  dexListQuerySummary,
  formatFreshness,
  parseDexListQuery,
  type DexListQuery,
} from "@/lib/dex-list-query";

export function DexFilterSummary({
  fetchedAt,
  defaults = DEFAULT_DEX_LIST_QUERY,
}: {
  fetchedAt?: number | null;
  defaults?: DexListQuery;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = parseDexListQuery(searchParams, defaults);
  const chainLabel = query.chain === "all" ? "All" : formatChainLabel(query.chain);
  const [label, setLabel] = useState(() => formatFreshness(fetchedAt ?? null));

  useEffect(() => {
    const tick = () => setLabel(formatFreshness(fetchedAt ?? null));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [fetchedAt]);

  const show =
    pathname?.startsWith("/new-low-caps") ||
    pathname?.startsWith("/just-launched") ||
    pathname?.startsWith("/pairs") ||
    pathname?.startsWith("/dex-scanner");
  if (!show) return null;

  return (
    <div className="sticky top-[4.35rem] z-40 px-3 pb-1 pt-1 sm:top-[4.85rem] sm:px-4">
      <div className="glass-card mx-auto flex min-h-11 max-w-[90rem] items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        <p className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
          {dexListQuerySummary(query, chainLabel)}
          <span className="text-zinc-600"> · </span>
          <span className="tabular-nums text-zinc-500">{label}</span>
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex min-h-10 shrink-0 items-center rounded-full px-3 text-[11px] font-semibold text-teal-300/90 hover:bg-teal-500/10 hover:text-teal-200"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
