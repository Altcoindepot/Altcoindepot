export type LiquidityFlag = {
  level: "thin" | "watch";
  label: string;
  detail: string;
};

/** Informational liquidity heuristic from 24h volume and mcap. */
export function assessLiquidity(input: {
  totalVolume?: number | null;
  marketCap?: number | null;
}): LiquidityFlag | null {
  const vol = input.totalVolume;
  const mcap = input.marketCap;
  if (vol == null || !Number.isFinite(vol)) return null;

  if (vol < 1_000_000) {
    return {
      level: "thin",
      label: "Thin liquidity",
      detail: "24h volume under $1M — spreads and slippage can be wide.",
    };
  }

  if (mcap != null && mcap > 0 && vol / mcap > 0.35 && vol > 5_000_000) {
    return {
      level: "watch",
      label: "Elevated volume",
      detail: "Volume is high vs market cap — can mean interest or noise.",
    };
  }

  if (vol < 5_000_000 && mcap != null && mcap > 50_000_000) {
    return {
      level: "watch",
      label: "Soft liquidity",
      detail: "Volume is modest relative to market size.",
    };
  }

  return null;
}

/** Quiet filter: hide extreme low-liquidity meme noise. */
export function isQuietNoise(input: {
  totalVolume?: number | null;
  marketCap?: number | null;
  symbol?: string;
  name?: string;
  id?: string;
}): boolean {
  const vol = input.totalVolume ?? 0;
  const mcap = input.marketCap ?? 0;
  const blob = `${input.id ?? ""} ${input.symbol ?? ""} ${input.name ?? ""}`.toLowerCase();
  const memeish = /\b(meme|pepe|inu|dog|cat|wif|bonk|trump|elon)\b/.test(blob);
  if (vol < 2_000_000 && memeish) return true;
  if (vol < 750_000) return true;
  if (mcap > 0 && mcap < 5_000_000 && vol < 3_000_000) return true;
  return false;
}

export const QUIET_FILTER_STORAGE_KEY = "altcoindepot-quiet-filter";
