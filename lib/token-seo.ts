/**
 * Data-driven SEO for `/token/[chain]/[address]`.
 * Unique angles: Dex + contract (+ ATH/supply when Gecko-listed).
 */

export type TokenSeoCopy = {
  title: string;
  description: string;
  h1: string;
};

function clampLen(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function buildTokenSeoCopy(input: {
  name: string;
  symbol: string;
  chainLabel: string;
  /** True when CoinGecko fundamentals resolved for this contract. */
  listedOnGecko: boolean;
}): TokenSeoCopy {
  const name = (input.name ?? "").trim() || "Token";
  const ticker = (input.symbol ?? "").trim().toUpperCase() || "TOKEN";
  const chain = (input.chainLabel ?? "").trim() || "DEX";

  if (input.listedOnGecko) {
    const title = `${ticker} Dex Price, Contract, ATH & Supply | AltCoin Depot`;
    const description = `Live Dex price/chart for ${name}. Contract, liquidity, volume. CoinGecko ATH/ATL/supply when listed. Informational only — not financial advice.`;
    return {
      title: clampLen(title, 70),
      description: clampLen(description, 165),
      h1: `${ticker} Dex price & contract`,
    };
  }

  const title = `${ticker} Live Dex Price & Contract – Not on CoinGecko Yet | AltCoin Depot`;
  const description = `Not listed on CoinGecko yet. Live Dex pair on ${chain}. Verify the contract before you act. Informational only — not financial advice.`;
  return {
    title: clampLen(title, 75),
    description: clampLen(description, 165),
    h1: `${ticker} live Dex price – not on CoinGecko yet`,
  };
}
