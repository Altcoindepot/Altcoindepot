import { dexVenueLabel } from "@/lib/dex-venue";

/** DEX venue display metadata for icons + compact labels. */

export type DexMeta = {
  /** Canonical venue key for icon lookup. */
  key: string;
  /** Short label for pills (e.g. PUMP, UNI). */
  short: string;
  /** Full venue name for tooltips. */
  name: string;
  color: string;
  icon?: string;
};

const DEX_META: Record<string, DexMeta> = {
  raydium: { key: "raydium", short: "RAY", name: "Raydium", color: "#C4F719", icon: "/dex/raydium.svg" },
  raydiumclmm: { key: "raydium", short: "RAY", name: "Raydium", color: "#C4F719", icon: "/dex/raydium.svg" },
  "raydium-clmm": { key: "raydium", short: "RAY", name: "Raydium", color: "#C4F719", icon: "/dex/raydium.svg" },
  "raydium-cp": { key: "raydium", short: "RAY", name: "Raydium", color: "#C4F719", icon: "/dex/raydium.svg" },
  orca: { key: "orca", short: "ORCA", name: "Orca", color: "#FFD15C", icon: "/dex/orca.svg" },
  whirlpool: { key: "orca", short: "ORCA", name: "Orca", color: "#FFD15C", icon: "/dex/orca.svg" },
  meteora: { key: "meteora", short: "MET", name: "Meteora", color: "#FF6B9D", icon: "/dex/meteora.svg" },
  "meteora-dlmm": { key: "meteora", short: "MET", name: "Meteora", color: "#FF6B9D", icon: "/dex/meteora.svg" },
  pumpswap: { key: "pump", short: "PUMP", name: "Pump", color: "#86EFAC", icon: "/dex/pump.svg" },
  pumpfun: { key: "pump", short: "PUMP", name: "Pump", color: "#86EFAC", icon: "/dex/pump.svg" },
  pump: { key: "pump", short: "PUMP", name: "Pump", color: "#86EFAC", icon: "/dex/pump.svg" },
  moonshot: { key: "moonshot", short: "MOON", name: "Moonshot", color: "#A78BFA" },
  uniswap: { key: "uniswap", short: "UNI", name: "Uniswap", color: "#FF007A", icon: "/dex/uniswap.svg" },
  uniswapv2: { key: "uniswap", short: "UNI", name: "Uniswap", color: "#FF007A", icon: "/dex/uniswap.svg" },
  uniswapv3: { key: "uniswap", short: "UNI", name: "Uniswap", color: "#FF007A", icon: "/dex/uniswap.svg" },
  uniswapv4: { key: "uniswap", short: "UNI", name: "Uniswap", color: "#FF007A", icon: "/dex/uniswap.svg" },
  sushiswap: { key: "sushi", short: "SUSHI", name: "SushiSwap", color: "#FA52A0", icon: "/dex/sushi.svg" },
  pancakeswap: {
    key: "pancakeswap",
    short: "CAKE",
    name: "PancakeSwap",
    color: "#D1884F",
    icon: "/dex/pancakeswap.svg",
  },
  pancakeswapv2: {
    key: "pancakeswap",
    short: "CAKE",
    name: "PancakeSwap",
    color: "#D1884F",
    icon: "/dex/pancakeswap.svg",
  },
  pancakeswapv3: {
    key: "pancakeswap",
    short: "CAKE",
    name: "PancakeSwap",
    color: "#D1884F",
    icon: "/dex/pancakeswap.svg",
  },
  aerodrome: { key: "aerodrome", short: "AERO", name: "Aerodrome", color: "#E1F25C", icon: "/dex/aerodrome.svg" },
  aerodromecl: { key: "aerodrome", short: "AERO", name: "Aerodrome", color: "#E1F25C", icon: "/dex/aerodrome.svg" },
  camelot: { key: "camelot", short: "CAM", name: "Camelot", color: "#FFAF1D" },
  traderjoe: { key: "traderjoe", short: "JOE", name: "Trader Joe", color: "#E84142" },
  lfj: { key: "traderjoe", short: "JOE", name: "Trader Joe", color: "#E84142" },
  quickswap: { key: "quickswap", short: "QUICK", name: "QuickSwap", color: "#448AFF" },
  balancer: { key: "balancer", short: "BAL", name: "Balancer", color: "#1E1E1E" },
  curve: { key: "curve", short: "CRV", name: "Curve", color: "#A00000" },
  velodrome: { key: "velodrome", short: "VELO", name: "Velodrome", color: "#9AE6B4" },
  lifinity: { key: "lifinity", short: "LFI", name: "Lifinity", color: "#60A5FA" },
  fluxbeam: { key: "fluxbeam", short: "FLUX", name: "FluxBeam", color: "#22D3EE" },
  phoenix: { key: "phoenix", short: "PHX", name: "Phoenix", color: "#F97316" },
};

function normalizeDexKey(dexId: string | null | undefined): string {
  return (dexId ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function getDexMeta(
  dexId: string | null | undefined,
  dexLabel?: string | null,
): DexMeta {
  const key = normalizeDexKey(dexId);
  if (key && DEX_META[key]) return DEX_META[key]!;
  const compact = key.replace(/-/g, "");
  if (compact && DEX_META[compact]) return DEX_META[compact]!;
  const cleaned = compact.replace(/v\d+$/i, "");
  if (cleaned && DEX_META[cleaned]) return DEX_META[cleaned]!;

  const name = (dexLabel && dexLabel.trim()) || dexVenueLabel(dexId);
  const short = name.slice(0, 6).toUpperCase();
  return {
    key: key || "dex",
    short: short || "DEX",
    name: name || "DEX",
    color: "#71717a",
  };
}
