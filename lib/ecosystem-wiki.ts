export type TokenResources = {
  portal?: string;
  auditExplorer?: string;
  docs?: string;
  community?: string;
};

export const ecosystemWikiData: Record<string, TokenResources> = {
  bitcoin: {
    portal: "https://bitcoin.org",
    auditExplorer: "https://mempool.space",
    docs: "https://bitcoin.org/en/bitcoin-paper",
    community: "https://x.com/bitcoin",
  },
  ethereum: {
    portal: "https://ethereum.org",
    auditExplorer: "https://etherscan.io",
    docs: "https://ethereum.org/en/developers/docs/",
    community: "https://x.com/ethereum",
  },
  solana: {
    portal: "https://solana.com",
    auditExplorer: "https://solscan.io",
    docs: "https://solana.com/docs",
    community: "https://x.com/solana",
  },
  ripple: {
    portal: "https://xrpl.org",
    auditExplorer: "https://xrpscan.com",
    docs: "https://xrpl.org/docs.html",
    community: "https://x.com/Ripple",
  },
  cardano: {
    portal: "https://cardano.org",
    auditExplorer: "https://cardanoscan.io",
    docs: "https://docs.cardano.org",
    community: "https://x.com/Cardano",
  },
  "avalanche-2": {
    portal: "https://www.avax.network",
    auditExplorer: "https://snowtrace.io",
    docs: "https://docs.avax.network",
    community: "https://x.com/avax",
  },
  chainlink: {
    portal: "https://chain.link",
    auditExplorer: "https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca",
    docs: "https://docs.chain.link",
    community: "https://x.com/chainlink",
  },
  aave: {
    portal: "https://aave.com",
    auditExplorer: "https://etherscan.io/token/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
    docs: "https://docs.aave.com",
    community: "https://x.com/aave",
  },
  uniswap: {
    portal: "https://uniswap.org",
    auditExplorer: "https://etherscan.io/token/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    docs: "https://docs.uniswap.org",
    community: "https://x.com/Uniswap",
  },
  near: {
    portal: "https://near.org",
    auditExplorer: "https://nearblocks.io",
    docs: "https://docs.near.org",
    community: "https://x.com/NEARProtocol",
  },
  sui: {
    portal: "https://sui.io",
    auditExplorer: "https://suiscan.xyz",
    docs: "https://docs.sui.io",
    community: "https://x.com/SuiNetwork",
  },
  "render-token": {
    portal: "https://rendernetwork.com",
    auditExplorer: "https://solscan.io/token/rndrizKT3MK1iimdxRdWstcQxY9sR9s3Z3qxFbaK5",
    docs: "https://know.rendernetwork.com",
    community: "https://x.com/rendernetwork",
  },
  "fetch-ai": {
    portal: "https://fetch.ai",
    auditExplorer: "https://etherscan.io/token/0xaea46a60368a7bd060eec7df8cba43b7ef41ad85",
    docs: "https://docs.fetch.ai",
    community: "https://x.com/Fetch_ai",
  },
  "ondo-finance": {
    portal: "https://ondo.finance",
    auditExplorer: "https://etherscan.io/token/0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3",
    docs: "https://docs.ondo.finance",
    community: "https://x.com/ondofinance",
  },
  bittensor: {
    portal: "https://bittensor.com",
    auditExplorer: "https://taostats.io",
    docs: "https://docs.bittensor.com",
    community: "https://x.com/opentensor",
  },
  filecoin: {
    portal: "https://filecoin.io",
    auditExplorer: "https://filfox.info",
    docs: "https://docs.filecoin.io",
    community: "https://x.com/Filecoin",
  },
  dogecoin: {
    portal: "https://dogecoin.com",
    auditExplorer: "https://dogechain.info",
    docs: "https://github.com/dogecoin/dogecoin/blob/master/README.md",
    community: "https://x.com/dogecoin",
  },
  polkadot: {
    portal: "https://polkadot.com",
    auditExplorer: "https://polkadot.subscan.io",
    docs: "https://docs.polkadot.com",
    community: "https://x.com/Polkadot",
  },
  cosmos: {
    portal: "https://cosmos.network",
    auditExplorer: "https://www.mintscan.io/cosmos",
    docs: "https://docs.cosmos.network",
    community: "https://x.com/cosmos",
  },
  "injective-protocol": {
    portal: "https://injective.com",
    auditExplorer: "https://explorer.injective.network",
    docs: "https://docs.injective.network",
    community: "https://x.com/Injective_",
  },
  binancecoin: {
    portal: "https://www.bnbchain.org",
    auditExplorer: "https://bscscan.com",
    docs: "https://docs.bnbchain.org",
    community: "https://x.com/BNBCHAIN",
  },
};

const NARRATIVE_WIKI_IDS: Record<string, string[]> = {
  "ai-agents": ["bittensor", "fetch-ai", "near", "render-token"],
  "defi-2": ["aave", "uniswap", "chainlink"],
  rwa: ["ondo-finance"],
  depin: ["filecoin", "render-token"],
  memecoins: ["dogecoin"],
  gaming: [],
};

export type WikiFallbackLinks = {
  portal?: string | null;
  auditExplorer?: string | null;
  docs?: string | null;
  community?: string | null;
};

