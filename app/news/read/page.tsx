import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import {
  findSiteNewsByHref,
  normalizeNewsUrl,
} from "@/lib/site-news";
import {
  chainMoverHref,
  getChainMovers,
  pickHomeTopMovers,
} from "@/lib/dex-chain-movers";
import { formatDexPct } from "@/lib/dex-pair-fields";
import { formatTimeAgo } from "@/lib/format-date";

export const metadata: Metadata = {
  title: { absolute: "Article summary | AltCoin Depot" },
  description: "RSS excerpt and Dex movers — open the full article on the publisher site.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ u?: string | string[] }>;

export default async function NewsReadPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const raw = typeof sp.u === "string" ? sp.u : Array.isArray(sp.u) ? sp.u[0] : "";
  const href = raw?.trim() ?? "";
  const item = href ? await findSiteNewsByHref(href).catch(() => null) : null;

  let movers: Array<{
    id: string;
    symbol: string;
    changePct: number;
    window: string;
    href: string;
  }> = [];
  try {
    const boards = await getChainMovers();
    movers = pickHomeTopMovers(boards, 5)
      .filter((r) => r.venue === "dex" && Boolean(r.address))
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        symbol: r.symbol,
        changePct: r.changePct,
        window: r.window,
        href: chainMoverHref(r),
      }));
  } catch {
    movers = [];
  }

  const external = item?.href || (href && /^https?:\/\//i.test(href) ? href : null);
  const title = item?.title ?? "Article summary";
  const excerpt =
    item?.excerpt?.trim() ||
    "Open the full article on the publisher site. AltCoin Depot shows RSS headlines only — we do not embed or scrape full articles.";

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell border-b border-white/10 px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/news" className="hover:text-teal-200">
              News
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            Summary
          </p>

          {item ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded border border-teal-400/20 bg-teal-500/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-teal-200/90">
                {item.source}
              </span>
              <span className="text-[10px] tabular-nums text-zinc-500">
                {formatTimeAgo(item.publishedAt)}
              </span>
            </div>
          ) : null}

          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{excerpt}</p>

          {external ? (
            <a
              href={external}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full nav-pill-active px-5 text-sm font-semibold"
            >
              Read full article →
            </a>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">
              Article link unavailable.{" "}
              <Link href="/news" className="text-teal-300 hover:underline">
                Back to headlines
              </Link>
            </p>
          )}

          {movers.length > 0 ? (
            <section aria-label="Moving on Dex" className="mt-8">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Moving on Dex
              </h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {movers.map((m) => {
                  const up = m.changePct >= 0;
                  return (
                    <li key={m.id}>
                      <Link
                        href={m.href}
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums ${
                          up
                            ? "border-teal-400/30 bg-teal-500/10 text-teal-200"
                            : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                        }`}
                      >
                        <span className="uppercase text-zinc-100">{m.symbol}</span>
                        <span>{formatDexPct(m.changePct)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <p className="mt-8 text-[11px] text-zinc-600">
            RSS excerpt only · no iframe · not financial advice
            {href ? (
              <>
                {" "}
                · <span className="break-all text-zinc-700">{normalizeNewsUrl(href)}</span>
              </>
            ) : null}
          </p>
        </div>
      </main>
    </>
  );
}
