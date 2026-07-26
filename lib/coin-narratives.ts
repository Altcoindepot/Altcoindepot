/** Display labels aligned with CoinGecko category naming. */
export type CoinCategoryLabel =
  | "Layer 1"
  | "Layer 2"
  | "AI"
  | "RWA"
  | "Meme"
  | "DeFi"
  | "DePIN"
  | "Privacy"
  | "Infrastructure"
  | "Stablecoin"
  | "Gaming"
  | "Oracle"
  | "DEX"
  | "NFT"
  | "Liquid Staking";

/** @deprecated Prefer CoinCategoryLabel */
export type NarrativeTag = CoinCategoryLabel;

type TagRule = {
  tag: CoinCategoryLabel;
  /** CoinGecko category id/name fragments (lowercase). */
  categories?: string[];
  /** Exact CoinGecko ids. */
  ids?: string[];
};

/** Map raw CoinGecko category strings → short site labels. */
const CG_CATEGORY_LABELS: Array<{ match: RegExp | string; label: CoinCategoryLabel }> = [
  { match: /layer[- ]?1|smart[- ]?contract[- ]?platform/i, label: "Layer 1" },
  { match: /layer[- ]?2|optimistic|zero[- ]?knowledge|zk[- ]?rollup/i, label: "Layer 2" },
  { match: /artificial[- ]?intelligence|\bai\b/i, label: "AI" },
  { match: /real[- ]?world|rwa/i, label: "RWA" },
  { match: /meme/i, label: "Meme" },
  { match: /decentralized[- ]?finance|\bdefi\b/i, label: "DeFi" },
  { match: /depin|decentralized[- ]?physical/i, label: "DePIN" },
  { match: /privacy/i, label: "Privacy" },
  { match: /infrastructure/i, label: "Infrastructure" },
  { match: /stablecoin/i, label: "Stablecoin" },
  { match: /gaming|play[- ]?to[- ]?earn/i, label: "Gaming" },
  { match: /oracle/i, label: "Oracle" },
  { match: /decentralized[- ]?exchange|\bdex\b/i, label: "DEX" },
  { match: /\bnft\b|non[- ]?fungible/i, label: "NFT" },
  { match: /liquid[- ]?staking/i, label: "Liquid Staking" },
];

const RULES: TagRule[] = [
  {
    tag: "AI",
    categories: ["artificial-intelligence", "ai"],
    ids: ["bittensor", "fetch-ai", "render-token", "near", "nosana"],
  },
  {
    tag: "RWA",
    categories: ["real-world-assets-rwa", "rwa"],
    ids: ["ondo-finance", "mantra-dao", "centrifuge"],
  },
  {
    tag: "Meme",
    categories: ["meme-token", "memes"],
    ids: ["dogecoin", "shiba-inu", "pepe", "bonk", "dogwifcoin"],
  },
  {
    tag: "Layer 1",
    categories: ["layer-1"],
    ids: [
      "bitcoin",
      "ethereum",
      "solana",
      "cardano",
      "avalanche-2",
      "injective-protocol",
      "near",
      "sui",
      "aptos",
      "tron",
      "hedera-hashgraph",
      "stellar",
      "litecoin",
      "monero",
      "bitcoin-cash",
    ],
  },
  {
    tag: "Layer 2",
    categories: ["layer-2", "optimistic-rollup", "zero-knowledge-zk"],
    ids: ["arbitrum", "optimism", "matic-network", "polygon-ecosystem-token", "starknet", "zksync"],
  },
  {
    tag: "DeFi",
    categories: ["decentralized-finance-defi", "defi"],
    ids: ["uniswap", "aave", "maker", "curve-dao-token", "lido-dao", "hyperliquid", "dexe"],
  },
  {
    tag: "DEX",
    categories: ["decentralized-exchange-dex-token"],
    ids: ["uniswap", "curve-dao-token", "pancakeswap-token", "dexe", "jupiter-exchange-solana"],
  },
  {
    tag: "DePIN",
    categories: ["depin"],
    ids: ["helium", "filecoin", "arweave", "render-token", "nosana"],
  },
  {
    tag: "Privacy",
    categories: ["privacy-coins"],
    ids: ["monero", "zcash", "secret", "railgun"],
  },
  {
    tag: "Infrastructure",
    categories: ["infrastructure"],
    ids: ["cosmos", "polkadot"],
  },
  {
    tag: "Oracle",
    categories: ["oracle"],
    ids: ["chainlink", "pyth-network", "band-protocol"],
  },
  {
    tag: "Stablecoin",
    categories: ["stablecoins"],
    ids: ["tether", "usd-coin", "dai", "ethena-usde"],
  },
  {
    tag: "Gaming",
    categories: ["gaming", "play-to-earn"],
    ids: ["immutable-x", "gala", "axie-infinity"],
  },
  {
    tag: "Liquid Staking",
    categories: ["liquid-staking-tokens", "liquid-staking"],
    ids: ["lido-dao", "rocket-pool-eth", "marinade"],
  },
];

function labelFromCoinGeckoCategory(raw: string): CoinCategoryLabel | null {
  const s = raw.trim();
  if (!s) return null;
  for (const row of CG_CATEGORY_LABELS) {
    if (typeof row.match === "string") {
      if (s.toLowerCase().includes(row.match)) return row.label;
    } else if (row.match.test(s)) {
      return row.label;
    }
  }
  return null;
}

/** Resolve CoinGecko-style category labels for a coin. */
export function resolveNarrativeTags(input: {
  id: string;
  categories?: string[] | null;
}): CoinCategoryLabel[] {
  const id = input.id.toLowerCase();
  const cats = (input.categories ?? []).map((c) => c.trim()).filter(Boolean);
  const tags: CoinCategoryLabel[] = [];

  for (const cat of cats) {
    const label = labelFromCoinGeckoCategory(cat);
    if (label) tags.push(label);
  }

  for (const rule of RULES) {
    const idHit = rule.ids?.includes(id);
    const catHit = rule.categories?.some((frag) =>
      cats.some((c) => {
        const lower = c.toLowerCase();
        return lower === frag || lower.includes(frag) || frag.includes(lower);
      }),
    );
    if (idHit || catHit) tags.push(rule.tag);
  }

  return [...new Set(tags)].slice(0, 3);
}

export function narrativeTagClass(tag: CoinCategoryLabel): string {
  switch (tag) {
    case "AI":
      return "border-lime-400/35 text-lime-200";
    case "RWA":
      return "border-sky-400/35 text-sky-200";
    case "Meme":
      return "border-amber-400/35 text-amber-200";
    case "Layer 1":
      return "border-emerald-400/35 text-emerald-200";
    case "Layer 2":
      return "border-violet-400/35 text-violet-200";
    case "DeFi":
      return "border-cyan-400/35 text-cyan-200";
    case "DEX":
      return "border-cyan-300/35 text-cyan-100";
    case "DePIN":
      return "border-fuchsia-400/35 text-fuchsia-200";
    case "Privacy":
      return "border-zinc-400/35 text-zinc-200";
    case "Infrastructure":
      return "border-[#d1a173]/40 text-[#d7ad82]";
    case "Oracle":
      return "border-orange-400/35 text-orange-200";
    case "Stablecoin":
      return "border-teal-400/35 text-teal-200";
    case "Gaming":
      return "border-pink-400/35 text-pink-200";
    case "NFT":
      return "border-rose-400/35 text-rose-200";
    case "Liquid Staking":
      return "border-indigo-400/35 text-indigo-200";
  }
}
