import Link from "next/link";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { formatChainLabel } from "@/lib/format-chain";
import { dexTokenPath } from "@/lib/dex-token-path";
import { DexVenueBadge } from "@/components/dex-venue-badge";

function tokenHref(row: DexLivePairRow): string {
  return (
    dexTokenPath(row.chain, row.address) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`
  );
}

/** Dense scanner list — Price column always visible (mobile rows + desktop table). */
export function DexPairPriceTable({
  rows,
  error,
  title = "Live DEX pairs",
}: {
  rows: DexLivePairRow[];
  error?: string | null;
  title?: string;
}) {
  if (error) {
    return (
      <section className="mt-3 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-3 sm:px-4">
        <h2 className="text-sm font-semibold text-red-200">{title}</h2>
        <p className="mt-1 text-sm font-medium text-red-300">
          DexScreener fetch failed: {error}
        </p>
      </section>
    );
  }

  if (rows.length === 0) return null;

  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14]">
      <div className="flex items-baseline justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        <p className="text-[10px] tabular-nums text-zinc-500">{rows.length} pairs</p>
      </div>

      {/* Dense mobile rows */}
      <ul className="divide-y divide-white/5 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={tokenHref(row)}
              className="flex min-h-11 items-center gap-2 px-3 py-1.5 active:bg-white/[0.04]"
            >
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-mono text-[13px] font-semibold uppercase text-zinc-100">
                    {row.symbol}
                  </span>
                  <span className="shrink-0 rounded bg-zinc-800 px-1 py-px font-mono text-[9px] uppercase text-zinc-400">
                    {formatChainLabel(row.chain)}
                  </span>
                  <DexVenueBadge dexId={row.dex} dexLabel={row.dexLabel} compact />
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[10px] tabular-nums leading-tight text-zinc-500">
                  <span className="text-zinc-300">{formatDexPriceUsd(row.priceUsd)}</span>
                  <span>·</span>
                  <span>Vol {formatCompactUsd(row.volume24h)}</span>
                  <span>·</span>
                  <span>Liq {formatCompactUsd(row.liquidityUsd)}</span>
                  <span>·</span>
                  <span>{row.ageLabel}</span>
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                  (row.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {formatDexPct(row.change24h)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Dense desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-semibold">Symbol</th>
              <th className="px-3 py-2 font-semibold">Price</th>
              <th className="px-3 py-2 font-semibold">24h %</th>
              <th className="px-3 py-2 font-semibold">Volume</th>
              <th className="px-3 py-2 font-semibold">Liquidity</th>
              <th className="px-3 py-2 font-semibold">Age</th>
              <th className="px-3 py-2 font-semibold">Chain</th>
              <th className="px-3 py-2 font-semibold">DEX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-3 py-1.5">
                  <Link
                    href={tokenHref(row)}
                    className="font-mono text-[13px] font-semibold uppercase text-teal-200 hover:underline"
                  >
                    {row.symbol}
                  </Link>
                  <span className="ml-2 truncate text-[11px] text-zinc-500">{row.name}</span>
                </td>
                <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-zinc-100">
                  {formatDexPriceUsd(row.priceUsd)}
                </td>
                <td
                  className={`px-3 py-1.5 font-mono text-[13px] font-semibold tabular-nums ${
                    (row.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {formatDexPct(row.change24h)}
                </td>
                <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-zinc-300">
                  {formatCompactUsd(row.volume24h)}
                </td>
                <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-zinc-300">
                  {formatCompactUsd(row.liquidityUsd)}
                </td>
                <td className="px-3 py-1.5 text-[12px] text-zinc-400">{row.ageLabel}</td>
                <td className="px-3 py-1.5 text-[12px] text-zinc-400">
                  {formatChainLabel(row.chain)}
                </td>
                <td className="px-3 py-1.5">
                  <DexVenueBadge dexId={row.dex} dexLabel={row.dexLabel} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
