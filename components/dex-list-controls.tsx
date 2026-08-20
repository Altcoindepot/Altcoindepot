"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatChainLabel } from "@/lib/format-chain";
import {
  DEFAULT_DEX_LIST_QUERY,
  DEX_LIST_AGES,
  DEX_LIST_AGE_LABELS,
  DEX_LIST_MIN_LIQ,
  DEX_LIST_MIN_LIQ_LABELS,
  DEX_LIST_SORTS,
  DEX_LIST_SORT_LABELS,
  MAJOR_DEX_CHAIN_FILTERS,
  chainMatches,
  dexListDirLabel,
  dexListQuerySearchParams,
  dexListQuerySummary,
  parseDexListQuery,
  sortUsesDir,
  type DexListAge,
  type DexListDir,
  type DexListMinLiq,
  type DexListQuery,
  type DexListSort,
} from "@/lib/dex-list-query";

const fieldClass = "grid gap-1";
const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-zinc-500";
const selectClass =
  "min-h-11 w-full rounded-lg border border-white/15 bg-[#0c0e14] px-3 text-sm text-zinc-100 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/25 md:min-h-8 md:text-xs";

function Fields({
  idPrefix,
  query,
  selectedChain,
  chainOptions,
  onChange,
}: {
  idPrefix: string;
  query: DexListQuery;
  selectedChain: string;
  chainOptions: Array<{ id: string; label: string }>;
  onChange: (next: DexListQuery) => void;
}) {
  return (
    <>
      <div className={`${fieldClass} md:min-w-[10.5rem] md:flex-1`}>
        <label className={labelClass} htmlFor={`${idPrefix}-sort`}>
          Sort
        </label>
        <select
          id={`${idPrefix}-sort`}
          value={query.sort}
          onChange={(e) => {
            const sort = e.target.value as DexListSort;
            onChange({
              ...query,
              sort,
              dir: sortUsesDir(sort) ? query.dir : "desc",
            });
          }}
          className={selectClass}
        >
          {DEX_LIST_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {DEX_LIST_SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>

      {sortUsesDir(query.sort) ? (
        <div className={`${fieldClass} md:min-w-[10.5rem] md:flex-1`}>
          <label className={labelClass} htmlFor={`${idPrefix}-dir`}>
            Order
          </label>
          <select
            id={`${idPrefix}-dir`}
            value={query.dir}
            onChange={(e) => onChange({ ...query, dir: e.target.value as DexListDir })}
            className={selectClass}
          >
            <option value="desc">{dexListDirLabel(query.sort, "desc")}</option>
            <option value="asc">{dexListDirLabel(query.sort, "asc")}</option>
          </select>
        </div>
      ) : null}

      <div className={`${fieldClass} md:min-w-[8.5rem] md:flex-1`}>
        <label className={labelClass} htmlFor={`${idPrefix}-age`}>
          Age
        </label>
        <select
          id={`${idPrefix}-age`}
          value={query.age}
          onChange={(e) => onChange({ ...query, age: e.target.value as DexListAge })}
          className={selectClass}
        >
          {DEX_LIST_AGES.map((age) => (
            <option key={age} value={age}>
              {DEX_LIST_AGE_LABELS[age]}
            </option>
          ))}
        </select>
      </div>

      <div className={`${fieldClass} md:min-w-[10.5rem] md:flex-1`}>
        <label className={labelClass} htmlFor={`${idPrefix}-chain`}>
          Chain
        </label>
        <select
          id={`${idPrefix}-chain`}
          value={selectedChain}
          onChange={(e) => onChange({ ...query, chain: e.target.value })}
          className={selectClass}
        >
          <option value="all">All chains</option>
          {chainOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={`${fieldClass} md:min-w-[10.5rem] md:flex-1`}>
        <label className={labelClass} htmlFor={`${idPrefix}-minliq`}>
          Min liquidity
        </label>
        <select
          id={`${idPrefix}-minliq`}
          value={query.minLiq}
          onChange={(e) => onChange({ ...query, minLiq: e.target.value as DexListMinLiq })}
          className={selectClass}
        >
          {DEX_LIST_MIN_LIQ.map((minLiq) => (
            <option key={minLiq} value={minLiq}>
              {DEX_LIST_MIN_LIQ_LABELS[minLiq]}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export function DexListControls({
  chains,
  className = "",
  defaults = DEFAULT_DEX_LIST_QUERY,
}: {
  /** Raw DexScreener chainIds present in the current dataset. */
  chains: string[];
  className?: string;
  defaults?: DexListQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = parseDexListQuery(searchParams, defaults);
  const [open, setOpen] = useState(false);

  const chainOptions = useMemo(() => {
    const byLabel = new Map<string, string>();
    for (const major of MAJOR_DEX_CHAIN_FILTERS) {
      byLabel.set(major.label, major.id);
    }
    for (const chain of chains) {
      const id = chain.trim().toLowerCase();
      if (!id) continue;
      const label = formatChainLabel(id);
      if (!byLabel.has(label)) byLabel.set(label, id);
    }
    return [...byLabel.entries()]
      .map(([label, id]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [chains]);

  const selectedChain =
    query.chain === "all"
      ? "all"
      : (chainOptions.find((opt) => chainMatches(opt.id, query.chain))?.id ?? query.chain);

  const chainLabel =
    selectedChain === "all"
      ? "All"
      : (chainOptions.find((opt) => opt.id === selectedChain)?.label ?? formatChainLabel(selectedChain));

  const summary = dexListQuerySummary(query, chainLabel);
  const custom =
    query.sort !== defaults.sort ||
    query.dir !== defaults.dir ||
    query.chain !== defaults.chain ||
    query.minLiq !== defaults.minLiq ||
    query.age !== defaults.age ||
    query.pulse !== defaults.pulse;

  function push(next: DexListQuery) {
    const href = `${pathname}${dexListQuerySearchParams(next, searchParams, defaults)}`;
    router.replace(href, { scroll: false });
  }

  return (
    <div className={`min-w-0 w-full ${className}`.trim()}>
      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="dex-list-filter-panel"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-white/12 bg-[#0c0e14] px-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Sort &amp; filter
            </span>
            <span className="mt-0.5 block truncate text-xs font-medium text-zinc-200">{summary}</span>
          </span>
          <svg
            className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {open ? (
          <div
            id="dex-list-filter-panel"
            className="mt-2 grid gap-3 rounded-lg border border-white/10 bg-[#0c0e14] p-3"
          >
            <Fields
              idPrefix="dex-m"
              query={query}
              selectedChain={selectedChain}
              chainOptions={chainOptions}
              onChange={push}
            />
            <div className="flex gap-2">
              {custom ? (
                <button
                  type="button"
                  onClick={() => push(defaults)}
                  className="min-h-11 flex-1 rounded-lg border border-white/12 text-xs font-medium text-zinc-300"
                >
                  Reset
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 flex-1 rounded-lg border border-teal-400/30 bg-teal-500/10 text-xs font-semibold text-teal-100"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden min-w-0 md:flex md:flex-wrap md:items-end md:gap-2">
        <Fields
          idPrefix="dex-d"
          query={query}
          selectedChain={selectedChain}
          chainOptions={chainOptions}
          onChange={push}
        />
      </div>
    </div>
  );
}
