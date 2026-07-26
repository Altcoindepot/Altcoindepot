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

export type CoinSeoExtras = {
  /** Relative 7d performance vs Bitcoin (coin % − BTC %), when known. */
  vsBtc7d?: number | null;
  /** Short narrative labels (Layer 1, AI, …) for discovery phrasing. */
  tags?: string[];
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

function formatVsBtc(vs: number): string {
  const sign = vs >= 0 ? "+" : "";
  return `${sign}${vs.toFixed(1)}% vs BTC (7d)`;
}

function pickDescription(
  name: string,
  sym: string,
  seed: number,
  extras?: CoinSeoExtras,
): string {
  // Offset description pattern from title so pairs don't lock 1:1 forever.
  const idx = (seed + 1) % DESCRIPTION_BUILDERS.length;
  let primary = DESCRIPTION_BUILDERS[idx]!(name, sym);

  const vs =
    extras?.vsBtc7d != null && Number.isFinite(extras.vsBtc7d) ? extras.vsBtc7d : null;
  const tagBit =
    extras?.tags && extras.tags.length > 0
      ? extras.tags.slice(0, 2).join(", ")
      : null;

  if (vs != null) {
    const withBtc = `Live ${name} (${sym}) price & chart. ${formatVsBtc(vs)}. Track ${sym} on AltCoin Depot.`;
    if (withBtc.length <= DESC_MAX) primary = withBtc;
  } else if (tagBit) {
    const withTags = `Live ${name} (${sym}) price, chart & market cap. ${tagBit}. Track on AltCoin Depot.`;
    if (withTags.length <= DESC_MAX) primary = withTags;
  }

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
  extras?: CoinSeoExtras,
): CoinSeoCopy {
  const coinName = name.trim() || "Coin";
  const sym = symbol.trim().toUpperCase() || "—";
  const seed = patternSeed((coinId ?? `${coinName}:${sym}`).toLowerCase());
  return {
    title: pickTitle(coinName, sym, seed),
    description: pickDescription(coinName, sym, seed, extras),
  };
}
