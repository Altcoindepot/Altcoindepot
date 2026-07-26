/**
 * Shared SEO template for every coin page.
 * Titles are returned as absolute strings so the root layout template
 * (`%s · AltCoin Depot`) does not append a second brand suffix.
 */
export type CoinSeoCopy = {
  title: string;
  description: string;
};

export function buildCoinSeoCopy(name: string, symbol: string): CoinSeoCopy {
  const coinName = name.trim() || "Coin";
  const sym = symbol.trim().toUpperCase() || "—";
  return {
    title: `${coinName} (${sym}) Price, Chart & Market Cap | AltCoin Depot`,
    description: `Live ${coinName} (${sym}) price, historical chart, market cap, volume, and key stats. Track ${sym} in real time on AltCoin Depot.`,
  };
}
