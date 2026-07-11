import type { CoinGeckoDetail } from "@/lib/coingecko";

/** Curated homepage ecosystems: CoinGecko `id`, display label, official X handle (no @). */

export type EcosystemEntry = {
  id: string;
  label: string;
  twitter: string;
};

export const LAYER1_ECOSYSTEM: EcosystemEntry[] = [
  { id: "bitcoin", label: "Bitcoin", twitter: "bitcoin" },
  { id: "ethereum", label: "Ethereum", twitter: "ethereum" },
  { id: "solana", label: "Solana", twitter: "solana" },
  { id: "binancecoin", label: "BNB", twitter: "BNBCHAIN" },
  { id: "cardano", label: "Cardano", twitter: "Cardano" },
  { id: "avalanche-2", label: "Avalanche", twitter: "avax" },
  { id: "polkadot", label: "Polkadot", twitter: "Polkadot" },
  { id: "cosmos", label: "Cosmos Hub", twitter: "cosmos" },
  { id: "sui", label: "Sui", twitter: "SuiNetwork" },
  { id: "aptos", label: "Aptos", twitter: "Aptos" },
  { id: "near", label: "NEAR", twitter: "NEARProtocol" },
  { id: "tron", label: "Tron", twitter: "trondao" },
  { id: "the-open-network", label: "Toncoin", twitter: "ton_blockchain" },
  { id: "injective-protocol", label: "Injective", twitter: "Injective_" },
  { id: "sei-network", label: "Sei", twitter: "SeiNetwork" },
  { id: "fantom", label: "Fantom", twitter: "FantomFDN" },
  { id: "algorand", label: "Algorand", twitter: "Algorand" },
  { id: "hedera-hashgraph", label: "Hedera", twitter: "hedera" },
  { id: "celo", label: "Celo", twitter: "CeloOrg" },
  { id: "crypto-com-chain", label: "Cronos", twitter: "cronos_chain" },
  { id: "zcash", label: "Zcash", twitter: "zcash" },
  { id: "litecoin", label: "Litecoin", twitter: "litecoin" },
  { id: "dogecoin", label: "Dogecoin", twitter: "dogecoin" },
  { id: "ripple", label: "XRP", twitter: "Ripple" },
  { id: "stellar", label: "Stellar", twitter: "StellarOrg" },
];

export const DEPIN_ECOSYSTEM: EcosystemEntry[] = [
  { id: "reppo", label: "REPPO", twitter: "reppo" },
  { id: "filecoin", label: "Filecoin", twitter: "Filecoin" },
  { id: "arweave", label: "Arweave", twitter: "ArweaveEco" },
  { id: "helium", label: "Helium", twitter: "helium" },
  { id: "render-token", label: "Render", twitter: "rendernetwork" },
  { id: "theta-token", label: "Theta", twitter: "Theta_Network" },
  { id: "iotex", label: "IoTeX", twitter: "iotex_io" },
  { id: "hivemapper", label: "Hivemapper", twitter: "hivemapper" },
  { id: "grass", label: "Grass", twitter: "getgrass_io" },
  { id: "peaq", label: "peaq", twitter: "peaq" },
  { id: "akash-network", label: "Akash", twitter: "akashnet_" },
  { id: "storj", label: "Storj", twitter: "storj" },
  { id: "siacoin", label: "Siacoin", twitter: "Sia__Foundation" },
  { id: "livepeer", label: "Livepeer", twitter: "Livepeer" },
  { id: "nosana", label: "Nosana", twitter: "nosana_ai" },
  { id: "dimo-network", label: "DIMO", twitter: "DIMO_Network" },
  { id: "weatherxm-network", label: "WeatherXM", twitter: "weatherxm" },
  { id: "geodnet", label: "GEODNET", twitter: "GEODNET" },
  { id: "streamr", label: "Streamr", twitter: "Streamr" },
];

export const AI_ECOSYSTEM: EcosystemEntry[] = [
  { id: "reppo", label: "REPPO", twitter: "reppo" },
  { id: "bittensor", label: "Bittensor", twitter: "opentensor" },
  { id: "near", label: "NEAR", twitter: "NEARProtocol" },
  { id: "render-token", label: "Render", twitter: "rendernetwork" },
  { id: "fetch-ai", label: "Fetch.ai", twitter: "Fetch_ai" },
  { id: "the-graph", label: "The Graph", twitter: "graphprotocol" },
  { id: "injective-protocol", label: "Injective", twitter: "Injective_" },
  { id: "theta-token", label: "Theta", twitter: "Theta_Network" },
  { id: "virtual-protocol", label: "Virtuals", twitter: "virtuals_io" },
  { id: "ocean-protocol", label: "Ocean", twitter: "oceanprotocol" },
  { id: "origintrail", label: "OriginTrail", twitter: "origin_trail" },
  { id: "arkham", label: "Arkham", twitter: "ArkhamIntel" },
  { id: "nosana", label: "Nosana", twitter: "nosana_ai" },
  { id: "aixbt", label: "AIXBT", twitter: "aixbt_agent" },
  { id: "delysium", label: "Delysium", twitter: "The_Delysium" },
  { id: "paal-ai", label: "PAAL AI", twitter: "PaalMind" },
];

/** Extra X handles for assets that often appear in top market-cap rows but aren’t in the lists above. */
const EXTRA_TWITTER_BY_GECKO_ID: Record<string, string> = {
  tether: "Tether_to",
  "usd-coin": "circle",
  chainlink: "chainlink",
  uniswap: "Uniswap",
  "wrapped-bitcoin": "Bitcoin",
  "lido-dao": "LidoFinance",
  "shiba-inu": "Shibtoken",
  "matic-network": "0xPolygon",
  "ethereum-classic": "eth_classic",
  monero: "monero",
  "leo-token": "bitfinex",
  "okb": "okx",
};

const HANDLE_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = { ...EXTRA_TWITTER_BY_GECKO_ID };
  for (const e of LAYER1_ECOSYSTEM) m[e.id] = e.twitter;
  for (const e of DEPIN_ECOSYSTEM) m[e.id] = e.twitter;
  for (const e of AI_ECOSYSTEM) m[e.id] = e.twitter;
  return m;
})();

export function getTwitterHandleForGeckoId(id: string): string | undefined {
  return HANDLE_MAP[id];
}

/**
 * Prefer CoinGecko’s `links.twitter_screen_name`, then the curated handle map.
 * Used so coin pages can show that project’s latest posts when X/Nitter RSS is available.
 */
export function resolveProjectTwitterHandle(coin: CoinGeckoDetail): string | undefined {
  const raw = coin.links?.twitter_screen_name?.trim();
  if (raw) {
    const cleaned = raw.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "");
    if (cleaned.length >= 1) return cleaned;
  }
  return getTwitterHandleForGeckoId(coin.id);
}
