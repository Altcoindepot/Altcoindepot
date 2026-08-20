"use client";

import Link from "next/link";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { dexTokenPath } from "@/lib/dex-token-path";
import { ds } from "@/lib/ui-classes";
import { CopyAddressButton } from "@/components/copy-address-button";
import { DexProjectLinks } from "@/components/dex-project-links";
import { ChainIcon } from "@/components/chain-icon";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { TokenAvatar } from "@/components/token-avatar";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function formatPrice(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  if (abs >= 0.01) return `$${n.toFixed(4)}`;
  if (abs >= 0.000001) return `$${n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${n.toExponential(2)}`;
}

/** Primary name click stays on-site; never uses DexScreener external URL as href. */
function tokenHref(row: JustLaunchedRow): string {
  return (
    dexTokenPath(row.chain, row.contractAddress) ??
    `/token/${encodeURIComponent(row.chain.trim().toLowerCase())}/${encodeURIComponent(row.contractAddress.trim())}`
  );
}

export function JustLaunchedTable({
  rows,
  className = "",
  filterLabel,
  totalCount,
  onClearFilter,
}: {
  rows: JustLaunchedRow[];
  className?: string;
  /** When a Launch Pulse bucket is active. */
  filterLabel?: string | null;
  /** Unfiltered pair count for the header. */
  totalCount?: number;
  onClearFilter?: () => void;
}) {
  const allCount = totalCount ?? rows.length;
  const filtered = Boolean(filterLabel);

  return (
    <section
      id="just-launched-list"
      aria-labelledby="just-launched-heading"
      className={`${ds.panelLg} flex flex-col !p-0 overflow-hidden ${className}`.trim()}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <h2 id="just-launched-heading" className="text-sm font-semibold text-zinc-100 sm:text-base">
          Last 60 minutes
          {filtered ? (
            <span className="ml-2 text-xs font-medium text-teal-300/80">· {filterLabel}</span>
          ) : null}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">
            {filtered ? `${rows.length} of ${allCount} pairs` : `${rows.length} pairs`}
          </span>
          {onClearFilter ? (
            <button
              type="button"
              onClick={onClearFilter}
              className="text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-zinc-500 sm:px-5">
          {filtered
            ? "No pairs in this Launch Pulse bucket right now."
            : "No pairs launched in the last hour passed the liquidity filter. Check back shortly."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <ul className="divide-y divide-white/5 md:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={tokenHref(row)}
                  className="flex items-center gap-2.5 px-3 py-2 active:bg-white/[0.04]"
                >
                  <TokenAvatar symbol={row.symbol} imageUrl={row.image || null} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-baseline gap-1.5">
                      <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-50">
                        {row.symbol}
                      </span>
                      <span className="truncate text-[11px] text-zinc-500">{row.name}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <ChainIcon chainId={row.chain} size={16} />
                      <DexVenueBadge dexId={row.dexId} dexLabel={row.dexLabel} iconOnly size={16} />
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-zinc-500">
                      {formatCompactUsd(row.volume)} vol · {formatCompactUsd(row.liquidity)} liq ·{" "}
                      {row.ageLabel || "—"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-100">
                      {formatPrice(row.priceUsd)}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        (row.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatPct(row.change)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <table className="hidden w-full min-w-[52rem] border-collapse text-left md:table">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5 font-semibold sm:px-4">Token</th>
                <th className="px-3 py-2.5 font-semibold">Price</th>
                <th className="px-3 py-2.5 font-semibold">Chain</th>
                <th className="px-3 py-2.5 font-semibold">DEX</th>
                <th className="px-3 py-2.5 font-semibold">Change</th>
                <th className="px-3 py-2.5 font-semibold">Liquidity</th>
                <th className="px-3 py-2.5 font-semibold">Volume</th>
                <th className="px-3 py-2.5 font-semibold">Age</th>
                <th className="px-3 py-2.5 font-semibold">Contract</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 last:border-0 transition-colors hover:bg-slate-800/30"
                  >
                <td className="px-3 py-1.5 sm:px-4">
                      <div className="flex items-start gap-2">
                        <Link href={tokenHref(row)} className="inline-flex min-w-0 items-center gap-2">
                          <TokenAvatar symbol={row.symbol} imageUrl={row.image || null} size={24} />
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-[13px] font-semibold uppercase text-zinc-100">
                              {row.symbol}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">
                              {row.name}
                            </span>
                          </span>
                        </Link>
                        <span
                          className="shrink-0 pt-0.5"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <DexProjectLinks links={row.projectLinks} variant="icons" />
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs tabular-nums text-zinc-200">
                      {formatPrice(row.priceUsd)}
                    </td>
                    <td className="px-3 py-1.5">
                      <ChainIcon chainId={row.chain} size={18} />
                    </td>
                    <td className="px-3 py-1.5">
                      <DexVenueBadge dexId={row.dexId} dexLabel={row.dexLabel} size={18} />
                    </td>
                    <td
                      className={`px-3 py-1.5 font-mono text-xs font-semibold tabular-nums ${
                        (row.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatPct(row.change)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs tabular-nums text-zinc-300">
                      {formatCompactUsd(row.liquidity)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs tabular-nums text-zinc-400">
                      {formatCompactUsd(row.volume)}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-zinc-300">{row.ageLabel}</td>
                    <td className="px-3 py-1.5">
                      <CopyAddressButton address={row.contractAddress} />
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
