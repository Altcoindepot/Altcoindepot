"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { readResponseJsonSafely } from "@/lib/read-response-json";
import { showToast } from "@/components/toast-host";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { ds } from "@/lib/ui-classes";

type SearchHit = {
  id: string;
  name: string;
  symbol: string;
  image?: string;
};

type LiveCoin = {
  id: string;
  name?: string;
  symbol?: string;
  image?: string;
  current_price?: number | null;
  price_change_percentage_24h?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
};

const MAX_COINS = 3;

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

/** Price at another coin’s market cap can get huge — use compact when needed. */
function formatImpliedUsd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  return formatUsd(n);
}

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function pctClass(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "text-zinc-500";
  return n >= 0 ? "text-emerald-300" : "text-red-300";
}

/** Implied price if `coin` kept its supply but traded at `peer`’s market cap. */
function impliedPriceAtPeerMcap(coin: LiveCoin | undefined, peer: LiveCoin | undefined): number | null {
  const price = coin?.current_price;
  const mcap = coin?.market_cap;
  const peerMcap = peer?.market_cap;
  if (
    price == null ||
    mcap == null ||
    peerMcap == null ||
    !Number.isFinite(price) ||
    !Number.isFinite(mcap) ||
    !Number.isFinite(peerMcap) ||
    price <= 0 ||
    mcap <= 0 ||
    peerMcap <= 0
  ) {
    return null;
  }
  return price * (peerMcap / mcap);
}

function symOf(hit: SearchHit, live?: LiveCoin) {
  return ((live?.symbol ?? hit.symbol) || hit.id).toString().toUpperCase();
}

function nameOf(hit: SearchHit, live?: LiveCoin) {
  return (live?.name ?? hit.name ?? hit.id).toString();
}

