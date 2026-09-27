"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SiteNewsItem } from "@/lib/site-news";
import { formatTimeAgo } from "@/lib/format-date";
import { formatDexPct } from "@/lib/dex-pair-fields";
import { matchNewsTickerChips, type NewsTickerCandidate } from "@/lib/news-tickers";
import { resolveTokenImageUrl } from "@/lib/token-image";
import { TokenAvatar } from "@/components/token-avatar";

export type NewsDexMover = {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  address: string;
  changePct: number;
  window: "1h" | "24h";
  href: string;
  priceUsd: number | null;
};

type TabId = "headlines" | "pulse";

const PROMOS = [
  {
    href: "/dex-scanner",
    title: "Dex Scanner",
    blurb: "Scan liquid pairs across chains — live Dex volume and liquidity.",
  },
  {
    href: "/new-low-caps",
    title: "New low caps",
    blurb: "Fresh low-cap Dex pairs with live price and liquidity checks.",
  },
] as const;

function PromoCard({ index }: { index: number }) {
  const promo = PROMOS[index % PROMOS.length]!;
  return (
    <li>
      <Link
        href={promo.href}
        className="glass-panel block rounded-xl border border-teal-400/20 bg-teal-500/[0.06] px-3.5 py-3 transition-colors hover:border-teal-400/35 hover:bg-teal-500/10"
      >
        <span className="text-[9px] font-semibold uppercase tracking-wider text-teal-200/90">
          On AltCoin Depot
        </span>
        <span className="mt-1 block text-[13px] font-semibold text-zinc-50 sm:text-sm">
          {promo.title} →
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{promo.blurb}</span>
      </Link>
    </li>
  );
}

