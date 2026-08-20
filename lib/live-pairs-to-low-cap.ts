import type { LowCapRow } from "@/lib/dashboard-data";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";

/** Map live Dex pair rows into LowCapRow for existing table components. */
export function livePairsToLowCapRows(live: DexLivePairRow[]): LowCapRow[] {
  return live.map((r) => ({
    id: r.id,
    name: r.name,
    symbol: r.symbol,
    image: "",
    marketCap: null,
    liquidity: r.liquidityUsd,
    chain: r.chain,
    contractAddress: r.address,
    dexId: r.dex,
    dexLabel: r.dexLabel,
    change7d: r.change24h,
    volume: r.volume24h,
    priceUsd: r.priceUsd,
    narrativeSlug: "dex",
    narrativeTitle: "DEX",
    narrativeColor: "#14b8a6",
    narrativeGlowClass: "",
    status: "NEUTRAL" as const,
    addedLabel: r.ageLabel,
    pairCreatedAt: r.pairCreatedAt,
    sparkline: null,
  }));
}
