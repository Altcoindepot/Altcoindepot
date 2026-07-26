export type NarrativeTag =
  | "AI"
  | "RWA"
  | "Meme"
  | "L1"
  | "L2"
  | "DeFi"
  | "DePIN"
  | "Privacy"
  | "Infrastructure"
  | "Stablecoin";

type TagRule = {
  tag: NarrativeTag;
  /** CoinGecko category id/name fragments (lowercase). */
  categories?: string[];
  /** Exact CoinGecko ids. */
  ids?: string[];
};

const RULES: TagRule[] = [
  {
    tag: "AI",
    categories: ["artificial-intelligence", "ai"],
    ids: ["bittensor", "fetch-ai", "render-token", "the-graph", "near"],
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
    tag: "L1",
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
    ],
  },
  {
    tag: "L2",
    categories: ["layer-2", "optimistic-rollup", "zero-knowledge-zk"],
    ids: ["arbitrum", "optimism", "matic-network", "polygon-ecosystem-token", "starknet", "zksync"],
  },
  {
    tag: "DeFi",
    categories: ["decentralized-finance-defi", "defi", "decentralized-exchange-dex-token"],
    ids: ["uniswap", "aave", "maker", "curve-dao-token", "lido-dao", "hyperliquid"],
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
    categories: ["infrastructure", "oracle", "interop"],
    ids: ["chainlink", "the-graph", "cosmos", "polkadot"],
  },
  {
    tag: "Stablecoin",
    categories: ["stablecoins"],
    ids: ["tether", "usd-coin", "dai", "ethena-usde"],
  },
];

export function resolveNarrativeTags(input: {
  id: string;
  categories?: string[] | null;
}): NarrativeTag[] {
  const id = input.id.toLowerCase();
  const cats = (input.categories ?? []).map((c) => c.toLowerCase());
  const tags: NarrativeTag[] = [];

  for (const rule of RULES) {
    const idHit = rule.ids?.includes(id);
    const catHit = rule.categories?.some((frag) =>
      cats.some((c) => c === frag || c.includes(frag) || frag.includes(c)),
    );
    if (idHit || catHit) tags.push(rule.tag);
  }

  return [...new Set(tags)].slice(0, 4);
}

export function narrativeTagClass(tag: NarrativeTag): string {
  switch (tag) {
    case "AI":
      return "border-lime-400/35 text-lime-200";
    case "RWA":
      return "border-sky-400/35 text-sky-200";
    case "Meme":
      return "border-amber-400/35 text-amber-200";
    case "L1":
      return "border-emerald-400/35 text-emerald-200";
    case "L2":
      return "border-violet-400/35 text-violet-200";
    case "DeFi":
      return "border-cyan-400/35 text-cyan-200";
    case "DePIN":
      return "border-fuchsia-400/35 text-fuchsia-200";
    case "Privacy":
      return "border-zinc-400/35 text-zinc-200";
    case "Infrastructure":
      return "border-[#d1a173]/40 text-[#d7ad82]";
    case "Stablecoin":
      return "border-teal-400/35 text-teal-200";
  }
}
