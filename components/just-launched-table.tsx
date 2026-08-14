"use client";

import Image from "next/image";
import Link from "next/link";
import type { JustLaunchedRow } from "@/lib/dexscreener-just-launched";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { formatChainLabel } from "@/lib/format-chain";
import { dexTokenPath } from "@/lib/dex-token-path";
import { ds } from "@/lib/ui-classes";
import { CopyAddressButton } from "@/components/copy-address-button";
import { DexProjectLinks } from "@/components/dex-project-links";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function tokenHref(row: JustLaunchedRow): string {
  return (
    dexTokenPath(row.chain, row.contractAddress) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.contractAddress)}`
  );
}

export function JustLaunchedTable({
  rows,
  className = "",
}: {
  rows: JustLaunchedRow[];
  className?: string;
}) {
  return (
    <section
      aria-labelledby="just-launched-heading"
      className={`${ds.panelLg} flex flex-col !p-0 overflow-hidden ${className}`.trim()}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <h2 id="just-launched-heading" className="text-sm font-semibold text-zinc-100 sm:text-base">
          Last 60 minutes
        </h2>
        <span className="text-[11px] text-zinc-500">{rows.length} pairs</span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-zinc-500 sm:px-5">
          No pairs launched in the last hour passed the liquidity filter. Check back shortly.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <ul className="divide-y divide-white/5 md:hidden">
            {rows.map((row) => {
              const chain = formatChainLabel(row.chain);
              return (
                <li key={row.id}>
                  <Link
                    href={tokenHref(row)}
                    className="flex min-h-11 items-center gap-2 px-3 py-1.5 active:bg-white/[0.04]"
                  >
                    {row.image ? (
                      <Image
                        src={row.image}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 rounded-full"
                      />
                    ) : (
                      <span className="size-5 shrink-0 rounded-full bg-zinc-800" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium leading-tight text-zinc-100">
                          {row.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] uppercase text-zinc-500">
                          {row.symbol}
                        </span>
                        <span className="shrink-0 rounded bg-zinc-800 px-1 py-px font-mono text-[9px] uppercase tracking-wide text-zinc-400">
                          {chain}
                        </span>
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] tabular-nums leading-tight text-zinc-500">
                        {row.ageLabel} · Liq {formatCompactUsd(row.liquidity)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                        (row.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatPct(row.change)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <table className="hidden w-full min-w-[52rem] border-collapse text-left md:table">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5 font-semibold sm:px-4">Token</th>
                <th className="px-3 py-2.5 font-semibold">Chain</th>
                <th className="px-3 py-2.5 font-semibold">Change</th>
                <th className="px-3 py-2.5 font-semibold">Liquidity</th>
                <th className="px-3 py-2.5 font-semibold">Volume</th>
                <th className="px-3 py-2.5 font-semibold">Age</th>
                <th className="px-3 py-2.5 font-semibold">Contract</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const chain = formatChainLabel(row.chain);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 last:border-0 transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex items-start gap-2">
                        <Link href={tokenHref(row)} className="inline-flex min-w-0 items-center gap-2">
                          {row.image ? (
                            <Image
                              src={row.image}
                              alt=""
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="size-6 rounded-full bg-zinc-800" />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-zinc-100">
                              {row.name}
                            </span>
                            <span className="font-mono text-[11px] uppercase text-zinc-500">
                              {row.symbol}
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
                    <td className="px-3 py-3">
                      <span className={`${ds.badgeInfo}`}>{chain}</span>
                    </td>
                    <td
                      className={`px-3 py-3 font-mono text-xs font-semibold tabular-nums ${
                        (row.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatPct(row.change)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-300">
                      {formatCompactUsd(row.liquidity)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-400">
                      {formatCompactUsd(row.volume)}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-300">{row.ageLabel}</td>
                    <td className="px-3 py-3">
                      <CopyAddressButton address={row.contractAddress} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
