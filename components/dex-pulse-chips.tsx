"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEX_LIST_PULSES,
  DEX_LIST_PULSE_LABELS,
  DEFAULT_DEX_LIST_QUERY,
  dexListQuerySearchParams,
  parseDexListQuery,
  type DexListPulse,
  type DexListQuery,
} from "@/lib/dex-list-query";

export function DexPulseChips({
  defaults = DEFAULT_DEX_LIST_QUERY,
}: {
  defaults?: DexListQuery;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const query = parseDexListQuery(searchParams, defaults);

  function setPulse(pulse: DexListPulse) {
    const href = `${pathname}${dexListQuerySearchParams({ ...query, pulse }, searchParams, defaults)}`;
    router.replace(href, { scroll: false });
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {DEX_LIST_PULSES.map((pulse) => {
        const active = query.pulse === pulse;
        return (
          <button
            key={pulse}
            type="button"
            onClick={() => setPulse(pulse)}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-semibold sm:min-h-11 sm:px-3 sm:text-xs ${
              active
                ? "border-teal-400/35 bg-teal-500/15 text-teal-200"
                : "border-white/10 bg-[#0c0e14] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {DEX_LIST_PULSE_LABELS[pulse]}
          </button>
        );
      })}
    </div>
  );
}
