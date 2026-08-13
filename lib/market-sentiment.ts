export type MarketSentimentSnapshot = {
  fearAndGreedValue: number;
  altseasonProgress: number;
};

/** Static gauge seeds — no live API. Tune these locally without hitting CoinGecko. */
export const MARKET_SENTIMENT_SNAPSHOT: MarketSentimentSnapshot = {
  fearAndGreedValue: 65,
  altseasonProgress: 42,
};

export type FearGreedBand = {
  label: "EXTREME FEAR" | "FEAR" | "GREED" | "EXTREME GREED";
  textClass: string;
  badgeClass: string;
  stroke: string;
};

export function clampSentimentScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function fearGreedBand(value: number): FearGreedBand {
  const v = clampSentimentScore(value);
  if (v <= 30) {
    return {
      label: "EXTREME FEAR",
      textClass: "text-[#fb7185]",
      badgeClass: "border-[#fb7185]/40 bg-[#fb7185]/10 text-[#fb7185]",
      stroke: "#fb7185",
    };
  }
  if (v <= 50) {
    return {
      label: "FEAR",
      textClass: "text-[#fb923c]",
      badgeClass: "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]",
      stroke: "#fb923c",
    };
  }
  if (v <= 75) {
    return {
      label: "GREED",
      textClass: "text-[#6ee7b7]",
      badgeClass: "border-[#6ee7b7]/40 bg-[#6ee7b7]/10 text-[#6ee7b7]",
      stroke: "#6ee7b7",
    };
  }
  return {
    label: "EXTREME GREED",
    textClass: "text-[#34d399]",
    badgeClass:
      "border-[#34d399]/50 bg-[#34d399]/15 text-[#6ee7b7] shadow-[0_0_16px_rgba(52,211,153,0.28)]",
    stroke: "#34d399",
  };
}
