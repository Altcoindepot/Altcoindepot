export type MarketRegime = "Risk-On" | "Risk-Off" | "Chop" | "Alt Season";

export type MarketRegimeInput = {
  fearGreed: number | null;
  altSeasonIndex: number | null;
  btcChange24h: number | null;
  marketCapChange24h: number | null;
};

export type MarketRegimeResult = {
  regime: MarketRegime;
  summary: string;
  confidence: "low" | "medium" | "high";
};

/** Compact regime label from FNG, alt-season breadth, and BTC / mcap tone. */
export function computeMarketRegime(input: MarketRegimeInput): MarketRegimeResult {
  const fg = input.fearGreed ?? 50;
  const alt = input.altSeasonIndex ?? 50;
  const btc = input.btcChange24h ?? 0;
  const mcap = input.marketCapChange24h ?? 0;

  if (alt >= 60 && fg >= 45) {
    return {
      regime: "Alt Season",
      summary: "Alts are outperforming Bitcoin across the liquid top set.",
      confidence: alt >= 70 ? "high" : "medium",
    };
  }

  if (fg <= 35 || (btc <= -3 && mcap <= -2)) {
    return {
      regime: "Risk-Off",
      summary: "Caution dominates — fear is elevated and risk assets look soft.",
      confidence: fg <= 25 || btc <= -5 ? "high" : "medium",
    };
  }

  if (fg >= 60 && btc >= 1 && mcap >= 0.5) {
    return {
      regime: "Risk-On",
      summary: "Risk appetite is firm — Bitcoin and market breadth look constructive.",
      confidence: fg >= 70 ? "high" : "medium",
    };
  }

  return {
    regime: "Chop",
    summary: "Mixed signals — no clean directional regime right now.",
    confidence: "low",
  };
}

export function regimeToneClass(regime: MarketRegime): string {
  switch (regime) {
    case "Risk-On":
      return "ds-badge-pos";
    case "Risk-Off":
      return "ds-badge-neg";
    case "Alt Season":
      return "ds-badge-accent";
    default:
      return "ds-badge-info";
  }
}
