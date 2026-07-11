"use client";

import Link from "next/link";
import type { EcosystemEntry } from "@/lib/ecosystem-projects";
import { useMarkets } from "@/components/markets-provider";
import { MiniCoinChart } from "@/components/mini-coin-chart";

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}

function pctText(ch: number | null | undefined) {
  if (ch == null || Number.isNaN(ch)) return "—";
  const sign = ch >= 0 ? "+" : "";
  return `${sign}${ch.toFixed(2)}%`;
}

function pctClass(ch: number | null | undefined) {
  if (ch == null || Number.isNaN(ch)) return "text-zinc-500";
  return ch >= 0 ? "text-emerald-400" : "text-red-400";
}

export function EcosystemTickerColumn({
  title,
  description,
  entries,
  accentClass,
}: {
  title: string;
  description: string;
  entries: readonly EcosystemEntry[];
  accentClass: string;
}) {
  const { getCoin } = useMarkets();

  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#111111] p-4 transition-[border-color,box-shadow] sm:p-5 ${accentClass}`}
    >
      <h3 className="font-medium text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
      <div
        className="mt-4 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15"
        role="list"
      >
        {entries.map((e) => {
          const coin = getCoin(e.id);
          const ch = coin?.price_change_percentage_24h;
          const href = `/coin/${encodeURIComponent(e.id)}`;
          return (
            <Link
              key={e.id}
              href={href}
              role="listitem"
              className="glass-card bronze-ring flex min-w-[9.5rem] shrink-0 flex-col gap-0.5 rounded-lg border-2 border-[#f4ddc3]/45 px-3 py-2 text-left outline outline-1 outline-[#2a1e16]/60 transition-[border-color,box-shadow,transform] hover:border-[#d1a173]/70 hover:shadow-[0_0_20px_rgba(185,129,82,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.99] sm:min-w-0"
            >
              <span className="text-xs font-semibold tracking-tight text-zinc-100">
                {e.label}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-zinc-300 sm:text-xs">
                {formatUsd(coin?.current_price ?? null)}
              </span>
              <span className={`font-mono text-[11px] tabular-nums sm:text-xs ${pctClass(ch)}`}>
                24h {pctText(ch)}
              </span>
              <MiniCoinChart
                change24h={coin?.price_change_percentage_24h}
                change7d={coin?.price_change_percentage_7d_in_currency}
                points={coin?.sparkline_in_7d?.price}
                className="mt-1 h-6 w-full rounded border border-white/10 bg-[#0a0a0a]"
              />
              <span className="text-[10px] text-zinc-600">Open coin page</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