export function CompareClient({ initialIds = [] }: { initialIds?: string[] }) {
  const [selected, setSelected] = useState<SearchHit[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [live, setLive] = useState<Record<string, LiveCoin>>({});
  const [loadingLive, setLoadingLive] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(initialIds.length === 0);

  const ids = useMemo(() => selected.map((c) => c.id).join(","), [selected]);

  useEffect(() => {
    if (initialIds.length === 0 || bootstrapped) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/coins?ids=${encodeURIComponent(initialIds.join(","))}`);
        const data = await readResponseJsonSafely(res);
        const coins = data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
        if (cancelled || !Array.isArray(coins)) {
          if (!cancelled) setBootstrapped(true);
          return;
        }
        const hitsFromApi: SearchHit[] = [];
        for (const id of initialIds) {
          const match = (coins as LiveCoin[]).find((c) => c.id === id);
          if (match?.id) {
            hitsFromApi.push({
              id: match.id,
              name: match.name ?? match.id,
              symbol: (match.symbol ?? match.id).toString(),
              image: match.image,
            });
          }
        }
        if (!cancelled && hitsFromApi.length > 0) {
          setSelected(hitsFromApi.slice(0, MAX_COINS));
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialIds, bootstrapped]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/coin-search?q=${encodeURIComponent(q)}&limit=8`);
          const data = await readResponseJsonSafely(res);
          const list =
            data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
          if (!cancelled && Array.isArray(list)) {
            setHits(
              (list as Array<{ id: string; name: string; symbol: string; image?: string }>)
                .filter((c) => !selected.some((s) => s.id === c.id))
                .slice(0, 8)
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  symbol: c.symbol,
                  image: c.image,
                })),
            );
          }
        } catch {
          if (!cancelled) setHits([]);
        }
      })();
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, selected]);

  useEffect(() => {
    if (!ids) {
      setLive({});
      return;
    }
    let cancelled = false;
    setLoadingLive(true);
    void (async () => {
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
      } finally {
        if (!cancelled) setLoadingLive(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  function addCoin(hit: SearchHit) {
    if (selected.length >= MAX_COINS) {
      showToast(`Compare up to ${MAX_COINS} coins`);
      return;
    }
    if (selected.some((s) => s.id === hit.id)) return;
    setSelected((prev) => [...prev, hit]);
    setQuery("");
    setHits([]);
  }

  function removeCoin(id: string) {
    setSelected((prev) => prev.filter((c) => c.id !== id));
  }

  const rows: Array<{
    key: string;
    label: string;
    render: (coin: LiveCoin | undefined) => ReactNode;
  }> = [
    {
      key: "price",
      label: "Price",
      render: (c) => (
        <span className="font-mono text-base font-bold tabular-nums text-zinc-50">
          {formatUsd(c?.current_price)}
        </span>
      ),
    },
    {
      key: "ch24",
      label: "24h change",
      render: (c) => (
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${pctClass(c?.price_change_percentage_24h)}`}
        >
          {formatPct(c?.price_change_percentage_24h)}
        </span>
      ),
    },
    {
      key: "ch7",
      label: "7d change",
      render: (c) => (
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${pctClass(c?.price_change_percentage_7d_in_currency)}`}
        >
          {formatPct(c?.price_change_percentage_7d_in_currency)}
        </span>
      ),
    },
    {
      key: "mcap",
      label: "Market cap",
      render: (c) => (
        <span className="font-mono text-sm tabular-nums text-zinc-200">
          {formatCompactUsd(c?.market_cap ?? null)}
        </span>
      ),
    },
    {
      key: "vol",
      label: "24h volume",
      render: (c) => (
        <span className="font-mono text-sm tabular-nums text-zinc-200">
          {formatCompactUsd(c?.total_volume ?? null)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className={`relative ${ds.panel}`}>
        <label htmlFor="compare-search" className={ds.label}>
          Add a coin ({selected.length}/{MAX_COINS})
        </label>
        <input
          id="compare-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or symbol…"
          disabled={selected.length >= MAX_COINS}
          className="mt-2 min-h-11 w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
          autoComplete="off"
        />
        {hits.length > 0 ? (
          <ul className="absolute left-4 right-4 z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-white/15 bg-[#141218] shadow-xl sm:left-5 sm:right-5">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => addCoin(h)}
                >
                  {h.image ? (
                    <Image src={h.image} alt="" width={22} height={22} className="rounded-full" />
                  ) : null}
                  <span className="font-mono text-xs uppercase text-zinc-300">{h.symbol}</span>
                  <span className="truncate text-zinc-400">{h.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {selected.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {selected.map((c) => (
              <li key={c.id} className={`${ds.badgeAccent} !h-8 gap-2 !px-2.5`}>
                {c.image ? (
                  <Image src={c.image} alt="" width={18} height={18} className="rounded-full" />
                ) : null}
                <span className="font-mono text-xs uppercase">{c.symbol}</span>
                <button
                  type="button"
                  onClick={() => removeCoin(c.id)}
                  className="min-h-6 min-w-6 rounded text-zinc-400 hover:text-red-300"
                  aria-label={`Remove ${c.symbol}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Search above to add coins. Try Bitcoin, Ethereum, and Solana to get started.
        </p>
      ) : selected.length === 1 ? (
        <p className="mt-6 text-sm text-zinc-500">Add at least one more coin to compare.</p>
      ) : (
        <>
          <div className={`mt-6 overflow-x-auto ${ds.panel} !p-0`}>
            {loadingLive ? (
              <p className="px-4 py-6 text-sm text-zinc-500">Loading live stats…</p>
            ) : (
              <table className="w-full min-w-[32rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Metric
                    </th>
                    {selected.map((c) => {
                      const quote = live[c.id];
                      return (
                        <th key={c.id} className="px-4 py-3">
                          <Link
                            href={`/coin/${encodeURIComponent(c.id)}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100 hover:text-[#d7ad82]"
                          >
                            {(quote?.image || c.image) && (
                              <Image
                                src={quote?.image || c.image!}
                                alt=""
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            )}
                            <span className="font-mono uppercase">{c.symbol}</span>
                          </Link>
                          <p className="mt-0.5 text-xs font-normal text-zinc-500">{c.name}</p>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-white/5 last:border-0">
                      <th className="px-4 py-3 text-xs font-medium text-zinc-500">{row.label}</th>
                      {selected.map((c) => (
                        <td key={`${row.key}-${c.id}`} className="px-4 py-3">
                          {row.render(live[c.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loadingLive ? (
            <section className={`mt-6 ${ds.panel}`} aria-labelledby="mcap-parity-heading">
              <h2 id="mcap-parity-heading" className="text-base font-semibold text-zinc-100">
                Market cap parity
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                What each coin’s price would be if it had another coin’s market cap (same circulating
                supply).
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {selected.map((subject) => {
                  const subjectLive = live[subject.id];
                  const subjectSym = symOf(subject, subjectLive);
                  const peers = selected.filter((p) => p.id !== subject.id);
                  return (
                    <article key={subject.id} className={ds.card}>
                      <p className={ds.label}>{subjectSym} at peers’ market caps</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Now {formatUsd(subjectLive?.current_price)} · mcap{" "}
                        {formatCompactUsd(subjectLive?.market_cap ?? null)}
                      </p>
                      <ul className="mt-3 space-y-3">
                        {peers.map((peer) => {
                          const peerLive = live[peer.id];
                          const peerSym = symOf(peer, peerLive);
                          const peerName = nameOf(peer, peerLive);
                          const implied = impliedPriceAtPeerMcap(subjectLive, peerLive);
                          const multiple =
                            implied != null &&
                            subjectLive?.current_price != null &&
                            subjectLive.current_price > 0
                              ? implied / subjectLive.current_price
                              : null;
                          return (
                            <li key={`${subject.id}-${peer.id}`}>
                              <p className="text-xs leading-snug text-zinc-400">
                                If {subjectSym} had{" "}
                                <span className="font-medium text-zinc-300">
                                  {peerName} ({peerSym})
                                </span>
                                ’s market cap
                              </p>
                              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-zinc-50">
                                {formatImpliedUsd(implied)}
                              </p>
                              {multiple != null ? (
                                <p
                                  className={`mt-0.5 font-mono text-xs tabular-nums ${
                                    multiple >= 1 ? "text-emerald-300" : "text-red-300"
                                  }`}
                                >
                                  ×
                                  {multiple.toLocaleString("en-US", {
                                    maximumFractionDigits: multiple >= 10 ? 1 : 2,
                                  })}{" "}
                                  vs current price
                                </p>
                              ) : (
                                <p className="mt-0.5 text-xs text-zinc-600">
                                  Need live price &amp; mcap
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </article>
                  );
                })}
              </div>
              <DisclaimerNote className="mt-3">
                Thought experiment only · ignores unlocks, dilution, and liquidity · not financial
                advice
              </DisclaimerNote>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
