import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { loadMarketsByGeckoCategory, type CoinMarket } from "@/lib/coingecko";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import {
  getNarrativeBySlug,
  NARRATIVES,
  rotationStatusFromChange,
  statusBadgeClass,
} from "@/lib/narratives";
import { ds } from "@/lib/ui-classes";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return NARRATIVES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const narrative = getNarrativeBySlug(slug);
  if (!narrative) return { title: "Narrative" };
  return {
    title: `${narrative.title} Narrative`,
    description: `${narrative.subtitle}. Track ${narrative.title} coins, market caps, and 7d rotation on AltCoin Depot.`,
    alternates: { canonical: `/narrative/${narrative.slug}` },
  };
}

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default async function NarrativePage({ params }: Props) {
  const { slug } = await params;
  const narrative = getNarrativeBySlug(slug);
  if (!narrative) notFound();

  let coins: CoinMarket[] = [];
  let loadError = false;
  try {
    coins = await loadMarketsByGeckoCategory(narrative.coingeckoCategoryId, 50, {
      next: { revalidate: 3600 },
    });
  } catch {
    loadError = true;
  }

  const sorted = [...coins].sort(
    (a, b) =>
      (b.price_change_percentage_7d_in_currency ?? -999) -
      (a.price_change_percentage_7d_in_currency ?? -999),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          <Link href="/" className="hover:text-[#d7ad82]">
            Dashboard
          </Link>
          <span className="mx-2 text-zinc-700">/</span>
          Narrative
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={`h-4 w-4 rounded-full ${narrative.glowClass}`}
            aria-hidden
          />
          <h1 className="text-brand-altcoindepot text-2xl font-extrabold tracking-tight sm:text-3xl">
            {narrative.title}
          </h1>
          <span className={ds.badgeInfo}>CoinGecko category</span>
        </div>
        <p className={ds.subtitle}>{narrative.subtitle}</p>

        {loadError ? (
          <p className="mt-8 text-sm text-zinc-500">Couldn’t load this narrative right now.</p>
        ) : (
          <div className={`mt-8 overflow-x-auto ${ds.panel} !p-0`}>
            <table className="w-full min-w-[32rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Market Cap</th>
                  <th className="px-4 py-3">7D</th>
                  <th className="px-4 py-3">Rotation</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => {
                  const ch = c.price_change_percentage_7d_in_currency ?? null;
                  const status = rotationStatusFromChange(ch, "7d");
                  return (
                    <tr key={c.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/coin/${encodeURIComponent(c.id)}`}
                          className="inline-flex items-center gap-2"
                        >
                          {c.image ? (
                            <Image src={c.image} alt="" width={22} height={22} className="rounded-full" />
                          ) : null}
                          <span>
                            <span className="block text-sm text-zinc-100">{c.name}</span>
                            <span className="mt-0.5 flex items-center gap-1.5">
                              <span className={`h-4 w-4 rounded-full ${narrative.glowClass}`} />
                              <span className="font-mono text-[11px] uppercase text-zinc-500">
                                {c.symbol}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm tabular-nums text-zinc-200">
                        {c.current_price == null
                          ? "—"
                          : new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: c.current_price < 1 ? 6 : 2,
                            }).format(c.current_price)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-zinc-400">
                        {formatCompactUsd(c.market_cap)}
                      </td>
                      <td
                        className={`px-4 py-3 font-mono text-xs font-semibold tabular-nums ${
                          (ch ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {formatPct(ch)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`ds-badge ${statusBadgeClass(status)}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
