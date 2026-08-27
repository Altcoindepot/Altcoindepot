/**
 * Canonical majors alias map (~top 300 by market relevance).
 * Exact ticker / strong name → gecko id (+ optional Dex contract).
 * Used only for search ranking — live prices still come from Dex.
 */

export type MajorPreferredContract = {
  chain: string;
  address: string;
};

export type MajorAlias = {
  /** CoinGecko id → /coin/[id] */
  id: string;
  /** Canonical ticker shown in UI (BTC, ETH, …) */
  symbol: string;
  /** Exact names that resolve to this major (lowercase compare) */
  names: string[];
  /** Optional known on-chain contract for Dex USDT pairing */
  preferred?: MajorPreferredContract;
};

type Row = [
  id: string,
  symbol: string,
  names: string,
  preferredChain?: string,
  preferredAddress?: string,
];

/**
 * Compact seed: id | symbol | comma-names | optional chain | optional address.
 * Expand aliases carefully — never map a meme ticker onto a major.
 */
const MAJOR_ROWS: Row[] = [
  [
    "bitcoin",
    "BTC",
    "bitcoin,btc",
    "ethereum",
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  ],
  [
    "ethereum",
    "ETH",
    "ethereum,eth",
    "ethereum",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  ],
  ["tether", "USDT", "tether,tether usd,usdt"],
  ["ripple", "XRP", "xrp,ripple"],
  ["binancecoin", "BNB", "bnb,binance coin,binancecoin"],
  ["solana", "SOL", "solana,sol"],
  ["usd-coin", "USDC", "usd coin,usdc,usd-coin"],
  ["staked-ether", "STETH", "lido staked ether,staked ether,steth"],
  ["dogecoin", "DOGE", "dogecoin,doge"],
  ["tron", "TRX", "tron,trx"],
  ["cardano", "ADA", "cardano,ada"],
  ["chainlink", "LINK", "chainlink,link"],
  ["hyperliquid", "HYPE", "hyperliquid,hype"],
  ["sui", "SUI", "sui"],
  ["avalanche-2", "AVAX", "avalanche,avax"],
  ["stellar", "XLM", "stellar,xlm,stellar lumens"],
  ["bitcoin-cash", "BCH", "bitcoin cash,bch"],
  ["hedera-hashgraph", "HBAR", "hedera,hbar,hedera hashgraph"],
  ["shiba-inu", "SHIB", "shiba inu,shib"],
  ["litecoin", "LTC", "litecoin,ltc"],
  ["toncoin", "TON", "toncoin,ton,the open network"],
  ["polkadot", "DOT", "polkadot,dot"],
  ["uniswap", "UNI", "uniswap,uni"],
  ["bitget-token", "BGB", "bitget token,bgb"],
  ["pepe", "PEPE", "pepe"],
  ["mantle", "MNT", "mantle,mnt"],
  ["aave", "AAVE", "aave"],
  ["near", "NEAR", "near,near protocol"],
  ["internet-computer", "ICP", "internet computer,icp"],
  ["crypto-com-chain", "CRO", "cronos,cro,crypto.com coin"],
  ["ethereum-classic", "ETC", "ethereum classic,etc"],
  ["render-token", "RENDER", "render,rndr,render token"],
  ["vechain", "VET", "vechain,vet"],
  ["polygon-ecosystem-token", "POL", "polygon,pol,matic"],
  ["kaspa", "KAS", "kaspa,kas"],
  ["fetch-ai", "FET", "fetch.ai,fetch ai,fet,artificial superintelligence alliance"],
  ["filecoin", "FIL", "filecoin,fil"],
  ["aptos", "APT", "aptos,apt"],
  ["algorand", "ALGO", "algorand,algo"],
  ["arbitrum", "ARB", "arbitrum,arb"],
  ["cosmos", "ATOM", "cosmos,atom,cosmos hub"],
  ["maker", "MKR", "maker,mkr"],
  ["injective-protocol", "INJ", "injective,inj,injective protocol"],
  ["optimism", "OP", "optimism,op"],
  ["blockstack", "STX", "stacks,stx,blockstack"],
  ["immutable-x", "IMX", "immutable,imx,immutable x"],
  ["the-graph", "GRT", "the graph,grt"],
  ["theta-token", "THETA", "theta,theta network,theta token"],
  ["bonk", "BONK", "bonk"],
  ["lido-dao", "LDO", "lido,lido dao,ldo"],
  ["monero", "XMR", "monero,xmr"],
  ["fantom", "FTM", "fantom,ftm,sonic"],
  ["sei-network", "SEI", "sei,sei network"],
  ["worldcoin-wld", "WLD", "worldcoin,wld"],
  ["floki", "FLOKI", "floki"],
  ["jupiter-exchange-solana", "JUP", "jupiter,jup"],
  ["ondo-finance", "ONDO", "ondo,ondo finance"],
  ["bittensor", "TAO", "bittensor,tao"],
  ["celestia", "TIA", "celestia,tia"],
  ["pyth-network", "PYTH", "pyth,pyth network"],
  [
    "wrapped-bitcoin",
    "WBTC",
    "wrapped bitcoin,wbtc",
    "ethereum",
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  ],
  [
    "weth",
    "WETH",
    "weth,wrapped ether,wrapped ethereum",
    "ethereum",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  ],
  ["dai", "DAI", "dai"],
  ["first-digital-usd", "FDUSD", "first digital usd,fdusd"],
  ["ethena-usde", "USDE", "ethena usde,usde"],
  ["okb", "OKB", "okb"],
  ["leo-token", "LEO", "leo,leo token,unus sed leo"],
  ["mantra-dao", "OM", "mantra,om"],
  ["gatechain-token", "GT", "gate,gt,gatechain"],
  ["bittorrent", "BTT", "bittorrent,btt"],
  ["quant-network", "QNT", "quant,qnt"],
  ["eos", "EOS", "eos"],
  ["flow", "FLOW", "flow"],
  ["tezos", "XTZ", "tezos,xtz"],
  ["axie-infinity", "AXS", "axie infinity,axs"],
  ["decentraland", "MANA", "decentraland,mana"],
  ["sandbox", "SAND", "the sandbox,sandbox,sand"],
  ["gala", "GALA", "gala"],
  ["chiliz", "CHZ", "chiliz,chz"],
  ["curve-dao-token", "CRV", "curve,crv,curve dao"],
  ["pancakeswap-token", "CAKE", "pancakeswap,cake"],
  ["compound-governance-token", "COMP", "compound,comp"],
  ["synthetix-network-token", "SNX", "synthetix,snx"],
  ["1inch", "1INCH", "1inch"],
  ["sushi", "SUSHI", "sushi,sushiswap"],
  ["enjincoin", "ENJ", "enjin,enjincoin,enj"],
  ["basic-attention-token", "BAT", "basic attention token,bat"],
  ["zcash", "ZEC", "zcash,zec"],
  ["dash", "DASH", "dash"],
  ["neo", "NEO", "neo"],
  ["iota", "IOTA", "iota,miota"],
  ["klay-token", "KLAY", "klaytn,klay,kaia"],
  ["mina-protocol", "MINA", "mina,mina protocol"],
  ["helium", "HNT", "helium,hnt"],
  ["arweave", "AR", "arweave,ar"],
  ["theta-fuel", "TFUEL", "theta fuel,tfuel"],
  ["ecash", "XEC", "ecash,xec"],
  ["kava", "KAVA", "kava"],
  ["zilliqa", "ZIL", "zilliqa,zil"],
  ["waves", "WAVES", "waves"],
  ["qtum", "QTUM", "qtum"],
  ["icon", "ICX", "icon,icx"],
  ["ontology", "ONT", "ontology,ont"],
  ["ravencoin", "RVN", "ravencoin,rvn"],
  ["digibyte", "DGB", "digibyte,dgb"],
  ["siacoin", "SC", "siacoin,sc"],
  ["decred", "DCR", "decred,dcr"],
  ["horizen", "ZEN", "horizen,zen"],
  ["nervos-network", "CKB", "nervos,ckb,nervos network"],
  ["rocket-pool-eth", "RETH", "rocket pool eth,reth"],
  ["mantle-staked-ether", "METH", "mantle staked ether,meth"],
  ["coinbase-wrapped-btc", "CBBTC", "coinbase wrapped btc,cbbtc"],
  ["ethereum-name-service", "ENS", "ethereum name service,ens"],
  ["blur", "BLUR", "blur"],
  ["storj", "STORJ", "storj"],
  ["render-token", "RNDR", "rndr"],
  ["wrapped-bitcoin", "WBTC", "wrapped bitcoin,wbtc"],
  ["weth", "WETH", "weth,wrapped ether"],
  ["dai", "DAI", "dai"],
  ["okb", "OKB", "okb"],
  ["leo-token", "LEO", "leo,unus sed leo"],
  ["quant-network", "QNT", "quant,qnt"],
  ["eos", "EOS", "eos"],
  ["flow", "FLOW", "flow"],
  ["tezos", "XTZ", "tezos,xtz"],
  ["axie-infinity", "AXS", "axie infinity,axs"],
  ["decentraland", "MANA", "decentraland,mana"],
  ["the-sandbox", "SAND", "the sandbox,sandbox,sand"],
  ["chiliz", "CHZ", "chiliz,chz"],
  ["curve-dao-token", "CRV", "curve,crv"],
  ["pancakeswap-token", "CAKE", "pancakeswap,cake"],
  ["compound-governance-token", "COMP", "compound,comp"],
  ["synthetix-network-token", "SNX", "synthetix,snx"],
  ["1inch", "1INCH", "1inch"],
  ["sushi", "SUSHI", "sushi,sushiswap"],
  ["enjincoin", "ENJ", "enjin,enj"],
  ["basic-attention-token", "BAT", "basic attention token,bat"],
  ["zcash", "ZEC", "zcash,zec"],
  ["dash", "DASH", "dash"],
  ["neo", "NEO", "neo"],
  ["iota", "IOTA", "iota,miota"],
  ["klay-token", "KLAY", "klaytn,klay,kaia"],
  ["mina-protocol", "MINA", "mina,mina protocol"],
  ["helium", "HNT", "helium,hnt"],
  ["arweave", "AR", "arweave,ar"],
  ["ecash", "XEC", "ecash,xec"],
  ["kava", "KAVA", "kava"],
  ["zilliqa", "ZIL", "zilliqa,zil"],
  ["waves", "WAVES", "waves"],
  ["qtum", "QTUM", "qtum"],
  ["icon", "ICX", "icon,icx"],
  ["ontology", "ONT", "ontology,ont"],
  ["ravencoin", "RVN", "ravencoin,rvn"],
  ["digibyte", "DGB", "digibyte,dgb"],
  ["siacoin", "SC", "siacoin,sc"],
  ["decred", "DCR", "decred,dcr"],
  ["horizen", "ZEN", "horizen,zen"],
  ["nervos-network", "CKB", "nervos,ckb"],
  ["rocket-pool-eth", "RETH", "rocket pool eth,reth"],
  ["coinbase-wrapped-btc", "CBBTC", "coinbase wrapped btc,cbbtc"],
  ["ethereum-name-service", "ENS", "ethereum name service,ens"],
  ["pendle", "PENDLE", "pendle"],
  ["ethena", "ENA", "ethena,ena"],
  ["eigenlayer", "EIGEN", "eigenlayer,eigen"],
  ["dogwifcoin", "WIF", "dogwifhat,wif"],
  ["popcat", "POPCAT", "popcat"],
  ["notcoin", "NOT", "notcoin,not"],
  ["starknet", "STRK", "starknet,strk"],
  ["zksync", "ZK", "zksync,zk"],
  ["manta-network", "MANTA", "manta,manta network"],
  ["ether-fi", "ETHFI", "ether.fi,etherfi,ethfi"],
  ["dymension", "DYM", "dymension,dym"],
  ["jito-governance-token", "JTO", "jito,jto"],
  ["wormhole", "W", "wormhole"],
  ["layerzero", "ZRO", "layerzero,zro"],
  ["axelar", "AXL", "axelar,axl"],
  ["celo", "CELO", "celo"],
  ["osmosis", "OSMO", "osmosis,osmo"],
  ["thorchain", "RUNE", "thorchain,rune"],
  ["gmx", "GMX", "gmx"],
  ["aerodrome-finance", "AERO", "aerodrome,aero"],
  ["raydium", "RAY", "raydium,ray"],
  ["orca", "ORCA", "orca"],
  ["akash-network", "AKT", "akash,akt"],
  ["livepeer", "LPT", "livepeer,lpt"],
  ["jasmycoin", "JASMY", "jasmy,jasmycoin"],
  ["ankr", "ANKR", "ankr"],
  ["yearn-finance", "YFI", "yearn,yfi"],
  ["convex-finance", "CVX", "convex,cvx"],
  ["balancer", "BAL", "balancer,bal"],
  ["frax", "FRAX", "frax"],
  ["rocket-pool", "RPL", "rocket pool,rpl"],
  ["illuvium", "ILV", "illuvium,ilv"],
  ["mask-network", "MASK", "mask,mask network"],
  ["audius", "AUDIO", "audius,audio"],
  ["ronin", "RON", "ronin,ron"],
  ["stepn", "GMT", "stepn,gmt"],
  ["dydx-chain", "DYDX", "dydx"],
  ["coredaoorg", "CORE", "core,core dao"],
  ["flare-networks", "FLR", "flare,flr"],
  ["xinfin", "XDC", "xdc,xinfin"],
  ["nexo", "NEXO", "nexo"],
  ["pax-gold", "PAXG", "pax gold,paxg"],
  ["true-usd", "TUSD", "trueusd,tusd"],
  ["first-digital-usd", "FDUSD", "fdusd"],
  ["ethena-usde", "USDE", "usde"],
  ["mantra-dao", "OM", "mantra,om"],
  ["gatechain-token", "GT", "gate token,gt"],
  ["bittorrent", "BTT", "bittorrent,btt"],
  ["theta-fuel", "TFUEL", "theta fuel,tfuel"],
  ["virtual-protocol", "VIRTUAL", "virtual,virtual protocol"],
  ["spx6900", "SPX", "spx6900,spx"],
  ["official-trump", "TRUMP", "trump,official trump"],
  ["grass", "GRASS", "grass"],
  ["io", "IO", "io.net,ionet"],
  ["berachain-bera", "BERA", "bera,berachain"],
  ["movement", "MOVE", "movement"],
  ["saga-2", "SAGA", "saga"],
  ["celestia", "TIA", "celestia,tia"],
  ["pyth-network", "PYTH", "pyth,pyth network"],
  ["jupiter-exchange-solana", "JUP", "jupiter,jup"],
  ["ondo-finance", "ONDO", "ondo"],
  ["bittensor", "TAO", "bittensor,tao"],
  ["sei-network", "SEI", "sei"],
  ["worldcoin-wld", "WLD", "worldcoin,wld"],
  ["floki", "FLOKI", "floki"],
  ["bonk", "BONK", "bonk"],
  ["pepe", "PEPE", "pepe"],
  ["shiba-inu", "SHIB", "shiba inu,shib"],
];

