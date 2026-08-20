import Link from "next/link";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { dexTokenPath } from "@/lib/dex-token-path";
import { ChainIcon } from "@/components/chain-icon";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { TokenAvatar } from "@/components/token-avatar";

function tokenHref(row: DexLivePairRow): string {
  return (
    dexTokenPath(row.chain, row.address) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`
  );
}

/** Dense scanner list matching mockups — Price always visible. */
export function DexPairPriceTable({
  rows,
  error,
  title = "Live pairs",
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
        <p className="text-[10px] tabular-nums text-zinc-500">{rows.length} pairs · DexScreener</p>
      </div>

      {/* Mobile: avatar + symbol/name · chain/DEX logos · price/% · muted metrics */}
      <ul className="divide-y divide-white/5 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={tokenHref(row)}
              className="flex items-center gap-2.5 px-3 py-2 active:bg-white/[0.04]"
            >
              <TokenAvatar symbol={row.symbol} size={28} />
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-baseline gap-1.5">
                  <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-50">
                    {row.symbol}
                  </span>
                  <span className="truncate text-[11px] text-zinc-500">{row.name}</span>
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <ChainIcon chainId={row.chain} size={16} />
                  <DexVenueBadge dexId={row.dex} dexLabel={row.dexLabel} iconOnly size={16} />
                </span>
                <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-zinc-500">
                  {formatCompactUsd(row.volume24h)} vol · {formatCompactUsd(row.liquidityUsd)} liq ·{" "}
                  {row.ageLabel}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-100">
                  {formatDexPriceUsd(row.priceUsd)}
                </span>
                <span
                  className={`font-mono text-xs font-semibold tabular-nums ${
                    (row.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {formatDexPct(row.change24h)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop dense table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="w-10 px-2 py-2 text-center font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Token</th>
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
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-2 py-1.5 text-center font-mono text-[11px] tabular-nums text-zinc-600">
                  {i + 1}
                </td>
                <td className="px-3 py-1.5">
                  <Link href={tokenHref(row)} className="inline-flex min-w-0 items-center gap-2.5">
                    <TokenAvatar symbol={row.symbol} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[13px] font-semibold uppercase text-zinc-100">
                        {row.symbol}
                      </span>
                      <span className="block truncate text-[11px] text-zinc-500">{row.name}</span>
                    </span>
                  </Link>
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
                <td className="px-3 py-1.5">
                  <ChainIcon chainId={row.chain} size={18} />
                </td>
                <td className="px-3 py-1.5">
                  <DexVenueBadge
                    dexId={row.dex}
                    dexLabel={row.dexLabel}
                    size={18}
                    className="gap-1.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
