import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DexTokenView } from "@/components/dex-token-view";
import type { TokenStayMover } from "@/components/token-stay-rail";
import { getDexScreenerTokenPage } from "@/lib/dexscreener-token";
import { peekGeckoCoinStatsCached } from "@/lib/gecko-coin-stats";
import { getGeckoTerminalTrades, type DexTrade } from "@/lib/geckoterminal-trades";
import { buildTokenSeoCopy } from "@/lib/token-seo";
import { dexTokenPath, isCanonicalTokenRoute, sameTokenAddress } from "@/lib/dex-token-path";
import { seoChainLabel } from "@/lib/asset-seo";
import {
  chainMoverHref,
  getChainMovers,
  type ChainMoverRow,
} from "@/lib/dex-chain-movers";
import { getTokenMentionHeadlines } from "@/lib/token-news";

type Props = {
  params: Promise<{ chain: string; address: string }>;
  searchParams: Promise<{ pair?: string | string[] }>;
};

export const dynamic = "force-dynamic";

function pairParam(sp: { pair?: string | string[] }): string | null {
  const raw = typeof sp.pair === "string" ? sp.pair : Array.isArray(sp.pair) ? sp.pair[0] : "";
  const v = raw?.trim() ?? "";
  return v || null;
}

function redirectAliasToCanonical(
  chainRaw: string,
  addressRaw: string,
  token: { chain: string; address: string },
  preferPair: string | null,
) {
  if (isCanonicalTokenRoute(chainRaw, addressRaw, token.chain, token.address)) return;
  const path = dexTokenPath(token.chain, token.address);
  if (!path) return;
  if (preferPair) permanentRedirect(`${path}?pair=${encodeURIComponent(preferPair)}`);
  permanentRedirect(path);
}

function sameChainMovers(
  boards: Awaited<ReturnType<typeof getChainMovers>>,
  chain: string,
  excludeAddress: string,
  limit = 4,
): TokenStayMover[] {
  const board = boards.find((b) => b.chainId === chain);
  if (!board) return [];
  const pool: ChainMoverRow[] = [...board.gainers, ...board.losers]
    .filter((row) => row.venue === "dex" && row.address)
    .filter((row) => !sameTokenAddress(row.address, excludeAddress))
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  const seen = new Set<string>();
  const out: TokenStayMover[] = [];
  for (const row of pool) {
    const href = chainMoverHref(row);
    if (!href.startsWith("/token/")) continue;
    const key = row.address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      symbol: row.symbol.toUpperCase(),
      name: row.name,
      href,
      changePct: row.changePct,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { chain, address } = await params;
  const preferPair = pairParam(await searchParams);

  // Never emit robots noindex here — HTTP 200 token pages must stay indexable.
  // Real misses use notFound() (Next injects noindex on the 404). Do not catch
  // permanentRedirect / notFound digests.
  let token: Awaited<ReturnType<typeof getDexScreenerTokenPage>> = null;
  try {
    token = await getDexScreenerTokenPage(chain, address, preferPair);
  } catch (err) {
    console.warn("[token] metadata Dex lookup failed", err);
  }

  if (!token) {
    const fallbackPath = dexTokenPath(chain, address);
    return {
      title: { absolute: "Live Dex token | AltCoin Depot" },
      description:
        "Live DEX pair page on AltCoin Depot. Informational only — not financial advice.",
      ...(fallbackPath
        ? { alternates: { canonical: fallbackPath }, robots: { index: true, follow: true } }
        : { robots: { index: true, follow: true } }),
    };
  }

  redirectAliasToCanonical(chain, address, token, preferPair);

  const path = dexTokenPath(token.chain, token.address);
  if (!path) {
    return {
      title: { absolute: "Live Dex token | AltCoin Depot" },
      description:
        "Live DEX pair page on AltCoin Depot. Informational only — not financial advice.",
      robots: { index: true, follow: true },
    };
  }

  const geckoStats = peekGeckoCoinStatsCached({
    chain: token.chain,
    address: token.address,
  });

  const seo = buildTokenSeoCopy({
    name: token.name,
    symbol: token.symbol,
    chainLabel: seoChainLabel(token.chain),
    chainId: token.chain,
    contractAddress: token.address,
    listedOnGecko: Boolean(geckoStats),
  });
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://altcoindepot.com${path}`,
      siteName: "AltCoin Depot",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}

function softTimeout<T>(promise: Promise<T>, ms: number, fallback: T, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        console.warn(`[token] ${label} soft timeout`);
        resolve(fallback);
      }, ms);
    }),
  ]);
}

export default async function DexTokenPage({ params, searchParams }: Props) {
  const { chain, address } = await params;
  const preferPair = pairParam(await searchParams);
  let token;
  try {
    token = await getDexScreenerTokenPage(chain, address, preferPair);
  } catch (err) {
    console.warn("[token] DexScreener page failed", err);
    token = null;
  }
  if (!token) notFound();

  redirectAliasToCanonical(chain, address, token, preferPair);

  const geckoStats = peekGeckoCoinStatsCached({
    chain: token.chain,
    address: token.address,
  });

  const [trades, moversBoards, headlines] = await Promise.all([
    getGeckoTerminalTrades(token.chain, token.pairAddress).catch((err) => {
      console.warn("[token] GeckoTerminal trades failed", err);
      return [] as DexTrade[];
    }),
    softTimeout(
      getChainMovers().catch((err) => {
        console.warn("[token] chain movers failed", err);
        return [];
      }),
      4000,
      [],
      "chain movers",
    ),
    softTimeout(
      getTokenMentionHeadlines({
        symbol: token.symbol,
        name: token.name,
        limit: 3,
      }).catch(() => []),
      3000,
      [],
      "token headlines",
    ),
  ]);

  const movers = sameChainMovers(moversBoards, token.chain, token.address);

  const seo = buildTokenSeoCopy({
    name: token.name,
    symbol: token.symbol,
    chainLabel: seoChainLabel(token.chain),
    chainId: token.chain,
    contractAddress: token.address,
    listedOnGecko: Boolean(geckoStats),
  });

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell border-b border-white/10 px-4 py-8 sm:px-6">
        <DexTokenView
          token={token}
          trades={trades}
          geckoStats={geckoStats}
          pageH1={seo.h1}
          movers={movers}
          headlines={headlines}
        />
      </main>
    </>
  );
}