function buildMajors(): MajorAlias[] {
  const byId = new Map<string, MajorAlias>();
  for (const row of MAJOR_ROWS) {
    const [id, symbol, namesCsv, chain, address] = row;
    const names = namesCsv
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);
    const existing = byId.get(id);
    if (existing) {
      for (const n of names) {
        if (!existing.names.includes(n)) existing.names.push(n);
      }
      if (!existing.preferred && chain && address) {
        existing.preferred = { chain, address };
      }
      continue;
    }
    byId.set(id, {
      id,
      symbol: symbol.toUpperCase(),
      names: [...new Set([symbol.toLowerCase(), id.toLowerCase(), ...names])],
      preferred: chain && address ? { chain, address } : undefined,
    });
  }
  return [...byId.values()];
}

export const MAJOR_ALIASES: MajorAlias[] = buildMajors();

const BY_SYMBOL = new Map<string, MajorAlias>();
const BY_NAME = new Map<string, MajorAlias>();
const BY_ID = new Map<string, MajorAlias>();

for (const m of MAJOR_ALIASES) {
  BY_ID.set(m.id.toLowerCase(), m);
  // First writer wins for symbol — prefer earlier (higher-cap) rows
  if (!BY_SYMBOL.has(m.symbol.toUpperCase())) {
    BY_SYMBOL.set(m.symbol.toUpperCase(), m);
  }
  for (const n of m.names) {
    if (!BY_NAME.has(n)) BY_NAME.set(n, m);
  }
}

