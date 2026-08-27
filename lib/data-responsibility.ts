/**
 * Plain-language user responsibility for public DEX data.
 * Keep meaning intact if you tighten wording elsewhere.
 */
export const DATA_RESPONSIBILITY_DISCLAIMER =
  "Prices and pair data come from public DEX sources (including DexScreener) and may be delayed, incomplete, or wrong. Tickers are reused by scams. You must verify the correct contract address and information before any decision. Informational only — not financial advice.";

/** Short line for contract / copy controls on token pages. */
export const CONTRACT_VERIFY_NOTE =
  "You must verify this contract address — tickers are reused by scams. Informational only — not financial advice.";

/**
 * One shared accept flag for DEX list/scanner risk modals so accepting once
 * does not force another popup when navigating between those pages.
 */
export const SHARED_DEX_RISK_DISCLAIMER_KEY = "dex-list-risk-disclaimer-accepted";

export const LEGACY_LOWCAPS_DISCLAIMER_KEY = "lowcaps-disclaimer-accepted";
export const LEGACY_JUST_LAUNCHED_DISCLAIMER_KEY = "just-launched-disclaimer-accepted";