export function resolveTokenResources(
  coinId: string,
  fallback?: WikiFallbackLinks,
): TokenResources | null {
  const id = coinId.trim().toLowerCase();
  const curated = ecosystemWikiData[id];
  const merged: TokenResources = {
    portal: curated?.portal ?? fallback?.portal ?? undefined,
    auditExplorer: curated?.auditExplorer ?? fallback?.auditExplorer ?? undefined,
    docs: curated?.docs ?? fallback?.docs ?? undefined,
    community: curated?.community ?? fallback?.community ?? undefined,
  };
  if (!merged.portal && !merged.auditExplorer && !merged.docs && !merged.community) {
    return null;
  }
  return merged;
}

export function wikiEntriesForNarrative(slug: string): Array<{ id: string; resources: TokenResources }> {
  const ids = NARRATIVE_WIKI_IDS[slug] ?? Object.keys(ecosystemWikiData);
  return ids
    .map((id) => {
      const resources = ecosystemWikiData[id];
      return resources ? { id, resources } : null;
    })
    .filter((row): row is { id: string; resources: TokenResources } => row != null);
}

export function featuredWikiEntries(): Array<{ id: string; resources: TokenResources }> {
  return allWikiEntries();
}

/** Every curated wiki chain, majors first (includes Solana + Injective). */
export function allWikiEntries(): Array<{ id: string; resources: TokenResources }> {
  const priority = [
    "bitcoin",
    "ethereum",
    "solana",
    "injective-protocol",
    "ripple",
    "binancecoin",
    "cardano",
    "avalanche-2",
  ];
  const ids = Object.keys(ecosystemWikiData);
  const rest = ids
    .filter((id) => !priority.includes(id))
    .sort((a, b) => wikiDisplayName(a).localeCompare(wikiDisplayName(b)));
  return [...priority.filter((id) => ids.includes(id)), ...rest]
    .map((id) => {
      const resources = ecosystemWikiData[id];
      return resources ? { id, resources } : null;
    })
    .filter((row): row is { id: string; resources: TokenResources } => row != null);
}

export function wikiDisplayName(id: string): string {
  const names: Record<string, string> = {
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    solana: "Solana",
    ripple: "XRP",
    cardano: "Cardano",
    "avalanche-2": "Avalanche",
    chainlink: "Chainlink",
    aave: "Aave",
    uniswap: "Uniswap",
    near: "NEAR",
    sui: "Sui",
    "render-token": "Render",
    "fetch-ai": "Fetch.ai",
    "ondo-finance": "Ondo",
    bittensor: "Bittensor",
    filecoin: "Filecoin",
    dogecoin: "Dogecoin",
    polkadot: "Polkadot",
    cosmos: "Cosmos",
    "injective-protocol": "Injective",
    binancecoin: "BNB",
  };
  return names[id] ?? id;
}

const CG = "https://coin-images.coingecko.com/coins/images";

const WIKI_LOGOS: Record<string, string> = {
  bitcoin: `${CG}/1/small/bitcoin.png`,
  ethereum: `${CG}/279/small/ethereum.png`,
  solana: `${CG}/4128/small/solana.png`,
  ripple: `${CG}/44/small/xrp-symbol-white-128.png`,
  cardano: `${CG}/975/small/cardano.png`,
  "avalanche-2": `${CG}/12559/small/Avalanche_Circle_RedWhite_Trans.png`,
  chainlink: `${CG}/877/small/chainlink-new-logo.png`,
  aave: `${CG}/12645/small/aave-token-round.png`,
  uniswap: `${CG}/12504/small/uniswap-logo.png`,
  near: `${CG}/10365/small/near.jpg`,
  sui: `${CG}/26375/small/sui_asset.jpeg`,
  "render-token": `${CG}/11636/small/rndr.png`,
  "fetch-ai": `${CG}/5680/small/Fetch.jpg`,
  "ondo-finance": `${CG}/26536/small/ONDO.png`,
  bittensor: `${CG}/28452/small/ARUsPeNQ_400x400.jpeg`,
  filecoin: `${CG}/12817/small/filecoin.png`,
  dogecoin: `${CG}/5/small/dogecoin.png`,
  polkadot: `${CG}/12171/small/polkadot.png`,
  cosmos: `${CG}/1481/small/cosmos_hub.png`,
  "injective-protocol": `${CG}/12882/small/Secondary_Symbol.png`,
  binancecoin: `${CG}/825/small/bnb-icon2_2x.png`,
};

export function wikiLogoUrl(id: string): string | null {
  return WIKI_LOGOS[id] ?? null;
}

export function wikiSymbol(id: string): string {
  const symbols: Record<string, string> = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
    ripple: "XRP",
    cardano: "ADA",
    "avalanche-2": "AVAX",
    chainlink: "LINK",
    aave: "AAVE",
    uniswap: "UNI",
    near: "NEAR",
    sui: "SUI",
    "render-token": "RENDER",
    "fetch-ai": "FET",
    "ondo-finance": "ONDO",
    bittensor: "TAO",
    filecoin: "FIL",
    dogecoin: "DOGE",
    polkadot: "DOT",
    cosmos: "ATOM",
    "injective-protocol": "INJ",
    binancecoin: "BNB",
  };
  return symbols[id] ?? id.slice(0, 4).toUpperCase();
}
