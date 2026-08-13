import Image from "next/image";
import Link from "next/link";
import type { LowCapRow } from "@/lib/dashboard-data";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { statusBadgeClass } from "@/lib/narratives";
import { ds } from "@/lib/ui-classes";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function NewLowCapsTable({
  rows,
  className = "",
}: {
  rows: LowCapRow[];
  className?: string;
}) {
  return (
    <section
      aria-labelledby="new-low-caps-heading"
      className={`${ds.panelLg} flex h-full min-h-0 flex-col !p-0 overflow-hidden ${className}`.trim()}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <h2 id="new-low-caps-heading" className="text-sm font-semibold text-zinc-100 sm:text-base">
          New &amp; Low Caps
        </h2>
        <Link
          href="/gainers-losers"
          className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
        >
          View all →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-zinc-500 sm:px-5">
          Low-cap narrative names will appear here when CoinGecko category data loads.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5 font-semibold sm:px-5">Token</th>
                <th className="px-3 py-2.5 font-semibold">Narrative</th>
                <th className="px-3 py-2.5 font-semibold">Market Cap</th>
                <th className="px-3 py-2.5 font-semibold">7D</th>
                <th className="px-3 py-2.5 font-semibold">Volume</th>
                <th className="px-3 py-2.5 font-semibold">Rotation</th>
                <th className="px-3 py-2.5 font-semibold">Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.id}-${row.narrativeSlug}`} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 sm:px-5">
                    <Link
                      href={`/coin/${encodeURIComponent(row.id)}`}
                      className="inline-flex items-center gap-2"
                    >
                      {row.image ? (
                        <Image
                          src={row.image}
                          alt=""
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : null}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-zinc-100">
                          {row.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`inline-block h-4 w-4 shrink-0 rounded-full ${row.narrativeGlowClass}`}
                            title={row.narrativeTitle}
                            aria-label={`${row.narrativeTitle} narrative`}
                          />
                          <span className="font-mono text-[11px] uppercase text-zinc-500">
                            {row.symbol}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/narrative/${encodeURIComponent(row.narrativeSlug)}`}
                      className={`${ds.badgeInfo} transition-colors hover:border-teal-400/40 hover:text-teal-200`}
                    >
                      {row.narrativeTitle}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-300">
                    {formatCompactUsd(row.marketCap)}
                  </td>
                  <td
                    className={`px-3 py-3 font-mono text-xs font-semibold tabular-nums ${
                      (row.change7d ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatPct(row.change7d)}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-400">
                    {formatCompactUsd(row.volume)}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`ds-badge ${statusBadgeClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{row.addedLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
