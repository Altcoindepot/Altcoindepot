import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DexTokenView } from "@/components/dex-token-view";
import { formatChainLabel } from "@/lib/format-chain";
import { getDexScreenerTokenPage } from "@/lib/dexscreener-token";
import { getGeckoCoinStats } from "@/lib/gecko-coin-stats";
import { getGeckoTerminalTrades, type DexTrade } from "@/lib/geckoterminal-trades";
import { buildTokenSeoCopy } from "@/lib/token-seo";

type Props = { params: Promise<{ chain: string; address: string }> };

export const dynamic = "force-dynamic";

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

    const geckoStats = await getGeckoCoinStats({
      chain: token.chain,
      address: token.address,
    }).catch(() => null);

    const seo = buildTokenSeoCopy({
      name: token.name,
      symbol: token.symbol,
      chainLabel: formatChainLabel(token.chain),
      listedOnGecko: Boolean(geckoStats),
    });
    const path = `/token/${encodeURIComponent(token.chain)}/${encodeURIComponent(token.address)}`;
    return {
      title: { absolute: seo.title },
      description: seo.description,
      alternates: { canonical: path },
      robots: { index: token.inLowCapsList || Boolean(geckoStats), follow: true },
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
    chainLabel: formatChainLabel(token.chain),
    listedOnGecko: Boolean(geckoStats),
  });

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-4 py-8 sm:px-6">
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
