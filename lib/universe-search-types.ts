/** Shared search hit shape — safe for client + server imports. */

export type UniverseSearchHit = {
  id: string;
  kind: "coin" | "token";
  symbol: string;
  name: string;
  chain: string | null;
  address: string | null;
  truncatedContract: string | null;
  chainLabel: string | null;
  priceUsd: number | null;
  imageUrl: string | null;
  href: string;
};
