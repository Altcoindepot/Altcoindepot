/**
 * Curated SEO title + description for high-traffic coin pages.
 * Titles use `absolute` in generateMetadata so the root template
 * (`%s · AltCoin Depot`) does not duplicate the brand suffix.
 */
export type CoinSeoCopy = {
  title: string;
  description: string;
};

const TOP_COIN_SEO: Record<string, CoinSeoCopy> = {
  bitcoin: {
    title: "Bitcoin Price, Chart & Market Cap | AltCoin Depot",
    description:
      "Live Bitcoin (BTC) price, historical chart, market cap, volume, and key stats. Track BTC in real time on AltCoin Depot.",
  },
  ethereum: {
    title: "Ethereum Price, Chart & Market Data | AltCoin Depot",
    description:
      "Live Ethereum (ETH) price, chart, market cap, and trading data. Follow ETH performance and trends on AltCoin Depot.",
  },
  tether: {
    title: "Tether USDT Price & Market Cap | AltCoin Depot",
    description:
      "Live Tether (USDT) price, market cap, and volume. Track the world’s largest stablecoin in real time.",
  },
  binancecoin: {
    title: "BNB Price, Chart & Market Cap | AltCoin Depot",
    description:
      "Live BNB price, chart, market cap, and key stats. Follow Binance Coin performance on AltCoin Depot.",
  },
  "usd-coin": {
    title: "USDC Price & Market Data | AltCoin Depot",
    description:
      "Live USD Coin (USDC) price, market cap, and volume. Track this leading stablecoin in real time.",
  },
  ripple: {
    title: "XRP Price, Chart & Market Cap | AltCoin Depot",
    description:
      "Live XRP price, historical chart, market cap, and trading volume. Track XRP in real time on AltCoin Depot.",
  },
  solana: {
    title: "Solana Price, Chart & Market Data | AltCoin Depot",
    description:
      "Live Solana (SOL) price, chart, market cap, and key metrics. Follow SOL trends on AltCoin Depot.",
  },
  tron: {
    title: "TRON TRX Price & Chart | AltCoin Depot",
    description:
      "Live TRON (TRX) price, market cap, volume, and chart. Track TRX performance in real time.",
  },
  dogecoin: {
    title: "Dogecoin Price, Chart & Market Cap | AltCoin Depot",
    description:
      "Live Dogecoin (DOGE) price, chart, market cap, and trading data. Follow DOGE on AltCoin Depot.",
  },
  cardano: {
    title: "Cardano ADA Price & Market Data | AltCoin Depot",
    description:
      "Live Cardano (ADA) price, chart, market cap, and key stats. Track ADA in real time.",
  },
  chainlink: {
    title: "Chainlink LINK Price, Chart & Stats | AltCoin Depot",
    description:
      "Live Chainlink (LINK) price, market cap, volume, and chart. Follow LINK performance on AltCoin Depot.",
  },
  hyperliquid: {
    title: "Hyperliquid HYPE Price & Chart | AltCoin Depot",
    description:
      "Live Hyperliquid (HYPE) price, market data, and chart. Track HYPE in real time on AltCoin Depot.",
  },
  "avalanche-2": {
    title: "Avalanche AVAX Price & Market Cap | AltCoin Depot",
    description:
      "Live Avalanche (AVAX) price, chart, market cap, and volume. Follow AVAX trends on AltCoin Depot.",
  },
  stellar: {
    title: "Stellar XLM Price, Chart & Data | AltCoin Depot",
    description:
      "Live Stellar (XLM) price, market cap, and chart. Track XLM performance in real time.",
  },
  monero: {
    title: "Monero XMR Price & Market Data | AltCoin Depot",
    description:
      "Live Monero (XMR) price, chart, market cap, and key stats. Follow XMR on AltCoin Depot.",
  },
  litecoin: {
    title: "Litecoin LTC Price, Chart & Market Cap | AltCoin Depot",
    description:
      "Live Litecoin (LTC) price, historical chart, market cap, and volume. Track LTC in real time.",
  },
  "bitcoin-cash": {
    title: "Bitcoin Cash BCH Price & Chart | AltCoin Depot",
    description:
      "Live Bitcoin Cash (BCH) price, market cap, volume, and chart. Follow BCH on AltCoin Depot.",
  },
  uniswap: {
    title: "Uniswap UNI Price & Market Data | AltCoin Depot",
    description:
      "Live Uniswap (UNI) price, chart, market cap, and trading stats. Track UNI in real time.",
  },
  "hedera-hashgraph": {
    title: "Hedera HBAR Price, Chart & Stats | AltCoin Depot",
    description:
      "Live Hedera (HBAR) price, market cap, volume, and chart. Follow HBAR performance on AltCoin Depot.",
  },
  "shiba-inu": {
    title: "Shiba Inu SHIB Price & Chart | AltCoin Depot",
    description:
      "Live Shiba Inu (SHIB) price, market cap, volume, and chart. Track SHIB in real time on AltCoin Depot.",
  },
};

export function getCoinSeoCopy(coinId: string): CoinSeoCopy | null {
  const key = coinId.trim().toLowerCase();
  return TOP_COIN_SEO[key] ?? null;
}
