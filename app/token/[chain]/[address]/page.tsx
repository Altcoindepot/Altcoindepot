import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DexTokenView } from "@/components/dex-token-view";
import { getDexScreenerTokenPage } from "@/lib/dexscreener-token";
import { getGeckoCoinStats } from "@/lib/gecko-coin-stats";
import { getGeckoTerminalTrades, type DexTrade } from "@/lib/geckoterminal-trades";
import { buildTokenSeoCopy } from "@/lib/token-seo";
import { dexTokenPath, isCanonicalTokenRoute } from "@/lib/dex-token-path";
import { seoChainLabel } from "@/lib/asset-seo";

type Props = { params: Promise<{ chain: string; address: string }> };

export const dynamic = "force-dynamic";

function redirectAliasToCanonical(
  chainRaw: string,
  addressRaw: string,
  token: { chain: string; address: string },
) {
  if (isCanonicalTokenRoute(chainRaw, addressRaw, token.chain, token.address)) return;
  const path = dexTokenPath(token.chain, token.address);
  if (path) permanentRedirect(path);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chain, address } = await params;
  try {
    const token = await getDexScreenerTokenPage(chain, address);
    if (!token) {
      return {
        title: { absolute: "Token not found | AltCoin Depot" },
        description: "This DEX token page could not be found on AltCoin Depot.",
        robots: { index: false, follow: true },
      };
    }

    redirectAliasToCanonical(chain, address, token);

    const path = dexTokenPath(token.chain, token.address);
    if (!path) {
      return {
        title: { absolute: "Token not found | AltCoin Depot" },
        description: "This DEX token page could not be found on AltCoin Depot.",
        robots: { index: false, follow: true },
      };
    }

    const geckoStats = await getGeckoCoinStats({
      chain: token.chain,
      address: token.address,
    }).catch(() => null);

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
  } catch {
    return {
      title: { absolute: "Live Dex token | AltCoin Depot" },
      description: "Live DEX pair page on AltCoin Depot. Informational only — not financial advice.",
      robots: { index: false, follow: true },
    };
  }
}

export default async function DexTokenPage({ params }: Props) {
  const { chain, address } = await params;
  let token;
  try {
    token = await getDexScreenerTokenPage(chain, address);
  } catch (err) {
    console.warn("[token] DexScreener page failed", err);
    token = null;
  }
  if (!token) notFound();

  redirectAliasToCanonical(chain, address, token);

  const [trades, geckoStats] = await Promise.all([
    getGeckoTerminalTrades(token.chain, token.pairAddress).catch((err) => {
      console.warn("[token] GeckoTerminal trades failed", err);
      return [] as DexTrade[];
    }),
    getGeckoCoinStats({ chain: token.chain, address: token.address }).catch((err) => {
      console.warn("[token] CoinGecko stats failed", err);
      return null;
    }),
  ]);

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
        />
      </main>
    </>
  );
}
