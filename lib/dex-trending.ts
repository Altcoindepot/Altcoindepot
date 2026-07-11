export type DexMover = {
  pair: string;
  priceUsd: number;
  change24hPct: number;
  change1hPct: number | null;
  volume24h: number | null;
  href: string;
};

export type DexBoard = {
  id: string;
  label: string;
  movers: DexMover[];
  error?: string;
};

type DexConfig = {
  id: string;
  label: string;
  network: string;
  dexIdMatch: string;
};

const DEX_CONFIGS: DexConfig[] = [
  { id: "uniswap", label: "Uniswap", network: "eth", dexIdMatch: "uniswap_v3" },
  { id: "pancakeswap", label: "PancakeSwap", network: "bsc", dexIdMatch: "pancakeswap_v3" },
  { id: "raydium", label: "Raydium", network: "solana", dexIdMatch: "raydium" },
  { id: "aerodrome", label: "Aerodrome", network: "base", dexIdMatch: "aerodrome" },
  { id: "traderjoe", label: "Trader Joe", network: "avax", dexIdMatch: "trader_joe" },
  { id: "cowswap", label: "CoW Swap", network: "eth", dexIdMatch: "cow" },
];

function parseNum(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function fetchJson(url: string): Promise<unknown> {
  let lastStatus: number | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { next: { revalidate: 60 }, headers: { Accept: "application/json" } });
    if (res.ok) {
      return res.json();
    }
    lastStatus = res.status;
    // Rate-limit friendly backoff for GeckoTerminal.
    if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
      const waitMs = 300 + attempt * 700;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error(`HTTP ${lastStatus ?? 429}`);
}

async function loadDexMovers(config: DexConfig): Promise<DexMover[]> {
  const pages = [1, 2];
  const pools: DexMover[] = [];
  for (const page of pages) {
    const raw = await fetchJson(
      `https://api.geckoterminal.com/api/v2/networks/${encodeURIComponent(config.network)}/trending_pools?page=${page}`,
    );
    const data = (raw as { data?: unknown[] })?.data;
    if (!Array.isArray(data)) continue;
    for (const item of data) {
      const relDex = (item as { relationships?: { dex?: { data?: { id?: unknown } } } }).relationships?.dex?.data;
      const dexId = typeof relDex?.id === "string" ? relDex.id : "";
      if (!dexId.toLowerCase().includes(config.dexIdMatch.toLowerCase())) continue;
      const attributes = (item as { attributes?: Record<string, unknown> }).attributes ?? {};
      const pair = typeof attributes.name === "string" ? attributes.name : "";
      const priceUsd = parseNum(attributes.base_token_price_usd);
      const priceCh = (attributes.price_change_percentage as Record<string, unknown> | undefined) ?? {};
      const vol = (attributes.volume_usd as Record<string, unknown> | undefined) ?? {};
      const change24hPct = parseNum(priceCh.h24);
      const change1hPct = parseNum(priceCh.h1);
      const volume24h = parseNum(vol.h24);
      const address = typeof attributes.address === "string" ? attributes.address : "";
      if (!pair || !address || priceUsd == null || change24hPct == null) continue;
      pools.push({
        pair,
        priceUsd,
        change24hPct,
        change1hPct,
        volume24h,
        href: `https://www.geckoterminal.com/${config.network}/pools/${address}`,
      });
    }
  }

  const deduped = new Map<string, DexMover>();
  for (const row of pools) {
    const existing = deduped.get(row.pair);
    if (!existing || row.volume24h != null && (existing.volume24h ?? -1) < row.volume24h) {
      deduped.set(row.pair, row);
    }
  }

  return [...deduped.values()]
    .sort((a, b) => b.change24hPct - a.change24hPct)
    .slice(0, 5);
}

export async function getDexTrendingBoards(): Promise<DexBoard[]> {
  const boards: DexBoard[] = [];
  for (const cfg of DEX_CONFIGS) {
    try {
      const movers = await loadDexMovers(cfg);
      boards.push({ id: cfg.id, label: cfg.label, movers });
    } catch (error) {
      boards.push({
        id: cfg.id,
        label: cfg.label,
        movers: [],
        error: error instanceof Error ? error.message : "Failed to load DEX data",
      });
    }
    // Slight pacing to avoid burst 429s across multiple DEX boards.
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return boards;
}
