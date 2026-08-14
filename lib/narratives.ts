/** Maintainable narrative baskets for the Dashboard homepage. */

export type NarrativeStatus = "LEADING" | "NEUTRAL" | "FADING";

/** Rotation windows for the Narrative Rotation Tracker. */
export type RotationWindow = "24h" | "7d" | "30d";

export const ROTATION_WINDOWS: ReadonlyArray<{
  id: RotationWindow;
  label: string;
  shortLabel: string;
}> = [
  { id: "24h", label: "24 hours", shortLabel: "24H" },
  { id: "7d", label: "7 days", shortLabel: "7D" },
  { id: "30d", label: "1 month", shortLabel: "1M" },
] as const;

export const DEFAULT_ROTATION_WINDOW: RotationWindow = "24h";

export type NarrativeDef = {
  /** URL slug under /narrative/[slug] */
  slug: string;
  /** Display name */
  title: string;
  /** Short subtitle for ranking / rotations */
  subtitle: string;
  /** CoinGecko markets `category=` id */
  coingeckoCategoryId: string;
  /** Accent hex for badges / bars / nodes */
  color: string;
  /** Tailwind-ish glow for the 16px badge */
  glowClass: string;
};

/**
 * Six primary narratives shown in the Rotation Tracker.
 * `coingeckoCategoryId` must match CoinGecko `/coins/categories/list` (used as `category=` on `/coins/markets`).
 */
export const NARRATIVES: readonly NarrativeDef[] = [
  {
    slug: "ai-agents",
    title: "AI Agents",
    subtitle: "AI × Crypto Infrastructure",
    coingeckoCategoryId: "artificial-intelligence",
    color: "#34d399",
    glowClass: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]",
  },
  {
    slug: "defi-2",
    title: "DeFi 2.0",
    subtitle: "On-chain liquidity & yield",
    coingeckoCategoryId: "decentralized-finance-defi",
    color: "#2dd4bf",
    glowClass: "bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.75)]",
  },
  {
    slug: "rwa",
    title: "RWA",
    subtitle: "Tokenized real-world assets",
    coingeckoCategoryId: "real-world-assets-rwa",
    color: "#a78bfa",
    glowClass: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.75)]",
  },
  {
    slug: "gaming",
    title: "Gaming",
    subtitle: "Play-to-earn & game chains",
    coingeckoCategoryId: "gaming",
    color: "#fb923c",
    glowClass: "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.75)]",
  },
  {
    slug: "memecoins",
    title: "Memecoins",
    subtitle: "Community-driven tokens",
    coingeckoCategoryId: "meme-token",
    color: "#f472b6",
    glowClass: "bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.75)]",
  },
  {
    slug: "depin",
    title: "DePIN",
    subtitle: "Physical infrastructure nets",
    coingeckoCategoryId: "depin",
    color: "#60a5fa",
    glowClass: "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.75)]",
  },
] as const;

export function getNarrativeBySlug(slug: string): NarrativeDef | undefined {
  const s = slug.trim().toLowerCase();
  return NARRATIVES.find((n) => n.slug === s);
}

export function rotationStatusFromChange(
  change: number | null,
  window: RotationWindow = "24h",
): NarrativeStatus {
  if (change == null || !Number.isFinite(change)) return "NEUTRAL";
  if (window === "24h") {
    if (change >= 2) return "LEADING";
    if (change <= -1.5) return "FADING";
    return "NEUTRAL";
  }
  if (window === "30d") {
    if (change >= 10) return "LEADING";
    if (change <= -8) return "FADING";
    return "NEUTRAL";
  }
  // 7d
  if (change >= 5) return "LEADING";
  if (change <= -3) return "FADING";
  return "NEUTRAL";
}

export function statusBadgeClass(status: NarrativeStatus): string {
  switch (status) {
    case "LEADING":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
    case "FADING":
      return "border-rose-400/40 bg-rose-500/15 text-rose-200";
    default:
      return "border-zinc-500/40 bg-zinc-500/10 text-zinc-300";
  }
}

/** User-facing rotation signal label (LEADING → STRONG INFLOW). */
export function rotationSignalLabel(status: NarrativeStatus): string {
  switch (status) {
    case "LEADING":
      return "STRONG INFLOW";
    case "FADING":
      return "FADING";
    default:
      return "NEUTRAL";
  }
}
