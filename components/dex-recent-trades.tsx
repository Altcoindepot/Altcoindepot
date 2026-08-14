import { formatCompactUsd } from "@/lib/format-compact-usd";
import { dexScreenerTradesEmbedUrl, type DexTrade } from "@/lib/dexscreener-trades";
import { ds } from "@/lib/ui-classes";

function formatAgo(timeMs: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - timeMs) / 1000));
  if (secs < 10) return "now";
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatPrice(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${n.toFixed(2)}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(2)}`;
}

function formatAmount(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  if (abs >= 1) return n.toFixed(2);
  if (abs >= 0.0001) return n.toFixed(4);
  return n.toExponential(2);
}

function SideBadge({ side }: { side: "buy" | "sell" }) {
  return (
    <span className={`ds-badge ${side === "buy" ? "ds-badge-pos" : "ds-badge-neg"}`}>
      {side === "buy" ? "Buy" : "Sell"}
    </span>
  );
}

export function DexRecentTrades({
  trades,
  pairUrl,
  chain,
  pairAddress,
}: {
  trades: DexTrade[];
  pairUrl: string | null;
  chain: string;
  pairAddress: string | null;
}) {
  const embed = trades.length === 0 ? dexScreenerTradesEmbedUrl(pairUrl, chain, pairAddress) : null;

  return (
    <section className={`${ds.panelLg} mt-6 !p-0 overflow-hidden`} aria-labelledby="dex-trades-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-3 sm:px-5">
        <h2 id="dex-trades-heading" className="text-sm font-semibold text-zinc-100">
          Recent trades
        </h2>
        {pairUrl ? (
          <a
            href={pairUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            DexScreener ↗
          </a>
        ) : null}
      </div>

      {trades.length > 0 ? (
        <>
          <ul className="divide-y divide-white/5 md:hidden">
            {trades.map((trade, i) => (
              <li
                key={`${trade.timeMs}-${trade.side}-${i}`}
                className="flex min-h-11 items-center gap-2 px-3 py-1.5"
              >
                <span className="w-8 shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
                  {formatAgo(trade.timeMs)}
                </span>
                <SideBadge side={trade.side} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs tabular-nums text-zinc-100">
                    {formatPrice(trade.priceUsd)}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] tabular-nums leading-tight text-zinc-500">
                    {formatAmount(trade.amount)}
                    {trade.amountUsd != null ? ` · ${formatCompactUsd(trade.amountUsd)}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-2 font-semibold">Time</th>
                  <th className="px-3 py-2 font-semibold">Side</th>
                  <th className="px-3 py-2 font-semibold">Price</th>
                  <th className="px-3 py-2 font-semibold">Size</th>
                  <th className="px-5 py-2 font-semibold">USD</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, i) => (
                  <tr
                    key={`${trade.timeMs}-${trade.side}-${i}`}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-5 py-2 font-mono text-xs tabular-nums text-zinc-400">
                      {formatAgo(trade.timeMs)}
                    </td>
                    <td className="px-3 py-2">
                      <SideBadge side={trade.side} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs tabular-nums text-zinc-200">
                      {formatPrice(trade.priceUsd)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs tabular-nums text-zinc-300">
                      {formatAmount(trade.amount)}
                    </td>
                    <td className="px-5 py-2 font-mono text-xs tabular-nums text-zinc-300">
                      {formatCompactUsd(trade.amountUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : embed ? (
        <iframe
          title="Recent DexScreener trades"
          src={embed}
          className="h-64 w-full max-w-full border-0 bg-[#0c0e14] sm:h-[22rem]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <p className="px-4 py-8 text-sm text-zinc-500 sm:px-5">Trades unavailable</p>
      )}
    </section>
  );
}
