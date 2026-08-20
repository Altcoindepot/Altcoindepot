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
    pathname === "/" ||
    pathname?.startsWith("/new-low-caps") ||
    pathname?.startsWith("/just-launched");
  if (!show) return null;

  return (
    <div className="sticky top-[3.25rem] z-40 border-b border-white/10 bg-[#0a0a0a]/92 backdrop-blur-xl sm:top-[3.5rem]">
      <div className="flex min-h-11 items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        <p className="min-w-0 truncate text-[11px] font-medium text-zinc-400">
          {dexListQuerySummary(query, chainLabel)}
          <span className="text-zinc-600"> · </span>
          <span className="tabular-nums text-zinc-500">{label}</span>
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-[11px] font-semibold text-teal-300/90 hover:text-teal-200"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
