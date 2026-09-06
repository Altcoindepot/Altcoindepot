/**
 * Multi-intent SEO for /coin and /token pages.
 * Titles cover name, ticker, price/chart/contract — not “price today” spam.
 * Descriptions vary by asset id and always include name, ticker, live price, USD, chain, contract.
 */

export type AssetSeoCopy = {
  title: string;
  description: string;
  h1: string;
};

export type AssetSeoInput = {
  name: string;
  symbol: string;
  /** Stable id for description variation (coin id or chain:address). */
  variationKey?: string;
  /** Human chain label, e.g. Ethereum / Solana / BSC. */
  chainLabel?: string | null;
  contractAddress?: string | null;
  /** CoinGecko-listed fundamentals available. */
  listedOnGecko: boolean;
  /** Optional CoinGecko id for alias phrases (XRP/Ripple, BNB/Binance Coin). */
  coinId?: string | null;
};

const BASELINE: AssetSeoCopy = {
  title: "Live Dex Price & Contract | AltCoin Depot",
  description:
    "Check live price in USD, chain, and contract address on AltCoin Depot. Informational only — not financial advice.",
  h1: "Live Dex Price",
};

/** Known public aliases — include the missing form once in the description. */
const ALIAS_BY_ID: Record<string, [string, string]> = {
  ripple: ["XRP", "Ripple"],
  binancecoin: ["BNB", "Binance Coin"],
};

const SEO_CHAIN_NAMES: Record<string, string> = {
  ethereum: "Ethereum",
  solana: "Solana",
  bsc: "BSC",
  base: "Base",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  avalanche: "Avalanche",
  optimism: "Optimism",
  fantom: "Fantom",
  injective: "Injective",
  sui: "Sui",
  bitcoin: "Bitcoin",
};

function clampLen(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function seoChainLabel(chainId: string | undefined | null): string {
  if (!chainId?.trim()) return "DEX";
  const key = chainId.trim().toLowerCase();
  return SEO_CHAIN_NAMES[key] ?? key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortContract(address: string | null | undefined): string | null {
  const a = address?.trim() ?? "";
  if (!a) return null;
  if (a.startsWith("0x") && a.length > 12) return `${a.slice(0, 6)}…${a.slice(-4)}`;
  if (a.length > 12) return `${a.slice(0, 4)}…${a.slice(-4)}`;
  return a;
}

function aliasAside(coinId: string | null | undefined, name: string, ticker: string): string {
  if (!coinId) return "";
  const pair = ALIAS_BY_ID[coinId.toLowerCase()];
  if (!pair) return "";
  const blob = `${name} ${ticker}`.toLowerCase();
  const [a, b] = pair;
  if (!blob.includes(a.toLowerCase())) return ` Also known as ${a}.`;
  if (!blob.includes(b.toLowerCase())) return ` Also known as ${b}.`;
  return "";
}

/**
 * Build title / description / H1 for coin or token pages.
 */
export function buildAssetSeoCopy(input: AssetSeoInput): AssetSeoCopy {
  try {
    const name = (input.name ?? "").toString().trim() || "Token";
    const ticker = (input.symbol ?? "").toString().trim().toUpperCase() || "TOKEN";
    const label = `${name} (${ticker})`;
    const chain = (input.chainLabel ?? "").trim() || "DEX";
    const listed = Boolean(input.listedOnGecko);
    const key = (input.variationKey ?? `${name}-${ticker}-${chain}`).toLowerCase();
    const variant = hashKey(key) % 3;
    const alias = aliasAside(input.coinId, name, ticker);
    const contractShort = shortContract(input.contractAddress);
    const contractBit = contractShort
      ? `contract address ${contractShort}`
      : "contract address";

    const title = listed
      ? `${label} Price, Chart & Contract | AltCoin Depot`
      : `${label} Contract Address & Live Dex Price | AltCoin Depot`;

    const dexOnly = listed ? "" : " Not on CoinGecko yet.";

    const descriptions = [
      `See the live ${name} (${ticker}) price in USD on ${chain}, plus the ${contractBit}.${alias}${dexOnly} Informational only — not financial advice.`,
      `Check ${name} (${ticker}) live price in USD on ${chain} and the ${contractBit}.${alias}${dexOnly} Charts and pair data on AltCoin Depot.`,
      `${name} (${ticker}) live price in USD on ${chain} — review the ${contractBit} before you act.${alias}${dexOnly} Informational only.`,
    ];
    const description = descriptions[variant] ?? descriptions[0]!;

    return {
      title: clampLen(title, 70),
      description: clampLen(description, 165),
      h1: label,
    };
  } catch {
    return BASELINE;
  }
}
