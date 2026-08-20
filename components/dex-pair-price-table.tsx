import Link from "next/link";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { formatChainLabel } from "@/lib/format-chain";
import { dexTokenPath } from "@/lib/dex-token-path";

/** Minimal scanner table — Price column always visible. */
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
      <section className="mt-4 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-4">
        <h2 className="text-sm font-semibold text-red-200">{title}</h2>
        <p className="mt-2 text-sm font-medium text-red-300">
          DexScreener fetch failed: {error}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14]">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {rows.length} pairs · DexScreener live · informational only
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2.5 font-semibold">Symbol</th>
              <th className="px-3 py-2.5 font-semibold">Price</th>
              <th className="px-3 py-2.5 font-semibold">24h %</th>
              <th className="px-3 py-2.5 font-semibold">Volume</th>
              <th className="px-3 py-2.5 font-semibold">Liquidity</th>
              <th className="px-3 py-2.5 font-semibold">Age</th>
              <th className="px-3 py-2.5 font-semibold">Chain</th>
              <th className="px-3 py-2.5 font-semibold">DEX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href =
                dexTokenPath(row.chain, row.address) ??
                `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`;
              return (
                <tr
                  key={row.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-3 py-2.5">
                    <Link href={href} className="font-mono font-semibold text-teal-200 hover:underline">
                      {row.symbol}
                    </Link>
                    <span className="ml-2 truncate text-xs text-zinc-500">{row.name}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-100">
                    {formatDexPriceUsd(row.priceUsd)}
                  </td>
                  <td
                    className={`px-3 py-2.5 font-mono tabular-nums font-semibold ${
                      (row.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatDexPct(row.change24h)}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-300">
                    {formatCompactUsd(row.volume24h)}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-zinc-300">
                    {formatCompactUsd(row.liquidityUsd)}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400">{row.ageLabel}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{formatChainLabel(row.chain)}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{row.dexLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
