/**
 * Rotating SEO templates for coin pages.
 * Pattern choice is stable per coin id so crawlers see consistent tags.
 * Titles use absolute strings so the root layout template does not
 * append a second `| AltCoin Depot` / `· AltCoin Depot` suffix.
 */
export type CoinSeoCopy = {
  title: string;
  description: string;
};

const TITLE_BUILDERS: Array<(name: string, sym: string) => string> = [
  (name, sym) => `${name} (${sym}) Price, Chart & Market Cap | AltCoin Depot`,
  (name) => `${name} Price Today – Live Chart & Stats | AltCoin Depot`,
  (_name, sym) => `${sym} Price, Chart & Market Data | AltCoin Depot`,
  (name, sym) => `Live ${name} (${sym}) Price & Chart | AltCoin Depot`,
];

const DESCRIPTION_BUILDERS: Array<(name: string, sym: string) => string> = [
  (name, sym) =>
    `Live ${name} (${sym}) price, historical chart, market cap, volume, and key stats. Track ${sym} in real time on AltCoin Depot.`,
  (name, sym) =>
    `Track live ${name} (${sym}) price, chart, market cap, and trading volume. Updated in real time on AltCoin Depot.`,
  (name, sym) =>
    `Get real-time ${name} (${sym}) price data, charts, and market stats. Follow ${sym} performance on AltCoin Depot.`,
  (name, sym) =>
    `Live ${name} (${sym}) price, chart, and market cap. Track ${sym} in real time.`,
];

const TITLE_MAX = 60;
const DESC_MAX = 160;

/** Stable non-crypto hash so the same coin always gets the same pattern pair. */
function patternSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clampLen(text: string, max: number): string {
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max - 1).trimEnd();
  return `${trimmed}…`;
}

function pickTitle(name: string, sym: string, seed: number): string {
  const primary = TITLE_BUILDERS[seed % TITLE_BUILDERS.length]!(name, sym);
  if (primary.length <= TITLE_MAX) return primary;

  // Prefer shorter patterns when the primary title runs long.
  const preferredOrder = [
    TITLE_BUILDERS[2]!(name, sym), // SYMBOL-led
    TITLE_BUILDERS[3]!(name, sym), // Live Name (SYM)…
    TITLE_BUILDERS[1]!(name, sym), // Name Price Today…
    primary,
  ];
  for (const candidate of preferredOrder) {
    if (candidate.length <= TITLE_MAX) return candidate;
  }

  // Last resort: compact absolute title under the limit.
  const compact = `${sym} Price & Chart | AltCoin Depot`;
  if (compact.length <= TITLE_MAX) return compact;
  return clampLen(compact, TITLE_MAX);
}

function pickDescription(name: string, sym: string, seed: number): string {
  // Offset description pattern from title so pairs don't lock 1:1 forever.
  const idx = (seed + 1) % DESCRIPTION_BUILDERS.length;
  const primary = DESCRIPTION_BUILDERS[idx]!(name, sym);
  if (primary.length <= DESC_MAX) return primary;

  for (const builder of DESCRIPTION_BUILDERS) {
    const candidate = builder(name, sym);
    if (candidate.length <= DESC_MAX) return candidate;
  }
  return clampLen(DESCRIPTION_BUILDERS[3]!(name, sym), DESC_MAX);
}

export function buildCoinSeoCopy(
  name: string,
  symbol: string,
  coinId?: string,
): CoinSeoCopy {
  const coinName = name.trim() || "Coin";
  const sym = symbol.trim().toUpperCase() || "—";
  const seed = patternSeed((coinId ?? `${coinName}:${sym}`).toLowerCase());
  return {
    title: pickTitle(coinName, sym, seed),
    description: pickDescription(coinName, sym, seed),
  };
}
