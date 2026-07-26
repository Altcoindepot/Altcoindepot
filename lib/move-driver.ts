export type MoveDriverKind =
  | "market-wide"
  | "listing"
  | "policy"
  | "social"
  | "unclear";

export type MoveDriver = {
  kind: MoveDriverKind;
  label: string;
  detail: string;
};

const LISTING_RE =
  /\b(listing|listed|lists|delist|adds support|will list|new listing)\b/i;
const POLICY_RE =
  /\b(sec\b|etf|regulation|lawsuit|ban|approval|fed\b|fomc|clarity act|mica)\b/i;

/**
 * Lightweight contextual guess — not financial advice.
 * Uses coin vs BTC divergence plus optional headline keywords.
 * Prefers specific drivers when signals are clear; otherwise falls back to mixed/unclear.
 */
export function inferMoveDriver(input: {
  coinChange24h: number | null;
  btcChange24h: number | null;
  headlines?: string[];
}): MoveDriver {
  const coin = input.coinChange24h;
  const btc = input.btcChange24h ?? 0;
  const headlines = input.headlines ?? [];
  const headlineBlob = headlines.join(" · ");

  if (LISTING_RE.test(headlineBlob)) {
    return {
      kind: "listing",
      label: "Possible listing / venue news",
      detail: "Recent headlines mention exchange listing or delisting activity.",
    };
  }
  if (POLICY_RE.test(headlineBlob)) {
    return {
      kind: "policy",
      label: "Possible policy / macro news",
      detail: "Recent headlines mention regulation, ETF, or major policy themes.",
    };
  }

  if (coin == null || !Number.isFinite(coin)) {
    return {
      kind: "unclear",
      label: "Unclear from available data",
      detail: "Not enough move data yet to suggest a driver.",
    };
  }

  const gap = Math.abs(coin - btc);
  if (Math.abs(btc) >= 1.5 && gap <= 2.5) {
    return {
      kind: "market-wide",
      label: "Likely market-wide move",
      detail: "This coin’s 24h change is tracking Bitcoin closely.",
    };
  }

  if (Math.abs(coin) >= 8 && gap >= 5) {
    return {
      kind: "social",
      label: "Possibly coin-specific",
      detail:
        "Move looks larger than Bitcoin’s — could be narrative- or flow-specific. Not confirmed.",
    };
  }

  return {
    kind: "unclear",
    label: "Mixed or unexplained",
    detail: "No single clear driver from price vs BTC and recent headlines.",
  };
}
