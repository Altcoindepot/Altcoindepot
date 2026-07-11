"use client";

import Image from "next/image";
import { useMarkets } from "@/components/markets-provider";

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}

function pctClass(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "text-zinc-500";
  return v >= 0 ? "text-emerald-400" : "text-red-400";
}

export function PriceMarquee() {
  const { topMarkets } = useMarkets();
  const top = topMarkets.slice(0, 10);
  const loop = [...top, ...top];

  if (top.length === 0) {
    return (
      <div
        className="border-b border-white/10 bg-[#0d0d0d] py-2.5"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="group/marquee border-b border-[#00ff9f]/15 bg-gradient-to-r from-[#0a0a0a] via-[#111111] to-[#0a0a0a] py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      aria-label="Top 10 cryptocurrencies by market cap, scrolling ticker"
    >
      <div className="relative overflow-hidden">
        <div className="animate-marquee-track flex w-max items-center gap-10 pr-10">
          {loop.map((coin, i) => {
            const ch = coin.price_change_percentage_24h;
            return (
              <div
                key={`${coin.id}-${i}`}
                className="flex shrink-0 items-center gap-2.5 text-sm"
              >
                <span className="relative size-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                  <Image
                    src={coin.image}
                    alt=""
                    width={20}
                    height={20}
                    sizes="20px"
                    className="object-cover"
                  />
                </span>
                <span className="font-medium text-zinc-200">{coin.symbol.toUpperCase()}</span>
                <span className="font-mono text-zinc-100 tabular-nums">
                  {formatUsd(coin.current_price)}
                </span>
                <span className={`font-mono text-xs tabular-nums ${pctClass(ch)}`}>
                  {ch != null ? `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
