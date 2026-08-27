/** Chain display metadata for icons + tooltips (DexScreener chainId keys). */

export type ChainMeta = {
  id: string;
  /** Short ticker-style label (SOL, BSC). */
  short: string;
  /** Full name for tooltips. */
  name: string;
  /** Brand accent for letter fallback. */
  color: string;
  /** Optional asset under /public/chains. */
  icon?: string;
};

const CHAINS: Record<string, ChainMeta> = {
  ethereum: { id: "ethereum", short: "ETH", name: "Ethereum", color: "#627EEA", icon: "/chains/ethereum.svg" },
  eth: { id: "ethereum", short: "ETH", name: "Ethereum", color: "#627EEA", icon: "/chains/ethereum.svg" },
  solana: { id: "solana", short: "SOL", name: "Solana", color: "#9945FF", icon: "/chains/solana.svg" },
  sol: { id: "solana", short: "SOL", name: "Solana", color: "#9945FF", icon: "/chains/solana.svg" },
  base: { id: "base", short: "BASE", name: "Base", color: "#0052FF", icon: "/chains/base.svg" },
  bsc: { id: "bsc", short: "BSC", name: "BNB Smart Chain", color: "#F0B90B", icon: "/chains/bsc.svg" },
  "binance-smart-chain": {
    id: "bsc",
    short: "BSC",
    name: "BNB Smart Chain",
    color: "#F0B90B",
    icon: "/chains/bsc.svg",
  },
  arbitrum: { id: "arbitrum", short: "ARB", name: "Arbitrum", color: "#28A0F0", icon: "/chains/arbitrum.svg" },
  polygon: { id: "polygon", short: "POL", name: "Polygon", color: "#8247E5", icon: "/chains/polygon.svg" },
  avalanche: { id: "avalanche", short: "AVAX", name: "Avalanche", color: "#E84142", icon: "/chains/avalanche.svg" },
  optimism: { id: "optimism", short: "OP", name: "Optimism", color: "#FF0420", icon: "/chains/optimism.svg" },
  sui: { id: "sui", short: "SUI", name: "Sui", color: "#4DA2FF", icon: "/chains/sui.svg" },
  hyperevm: { id: "hyperevm", short: "HYPE", name: "HyperEVM", color: "#97FCE4" },
  hyperliquid: { id: "hyperliquid", short: "HYPE", name: "Hyperliquid", color: "#97FCE4" },
  pulsechain: { id: "pulsechain", short: "PLS", name: "PulseChain", color: "#00D4AA" },
  fantom: { id: "fantom", short: "FTM", name: "Fantom", color: "#1969FF" },
  cronos: { id: "cronos", short: "CRO", name: "Cronos", color: "#002D74" },
  blast: { id: "blast", short: "BLAST", name: "Blast", color: "#FCFC03" },
  linea: { id: "linea", short: "LINEA", name: "Linea", color: "#61DFFF" },
  scroll: { id: "scroll", short: "SCROLL", name: "Scroll", color: "#FFEEDA" },
  zksync: { id: "zksync", short: "ZK", name: "zkSync", color: "#8C8DFC" },
  mantle: { id: "mantle", short: "MNT", name: "Mantle", color: "#000000" },
  injective: { id: "injective", short: "INJ", name: "Injective", color: "#00F2FE" },
  inj: { id: "injective", short: "INJ", name: "Injective", color: "#00F2FE" },
};

export function getChainMeta(chainId: string | undefined | null): ChainMeta {
  if (!chainId) {
    return { id: "unknown", short: "—", name: "Unknown chain", color: "#71717a" };
  }
  const key = chainId.trim().toLowerCase();
  if (CHAINS[key]) return CHAINS[key]!;
  const short = key.slice(0, 6).toUpperCase();
  return {
    id: key,
    short,
    name: key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "#71717a",
  };
}
