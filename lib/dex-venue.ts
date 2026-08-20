/** Map DexScreener `dexId` to a short venue label. Jupiter is a router — never used as the venue badge. */
const DEX_LABELS: Record<string, string> = {
  raydium: "Raydium",
  raydiumclmm: "Raydium",
  "raydium-clmm": "Raydium",
  "raydium-cp": "Raydium",
  orca: "Orca",
  whirlpool: "Orca",
  meteora: "Meteora",
  "meteora-dlmm": "Meteora",
  pumpswap: "Pump",
  pumpfun: "Pump",
  pump: "Pump",
  moonshot: "Moonshot",
  uniswap: "Uniswap",
  "uniswapv2": "Uniswap",
  "uniswapv3": "Uniswap",
  "uniswapv4": "Uniswap",
  sushiswap: "Sushi",
  pancakeswap: "PancakeSwap",
  "pancakeswapv2": "PancakeSwap",
  "pancakeswapv3": "PancakeSwap",
  aerodrome: "Aerodrome",
  aerodromecl: "Aerodrome",
  baseswap: "BaseSwap",
  swapbased: "SwapBased",
  camelot: "Camelot",
  traderjoe: "Trader Joe",
  lfj: "LFJ",
  quickswap: "QuickSwap",
  spookyswap: "Spooky",
  spiritswap: "Spirit",
  balancer: "Balancer",
  curve: "Curve",
  velodrome: "Velodrome",
  thruster: "Thruster",
  pharaoh: "Pharaoh",
  shadow: "Shadow",
  kodiak: "Kodiak",
  hyperliquid: "Hyperliquid",
  lifinity: "Lifinity",
  fluxbeam: "FluxBeam",
  phoenix: "Phoenix",
  invariant: "Invariant",
  cropper: "Cropper",
  saber: "Saber",
};

export function dexVenueLabel(dexId: string | null | undefined): string {
  const key = (dexId ?? "").trim().toLowerCase();
  if (!key) return "DEX";
  if (key === "jupiter" || key.startsWith("jupiter")) return "DEX";
  if (DEX_LABELS[key]) return DEX_LABELS[key];
  const compact = key.replace(/[^a-z0-9]/g, "");
  if (DEX_LABELS[compact]) return DEX_LABELS[compact];
  const cleaned = key.replace(/v\d+$/i, "");
  if (DEX_LABELS[cleaned]) return DEX_LABELS[cleaned];
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 18) || "DEX";
}

export function dexVenueId(dexId: string | null | undefined): string | undefined {
  const key = (dexId ?? "").trim().toLowerCase();
  return key || undefined;
}