function MoverChip({ mover }: { mover: NewsDexMover }) {
  const up = mover.changePct >= 0;
  return (
    <Link
      href={mover.href}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums ${
        up
          ? "border-teal-400/30 bg-teal-500/10 text-teal-200"
          : "border-rose-400/30 bg-rose-500/10 text-rose-200"
      }`}
    >
      <TokenAvatar
        symbol={mover.symbol}
        imageUrl={resolveTokenImageUrl({ chain: mover.chain, address: mover.address })}
        size={24}
      />
      <span className="uppercase text-zinc-100">{mover.symbol}</span>
      <span>{formatDexPct(mover.changePct)}</span>
      <span className="text-[9px] font-semibold uppercase text-zinc-500">{mover.window}</span>
    </Link>
  );
}

function HeadlineRow({
  item,
  listed,
}: {
  item: SiteNewsItem;
  listed: NewsTickerCandidate[];
}) {
  const chips = useMemo(
    () => matchNewsTickerChips(item.title, listed),
    [item.title, listed],
  );
  const summaryHref = `/news/read?u=${encodeURIComponent(item.href)}`;

  return (
    <li>
      <article className="glass-panel rounded-xl px-3.5 py-3 transition-colors hover:border-teal-400/25 hover:bg-white/[0.04]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex rounded border border-teal-400/20 bg-teal-500/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-teal-200/90">
            {item.source}
          </span>
          <span className="text-[10px] tabular-nums text-zinc-500">
            {formatTimeAgo(item.publishedAt)}
          </span>
          <Link
            href={summaryHref}
            className="text-[10px] font-semibold text-zinc-500 underline-offset-2 hover:text-teal-200 hover:underline"
          >
            Summary
          </Link>
        </div>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 block text-[13px] font-semibold leading-snug text-zinc-100 sm:text-sm"
        >
          {item.title}
        </a>
        {chips.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.symbol}
                href={chip.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-400/45 bg-teal-500/20 px-3 font-mono text-[12px] font-bold uppercase tracking-wide text-teal-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:border-teal-300/60 hover:bg-teal-500/30 hover:text-teal-50 active:bg-teal-500/35"
              >
                <TokenAvatar symbol={chip.symbol} imageUrl={chip.imageUrl} size={24} />
                {chip.symbol}
              </Link>
            ))}
          </div>
        ) : null}
      </article>
    </li>
  );
}

export function NewsPageView({
  items,
  sourcesLabel,
  stale,
  movers,
  listedTickers,
}: {
  items: SiteNewsItem[];
  sourcesLabel: string;
  stale: boolean;
  movers: NewsDexMover[];
  /** High-volume Dex movers + low-caps for headline ticker chips. */
  listedTickers?: NewsTickerCandidate[];
}) {
  const [tab, setTab] = useState<TabId>("headlines");
  const listed: NewsTickerCandidate[] = useMemo(() => {
    if (listedTickers && listedTickers.length > 0) return listedTickers;
    return movers
      .filter((m) => m.address)
      .map((m) => ({ symbol: m.symbol, chain: m.chain, address: m.address }));
  }, [listedTickers, movers]);
  const movingTop = movers.slice(0, 3);
  const pulseMovers = movers.slice(0, 5);

  const feedRows = useMemo(() => {
    const rows: Array<{ kind: "article"; item: SiteNewsItem } | { kind: "promo"; index: number }> =
      [];
    let promoIndex = 0;
    items.forEach((item, i) => {
      rows.push({ kind: "article", item });
      if ((i + 1) % 3 === 0) {
        rows.push({ kind: "promo", index: promoIndex });
        promoIndex += 1;
      }
    });
    return rows;
  }, [items]);

  const tabClass = (id: TabId) =>
    `inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold transition-colors ${
      tab === id
        ? "nav-pill-active"
        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
    }`;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">
        <Link href="/" className="hover:text-teal-200">
          Home
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        News
      </p>
      <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
        Crypto news
      </h1>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
        {sourcesLabel} · newest first · {items.length} headlines
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        <Link
          href="/podcasts"
          className="text-zinc-400 underline-offset-2 hover:text-teal-200 hover:underline"
        >
          Crypto podcasts →
        </Link>
      </p>
      {stale ? (
        <p className="mt-2 text-[11px] text-amber-200/90">
          Feed delayed — showing last good snapshot.
        </p>
      ) : null}

      <div className="mt-4 flex gap-1.5">
        <button type="button" className={tabClass("headlines")} onClick={() => setTab("headlines")}>
          Headlines
        </button>
        <button type="button" className={tabClass("pulse")} onClick={() => setTab("pulse")}>
          Dex pulse
        </button>
      </div>

      {tab === "headlines" ? (
        <>
          {movingTop.length > 0 ? (
            <section
              aria-label="Moving on Dex"
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Moving on Dex
              </p>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {movingTop.map((m) => (
                  <MoverChip key={m.id} mover={m} />
                ))}
              </div>
            </section>
          ) : null}

          <ul className="mt-4 flex flex-col gap-2 sm:mt-5 sm:gap-2.5">
            {feedRows.length > 0 ? (
              feedRows.map((row) =>
                row.kind === "promo" ? (
                  <PromoCard key={`promo-${row.index}`} index={row.index} />
                ) : (
                  <HeadlineRow key={row.item.id} item={row.item} listed={listed} />
                ),
              )
            ) : (
              <li className="glass-panel rounded-xl px-4 py-6 text-sm text-zinc-500">
                No headlines available right now.
              </li>
            )}
          </ul>
        </>
      ) : (
        <section aria-label="Dex pulse" className="mt-4">
          <p className="text-[11px] text-zinc-500">
            Top Dex movers · tap through to the token page
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {pulseMovers.length > 0 ? (
              pulseMovers.map((m) => {
                const up = m.changePct >= 0;
                return (
                  <li key={m.id}>
                    <Link
                      href={m.href}
                      className="glass-panel flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition-colors hover:border-teal-400/25"
                    >
                      <span>
                        <span className="block font-mono text-sm font-bold uppercase text-zinc-50">
                          {m.symbol}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-zinc-500">
                          {m.chain} · {m.window.toUpperCase()}
                        </span>
                      </span>
                      <span
                        className={`font-mono text-sm font-semibold tabular-nums ${
                          up ? "text-teal-300" : "text-rose-300"
                        }`}
                      >
                        {formatDexPct(m.changePct)}
                      </span>
                    </Link>
                  </li>
                );
              })
            ) : (
              <li className="glass-panel rounded-xl px-4 py-6 text-sm text-zinc-500">
                No Dex movers available right now.
              </li>
            )}
          </ul>
          <p className="mt-3 text-[11px] text-zinc-600">
            <Link href="/gainers-losers" className="text-teal-300 hover:underline">
              All gainers & losers →
            </Link>
          </p>
        </section>
      )}

      <p className="mt-6 text-[11px] text-zinc-600">
        Publisher RSS/Atom · ~15–30 min refresh · sorted by publish time · not financial advice
      </p>
    </div>
  );
}
