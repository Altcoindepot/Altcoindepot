/** Curated suggestions for empty watchlist / portfolio / recently viewed states. */
export const SUGGESTED_COIN_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "ripple",
  "injective-protocol",
] as const;

export type SuggestedCoinSeed = {
  id: string;
  name: string;
  symbol: string;
};

export const SUGGESTED_COIN_SEEDS: SuggestedCoinSeed[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "btc" },
  { id: "ethereum", name: "Ethereum", symbol: "eth" },
  { id: "solana", name: "Solana", symbol: "sol" },
  { id: "ripple", name: "XRP", symbol: "xrp" },
  { id: "injective-protocol", name: "Injective", symbol: "inj" },
];