/** Exact ticker, exact/strong name, or gecko id → canonical major. */
export function resolveMajorAlias(query: string): MajorAlias | null {
  const q = query.trim();
  if (!q) return null;
  const lower = q.toLowerCase();
  const upper = q.toUpperCase();

  const bySym = BY_SYMBOL.get(upper);
  if (bySym) return bySym;

  const byId = BY_ID.get(lower);
  if (byId) return byId;

  const byName = BY_NAME.get(lower);
  if (byName) return byName;

  return null;
}

export function isCanonicalMajorId(id: string): boolean {
  return BY_ID.has(id.trim().toLowerCase());
}

export function majorById(id: string): MajorAlias | null {
  return BY_ID.get(id.trim().toLowerCase()) ?? null;
}

/** Symbols that belong to the same major family (BTC↔WBTC). */
export function majorFamilySymbols(major: MajorAlias): Set<string> {
  const out = new Set<string>([major.symbol.toUpperCase()]);
  if (major.symbol === "BTC") out.add("WBTC").add("CBBTC");
  if (major.symbol === "ETH") out.add("WETH").add("STETH").add("WSTETH").add("RETH");
  if (major.symbol === "SOL") out.add("WSOL");
  if (major.symbol === "BNB") out.add("WBNB");
  if (major.symbol === "AVAX") out.add("WAVAX");
  return out;
}
