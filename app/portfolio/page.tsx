"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/site-header";
import { usePortfolio } from "@/components/use-portfolio";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import { removeHolding, upsertHolding } from "@/lib/portfolio-storage";

type LiveCoin = {
  id: string;
  name?: string;
  symbol?: string;
  image?: string;
  current_price?: number | null;
};

type SearchHit = {
  id: string;
  name: string;
  symbol: string;
  thumb?: string;
};

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

export default function PortfolioPage() {
  const { holdings, mounted } = usePortfolio();
  const [live, setLive] = useState<Record<string, LiveCoin>>({});
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [amount, setAmount] = useState("");
  const [costBasis, setCostBasis] = useState("");

  const ids = useMemo(() => holdings.map((h) => h.coinId).join(","), [holdings]);

  useEffect(() => {
    if (!ids) {
      setLive({});
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/coins?ids=${encodeURIComponent(ids)}`);
        const data = await readResponseJsonSafely(res);
        const coins = data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
        if (cancelled || !Array.isArray(coins)) return;
        const map: Record<string, LiveCoin> = {};
        for (const c of coins) {
          if (c && typeof c === "object" && typeof (c as LiveCoin).id === "string") {
            map[(c as LiveCoin).id!] = c as LiveCoin;
          }
        }
        setLive(map);
      } catch {
        /* ignore */
      }
    }
    void load();
    const t = window.setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [ids]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/coin-search?q=${encodeURIComponent(q)}`);
          const data = await readResponseJsonSafely(res);
          const list =
            data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
          if (!cancelled && Array.isArray(list)) {
            setHits(
              (list as Array<{ id: string; name: string; symbol: string; image?: string }>)
                .slice(0, 8)
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  symbol: c.symbol,
                  thumb: c.image,
                })),
            );
          }
        } catch {
          if (!cancelled) setHits([]);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  const rows = holdings.map((h) => {
    const price = live[h.coinId]?.current_price ?? null;
    const value = price != null ? price * h.amount : null;
    const cost = h.costBasisUsd != null ? h.costBasisUsd : null;
    const pnl = value != null && cost != null ? value - cost : null;
    return { h, price, value, cost, pnl };
  });

  const totalValue = rows.reduce((sum, r) => sum + (r.value ?? 0), 0);
  const totalCost = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const hasCost = rows.some((r) => r.cost != null);

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const basisRaw = costBasis.trim();
    const basis = basisRaw === "" ? null : Number(basisRaw);
    upsertHolding({
      coinId: selected.id,
      name: selected.name,
      symbol: selected.symbol,
      image: selected.thumb,
      amount: amt,
      costBasisUsd: basis != null && Number.isFinite(basis) ? basis : null,
    });
    setSelected(null);
    setQuery("");
    setAmount("");
    setCostBasis("");
    setHits([]);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manually track holdings on this device. Totals use live CoinGecko prices.
        </p>

        {mounted && holdings.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#f4ddc3]/20 bg-[#0f131b]/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Total value</p>
              <p className="mt-1 font-mono text-xl text-[#d7ad82]">{formatUsd(totalValue)}</p>
            </div>
            {hasCost ? (
              <>
                <div className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Cost basis</p>
                  <p className="mt-1 font-mono text-lg text-zinc-100">{formatUsd(totalCost)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Unrealized P&amp;L</p>
                  <p
                    className={`mt-1 font-mono text-lg ${
                      totalValue - totalCost >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatUsd(totalValue - totalCost)}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#111111] px-4 py-3 sm:col-span-2">
                <p className="text-xs text-zinc-500">
                  Add an optional cost basis when entering holdings to see P&amp;L.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <form
          onSubmit={onAdd}
          className="mt-8 space-y-3 rounded-xl border border-[#f4ddc3]/15 bg-[#0f131b]/70 p-4"
        >
          <h2 className="text-sm font-semibold text-zinc-100">Add holding</h2>
          <div className="relative">
            <label htmlFor="pf-search" className="text-[10px] uppercase tracking-wide text-zinc-500">
              Coin
            </label>
            <input
              id="pf-search"
              value={selected ? `${selected.name} (${selected.symbol.toUpperCase()})` : query}
              onChange={(e) => {
                setSelected(null);
                setQuery(e.target.value);
              }}
              placeholder="Search name or symbol…"
              className="mt-1 w-full rounded-md border border-white/15 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-100"
              autoComplete="off"
            />
            {hits.length > 0 && !selected ? (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-white/15 bg-[#111111] shadow-lg">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
                      onClick={() => {
                        setSelected(h);
                        setQuery("");
                        setHits([]);
                      }}
                    >
                      {h.thumb ? (
                        <Image src={h.thumb} alt="" width={20} height={20} className="rounded-full" />
                      ) : null}
                      <span className="font-mono text-xs uppercase text-zinc-300">{h.symbol}</span>
                      <span className="text-zinc-500">{h.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-amt" className="text-[10px] uppercase tracking-wide text-zinc-500">
                Amount
              </label>
              <input
                id="pf-amt"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/15 bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="pf-cost" className="text-[10px] uppercase tracking-wide text-zinc-500">
                Cost basis USD (optional)
              </label>
              <input
                id="pf-cost"
                type="number"
                step="any"
                min="0"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/15 bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-zinc-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!selected || !amount}
            className="rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/10 px-4 py-2 text-sm font-semibold text-[#d7ad82] disabled:opacity-50"
          >
            Save holding
          </button>
        </form>

        {!mounted ? (
          <p className="mt-8 text-sm text-zinc-500">Loading…</p>
        ) : holdings.length === 0 ? (
          <p className="mt-8 text-sm text-zinc-500">No holdings yet.</p>
        ) : (
          <ul className="mt-8 space-y-2">
            {rows.map(({ h, price, value, pnl }) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#111111] px-3 py-3"
              >
                <Link
                  href={`/coin/${encodeURIComponent(h.coinId)}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  {(live[h.coinId]?.image || h.image) && (
                    <Image
                      src={live[h.coinId]?.image || h.image!}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold uppercase text-zinc-100">
                      {h.symbol}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {h.amount} × {formatUsd(price)}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-mono text-sm text-zinc-100">{formatUsd(value)}</p>
                    {pnl != null ? (
                      <p
                        className={`font-mono text-xs ${
                          pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {formatUsd(pnl)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-600">
                        {formatCompactUsd(value)}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => removeHolding(h.id)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-400/40 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
