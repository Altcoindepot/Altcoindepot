/** Homepage + /category/[slug] — `coingeckoCategoryId` is CoinGecko’s `/coins/markets?category=` id. */
export type PublicCategoryDef = {
  slug: string;
  title: string;
  coingeckoCategoryId: string;
  description: string;
  accentClass: string;
  /** Coins shown on the homepage (top by market cap within the category; max 15 in UI). */
  spotlightLimit: number;
};

export const PUBLIC_CATEGORIES: readonly PublicCategoryDef[] = [
  {
    slug: "layer-1",
    title: "Layer 1",
    coingeckoCategoryId: "layer-1",
    description: "Base-layer chains and native L1 assets — Injective, Solana, Ethereum, and peers.",
    accentClass:
      "hover:border-[#00ff9f]/25 hover:shadow-[0_0_28px_rgba(0,255,159,0.08)]",
    spotlightLimit: 15,
  },
  {
    slug: "meme-coins",
    title: "Meme coins",
    coingeckoCategoryId: "meme-token",
    description: "Community-driven meme tokens tracked in CoinGecko’s meme category.",
    accentClass:
      "hover:border-amber-400/30 hover:shadow-[0_0_28px_rgba(251,191,36,0.1)]",
    spotlightLimit: 15,
  },
  {
    slug: "rwa",
    title: "RWA",
    coingeckoCategoryId: "real-world-assets-rwa",
    description: "Real-world asset and tokenization names CoinGecko groups as RWA.",
    accentClass:
      "hover:border-sky-400/30 hover:shadow-[0_0_28px_rgba(56,189,248,0.1)]",
    spotlightLimit: 15,
  },
  {
    slug: "stablecoins",
    title: "Stablecoins",
    coingeckoCategoryId: "stablecoins",
    description: "USD-pegged and other stability-focused tokens.",
    accentClass:
      "hover:border-cyan-400/25 hover:shadow-[0_0_28px_rgba(34,211,238,0.08)]",
    spotlightLimit: 15,
  },
  {
    slug: "depin",
    title: "DePIN",
    coingeckoCategoryId: "depin",
    description: "Decentralized physical infrastructure — storage, wireless, compute, and bandwidth.",
    accentClass:
      "hover:border-[#a855f7]/35 hover:shadow-[0_0_28px_rgba(168,85,247,0.12)]",
    spotlightLimit: 15,
  },
  {
    slug: "ai",
    title: "AI",
    coingeckoCategoryId: "artificial-intelligence",
    description: "Artificial intelligence and agent-related tokens on CoinGecko.",
    accentClass:
      "hover:border-[#39ff14]/35 hover:shadow-[0_0_28px_rgba(57,255,20,0.12)]",
    spotlightLimit: 15,
  },
] as const;

export function getPublicCategoryBySlug(slug: string): PublicCategoryDef | undefined {
  const s = slug.trim().toLowerCase();
  return PUBLIC_CATEGORIES.find((c) => c.slug === s);
}

/** Top gainers first; null / NaN 24h % last (same rule as the price tracker table). */
export function sortCoinsBy24hChangeDesc<
  T extends { price_change_percentage_24h: number | null },
>(coins: readonly T[]): T[] {
  return [...coins].sort((a, b) => {
    const pa = a.price_change_percentage_24h;
    const pb = b.price_change_percentage_24h;
    const aBad = pa == null || Number.isNaN(pa);
    const bBad = pb == null || Number.isNaN(pb);
    if (aBad && bBad) return 0;
    if (aBad) return 1;
    if (bBad) return -1;
    return pb - pa;
  });
}
