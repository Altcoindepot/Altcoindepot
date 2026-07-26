"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SUGGESTED_COIN_SEEDS } from "@/lib/suggested-coins";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import { showToast } from "@/components/toast-host";
import { useWatchlist } from "@/components/use-watchlist";

type LiveHint = {
  id: string;
  name?: string;
  symbol?: string;
  image?: string;
  current_price?: number | null;
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

/** Suggested coins with optional one-tap watchlist add. */
export function SuggestedCoinsPanel({
  title = "Try these popular coins",
  allowWatchlistAdd = false,
  excludeIds = [],
}: {
  title?: string;
  allowWatchlistAdd?: boolean;
  excludeIds?: string[];
}) {
  const { toggle, has } = useWatchlist();
  const [live, setLive] = useState<Record<string, LiveHint>>({});
  const seeds = SUGGESTED_COIN_SEEDS.filter((s) => !excludeIds.includes(s.id)).slice(0, 5);
  const ids = seeds.map((s) => s.id).join(",");

  useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/coins?ids=${encodeURIComponent(ids)}`);
        const data = await readResponseJsonSafely(res);
        const coins = data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
        if (cancelled || !Array.isArray(coins)) return;
        const map: Record<string, LiveHint> = {};
        for (const c of coins) {
          if (c && typeof c === "object" && typeof (c as LiveHint).id === "string") {
            map[(c as LiveHint).id!] = c as LiveHint;
          }
        }
        setLive(map);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (seeds.length === 0) return null;

  return (
    <div className="mt-6 text-left">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {seeds.map((seed) => {
          const quote = live[seed.id];
          const name = quote?.name ?? seed.name;
          const symbol = (quote?.symbol ?? seed.symbol).toUpperCase();
          const img = quote?.image;
          const ch = quote?.price_change_percentage_24h;
          const onList = has(seed.id);
          return (
            <li
              key={seed.id}
              className="flex items-center gap-2 rounded-xl border border-[#f4ddc3]/12 bg-[#0c0e14]/70 px-3 py-2.5"
            >
              <Link
                href={`/coin/${encodeURIComponent(seed.id)}`}
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                {img ? (
                  <Image src={img} alt="" width={28} height={28} className="rounded-full" />
                ) : (
                  <span className="size-7 rounded-full bg-zinc-700" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">{name}</p>
                  <p className="font-mono text-[11px] uppercase text-zinc-500">{symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs tabular-nums text-zinc-200">
                    {formatUsd(quote?.current_price)}
                  </p>
                  <p
                    className={`font-mono text-[11px] tabular-nums ${
                      (ch ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {ch == null ? "—" : `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`}
                  </p>
                </div>
              </Link>
              {allowWatchlistAdd ? (
                <button
                  type="button"
                  disabled={onList}
                  onClick={() => {
                    const nowOn = toggle({
                      id: seed.id,
                      name,
                      symbol: seed.symbol,
                      image: img,
                    });
                    showToast(
                      nowOn
                        ? `Added ${symbol} to watchlist`
                        : `Removed ${symbol} from watchlist`,
                    );
                  }}
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-[#d1a173]/35 text-sm text-[#d7ad82] disabled:border-white/10 disabled:text-zinc-500"
                  aria-label={onList ? `${symbol} already on watchlist` : `Add ${symbol} to watchlist`}
                >
                  {onList ? "★" : "☆"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
