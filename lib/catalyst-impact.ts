export type CatalystImpact = "High" | "Medium" | "Low";

export type CatalystImpactInput = {
  category: "Government" | "Policy" | "Listings";
  title: string;
};

const ULTRA_HIGH =
  /\b(etf|clarity act|sec\b|approval|ban|fomc|federal reserve|binance\s+will\s+list|coinbase\s+will\s+list)\b/i;
const MEDIUM =
  /\b(listing|delist|adds support|hearing|lawsuit|regulation|bill|mica|cftc)\b/i;

/** Heuristic impact for calendar cards — informational, not advice. */
export function scoreCatalystImpact(input: CatalystImpactInput): CatalystImpact {
  const t = input.title;
  if (input.category === "Government" || ULTRA_HIGH.test(t)) return "High";
  if (input.category === "Listings" && /\b(binance|coinbase|kraken|okx|bybit)\b/i.test(t)) {
    return "High";
  }
  if (MEDIUM.test(t) || input.category === "Policy" || input.category === "Listings") {
    return "Medium";
  }
  return "Low";
}

export function impactBadgeClass(impact: CatalystImpact): string {
  switch (impact) {
    case "High":
      return "ds-badge-warn";
    case "Medium":
      return "ds-badge-info";
    default:
      return "ds-badge-info opacity-70";
  }
}

/** Countdown label when eventAt is clearly in the future. */
export function formatEventCountdown(eventAtIso: string, now = Date.now()): string | null {
  const t = Date.parse(eventAtIso);
  if (!Number.isFinite(t)) return null;
  const diff = t - now;
  if (diff < 60_000) return null; // past or imminent — skip countdown
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 60) return null;
  if (days >= 1) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}
