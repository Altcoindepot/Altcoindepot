"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { readResponseJsonSafely } from "@/lib/read-response-json";

type Related = {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  current_price?: number | null;
  market_cap?: number | null;
  price_change_percentage_24h?: number | null;
};

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

export function RelatedCoins({ coinId }: { coinId: string }) {
  const [coins, setCoins] = useState<Related[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/related-coins?id=${encodeURIComponent(coinId)}`);
        const data = await readResponseJsonSafely(res);
        const list = data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
        if (mounted && Array.isArray(list)) {
          setCoins(list as Related[]);
        }
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [coinId]);

  if (coins.length === 0) return null;

  return (
    <section aria-labelledby="related-coins-heading" className="mt-6">
      <h2 id="related-coins-heading" className="text-base font-semibold text-white sm:text-lg">
        Related coins
      </h2>
      <p className="mt-1 text-xs text-zinc-500">Nearby by market-cap rank</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {coins.map((c) => {
          const ch = c.price_change_percentage_24h;
          return (
            <li key={c.id}>
              <Link
                href={`/coin/${encodeURIComponent(c.id)}`}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5 transition-colors hover:border-[#d1a173]/45"
              >
                {c.image ? (
                  <Image src={c.image} alt="" width={28} height={28} className="rounded-full" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-bold uppercase text-zinc-100">
                    {c.symbol}
                  </p>
                  <p className="truncate text-[10px] text-zinc-500">{c.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-zinc-200">{formatUsd(c.current_price)}</p>
                  <p
                    className={`font-mono text-[10px] ${
                      (ch ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {ch == null
                      ? "—"
                      : `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`}
                  </p>
                  <p className="text-[9px] text-zinc-600">{formatCompactUsd(c.market_cap)}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
