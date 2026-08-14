import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DexTokenView } from "@/components/dex-token-view";
import { formatChainLabel } from "@/lib/format-chain";
import { getDexScreenerTokenPage } from "@/lib/dexscreener-token";
import { getDexScreenerTrades, type DexTrade } from "@/lib/dexscreener-trades";

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
    const symbol = token.symbol.toUpperCase();
    const chainLabel = formatChainLabel(token.chain);
    const title = `${token.name} (${symbol}) – Low Cap Token | AltCoin Depot`;
    const description = `Live DEX pair page for ${token.name} (${symbol}) on ${chainLabel}. Liquidity, volume, and 24h change from DexScreener. Informational only — not financial advice.`;
    const path = `/token/${encodeURIComponent(token.chain)}/${encodeURIComponent(token.address)}`;
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: path },
      robots: { index: token.inLowCapsList, follow: true },
      openGraph: {
        title,
        description,
        url: `https://altcoindepot.com${path}`,
        siteName: "AltCoin Depot",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: { absolute: "Low cap token | AltCoin Depot" },
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

  let trades: DexTrade[] = [];
  try {
    trades = await getDexScreenerTrades(token.chain, token.pairAddress);
  } catch (err) {
    console.warn("[token] DexScreener trades failed", err);
    trades = [];
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-4 py-8 sm:px-6">
        <DexTokenView token={token} trades={trades} />
      </main>
    </>
  );
}
