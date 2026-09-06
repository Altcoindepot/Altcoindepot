"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { readResponseJsonSafely } from "@/lib/read-response-json";

type MarqueeItem = {
  id: string;
  symbol: string;
  name?: string;
  imageUrl?: string | null;
  priceUsd: number | null;
  changePct: number | null;
};

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

function TickerItem({ item }: { item: MarqueeItem }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs sm:gap-2.5 sm:text-sm">
      {item.imageUrl ? (
        <span className="relative size-4 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 sm:size-5">
          <Image
            src={item.imageUrl}
            alt=""
            width={20}
            height={20}
            sizes="20px"
            className="object-cover"
          />
        </span>
      ) : (
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[8px] font-bold text-zinc-400 ring-1 ring-white/15 sm:size-5 sm:text-[9px]">
          {(item.symbol || "?").slice(0, 1)}
        </span>
      )}
      <span className="font-medium text-zinc-200">{item.symbol.toUpperCase()}</span>
      <span className="font-mono tabular-nums text-zinc-100">{formatUsd(item.priceUsd)}</span>
      <span className={`font-mono text-[10px] tabular-nums sm:text-xs ${pctClass(item.changePct)}`}>
        {item.changePct != null
          ? `${item.changePct >= 0 ? "+" : ""}${item.changePct.toFixed(2)}%`
          : "—"}
      </span>
    </div>
  );
}

/**
 * Sitewide Dex price strip — animated scroll on all breakpoints (desktop + mobile).
 * Data from /api/price-marquee — never CoinGecko /coins/markets.
 */
export function PriceMarquee() {
  const [items, setItems] = useState<MarqueeItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/price-marquee?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await readResponseJsonSafely(res);
        if (!mounted || !data || typeof data !== "object") return;
        const list = (data as { items?: MarqueeItem[] }).items;
        if (Array.isArray(list) && list.length > 0) setItems(list);
      } catch {
        /* keep empty / previous */
      }
    }
    void load();
    const id = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  if (items.length === 0) {
    return (
      <div
        className="border-b border-teal-400/15 bg-gradient-to-r from-[#05080c] via-[#0a1218] to-[#05080c] py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        aria-hidden
      />
    );
  }

  // Duplicate for seamless -50% loop (same track on mobile + desktop).
  const loop = [...items, ...items];

  return (
    <div
      className="border-b border-teal-400/15 bg-gradient-to-r from-[#05080c] via-[#0a1218] to-[#05080c] py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:py-2.5"
      aria-label="Live Dex movers ticker"
    >
      <div className="group/marquee relative overflow-hidden">
        <div className="animate-marquee-track flex w-max items-center gap-6 pr-6 sm:gap-10 sm:pr-10">
          {loop.map((item, i) => (
            <TickerItem key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
