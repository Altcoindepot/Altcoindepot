const CHAIN_LABELS: Record<string, string> = {
  ethereum: "ETH",
  eth: "ETH",
  solana: "SOL",
  sol: "SOL",
  base: "BASE",
  bsc: "BSC",
  "binance-smart-chain": "BSC",
  arbitrum: "ARB",
  polygon: "POL",
  avalanche: "AVAX",
  optimism: "OP",
  sui: "SUI",
  hyperevm: "HYPE",
  hyperliquid: "HYPE",
  pulsechain: "PLS",
  fantom: "FTM",
  cronos: "CRO",
  blast: "BLAST",
  linea: "LINEA",
  scroll: "SCROLL",
  zksync: "ZK",
  mantle: "MNT",
  injective: "INJ",
  inj: "INJ",
};

export const KNOWN_DEX_CHAINS = new Set(Object.keys(CHAIN_LABELS));

export function formatChainLabel(chainId: string | undefined): string {
  if (!chainId) return "—";
  const key = chainId.trim().toLowerCase();
  return CHAIN_LABELS[key] ?? key.slice(0, 6).toUpperCase();
}
