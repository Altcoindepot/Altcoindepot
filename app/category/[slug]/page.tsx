import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CoinSearchBar } from "@/components/coin-search-bar";
import {
  getPublicCategoryBySlug,
  PUBLIC_CATEGORIES,
  sortCoinsBy24hChangeDesc,
} from "@/lib/coin-categories";
import { loadMarketsByGeckoCategory, type CoinMarket } from "@/lib/coingecko";
import { formatCompactUsd } from "@/lib/format-compact-usd";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return PUBLIC_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getPublicCategoryBySlug(slug);
  if (!cat) {
    return { title: "Category" };
  }
  return {
    title: `${cat.title} · Top 100`,
    description: `Top 100 ${cat.title} coins by 24h percentage change on AltCoinDepot (CoinGecko data).`,
  };
}

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function pctTone(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "text-zinc-500";
  return v >= 0 ? "text-emerald-300" : "text-red-300";
}

export const revalidate = 60;

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = getPublicCategoryBySlug(slug);
  if (!cat) {
    notFound();
  }

  let coins: CoinMarket[] = [];
  let loadError = false;
  try {
    coins = await loadMarketsByGeckoCategory(cat.coingeckoCategoryId, 100, {
      next: { revalidate: 60 },
    });
  } catch {
    loadError = true;
  }

  const sorted = sortCoinsBy24hChangeDesc(coins);

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <nav className="text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300">
              Home
            </Link>
            <span className="mx-1.5 text-zinc-600">/</span>
            <span className="text-zinc-400">{cat.title}</span>
          </nav>
          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{cat.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{cat.description}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Top 100 from CoinGecko’s <span className="font-mono text-zinc-400">{cat.coingeckoCategoryId}</span>{" "}
            category · sorted by <span className="text-zinc-300">24h % change</span> (largest gainers first, missing
            values last).
          </p>
          <div className="glass-panel mt-4 w-full max-w-2xl rounded-xl p-3">
            <CoinSearchBar
              variant="wide"
              inputId="category-asset-search"
              placeholder="Search top 3000 assets (e.g. TAO, Kaspa, HYPE)"
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Search the top 3,000 coins by market cap — each opens a full detail page with price,
            ATH/ATL, charts, and feeds.
          </p>

          {loadError ? (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              Could not load this category right now. Please try again shortly.
            </div>
          ) : null}

          {!loadError ? (
            <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#111111] text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-3 py-3 font-medium sm:px-4">#</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Coin</th>
                    <th className="px-3 py-3 text-right font-medium sm:px-4">Price</th>
                    <th className="px-3 py-3 text-right font-medium sm:px-4">24h %</th>
                    <th className="hidden px-3 py-3 text-right font-medium sm:table-cell sm:px-4">Mcap</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((coin, idx) => (
                    <tr
                      key={coin.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-zinc-500 sm:px-4">{idx + 1}</td>
                      <td className="px-3 py-2.5 sm:px-4">
                        <Link
                          href={`/coin/${encodeURIComponent(coin.id)}`}
                          className="flex items-center gap-2.5 rounded-md py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
                        >
                          <Image
                            src={coin.image}
                            alt=""
                            width={26}
                            height={26}
                            className="rounded-full"
                            sizes="26px"
                          />
                          <span>
                            <span className="block font-medium text-zinc-100">{coin.name}</span>
                            <span className="text-[11px] uppercase text-zinc-500">{coin.symbol}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-zinc-200 sm:px-4 sm:text-sm">
                        {formatUsd(coin.current_price)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono text-xs sm:px-4 sm:text-sm ${pctTone(
                          coin.price_change_percentage_24h,
                        )}`}
                      >
                        {formatPct(coin.price_change_percentage_24h)}
                      </td>
                      <td className="hidden px-3 py-2.5 text-right font-mono text-xs text-zinc-400 sm:table-cell sm:px-4 sm:text-sm">
                        {formatCompactUsd(coin.market_cap)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
