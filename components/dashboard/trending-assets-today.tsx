import Image from "next/image";
import Link from "next/link";
import type { TrendingAssetRow } from "@/lib/dashboard-data";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { ds } from "@/lib/ui-classes";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

/** Compact 3-row trending tickers for the dashboard sidebar. */
export function TrendingAssetsToday({
  rows,
  className = "",
}: {
  rows: TrendingAssetRow[];
  className?: string;
}) {
  return (
    <section
      aria-labelledby="trending-assets-today-heading"
      className={`${ds.panel} flex min-h-0 flex-col ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="trending-assets-today-heading" className="text-sm font-semibold text-zinc-100">
          Trending Assets Today
        </h2>
        <Link
          href="/#classic-markets-heading"
          className="text-[10px] font-medium text-teal-300/90 underline-offset-2 hover:underline"
        >
          More →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Hot search tickers will appear here when CoinGecko trending data loads.
        </p>
      ) : (
        <div className="mt-3 min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="pb-2 pr-2 font-semibold">Asset</th>
                <th className="pb-2 px-1 text-right font-semibold">24h Change</th>
                <th className="pb-2 pl-2 text-right font-semibold">Volume</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 3).map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-2">
                    <Link
                      href={`/coin/${encodeURIComponent(row.id)}`}
                      className="inline-flex max-w-full items-center gap-2"
                    >
                      {row.image ? (
                        <Image
                          src={row.image}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      ) : (
                        <span
                          className="inline-block size-5 shrink-0 rounded-full bg-zinc-700"
                          aria-hidden
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-zinc-100">
                          {row.symbol.toUpperCase()}
                        </span>
                        <span className="block truncate text-[10px] text-zinc-500">{row.name}</span>
                      </span>
                    </Link>
                  </td>
                  <td
                    className={`px-1 py-2.5 text-right font-mono text-xs font-semibold tabular-nums ${
                      (row.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatPct(row.change24h)}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-mono text-[11px] tabular-nums text-zinc-400">
                    {formatCompactUsd(row.volume)}
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
