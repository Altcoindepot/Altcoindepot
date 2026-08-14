/** On-site DexScreener token page path. Safe to import from client components. */
export function dexTokenPath(
  chain: string | undefined,
  address: string | undefined,
): string | null {
  const chainId = chain?.trim().toLowerCase() ?? "";
  const token = address?.trim() ?? "";
  if (!/^[a-z0-9-]{1,32}$/.test(chainId)) return null;
  if (!isTokenAddress(token)) return null;
  return `/token/${encodeURIComponent(chainId)}/${encodeURIComponent(token)}`;
}

export function isTokenAddress(value: string): boolean {
  const v = value.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) return true;
  return false;
}

export function sanitizeChainParam(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  return /^[a-z0-9-]{1,32}$/.test(v) ? v : null;
}

export function sanitizeAddressParam(raw: string): string | null {
  const v = raw.trim();
  return isTokenAddress(v) ? v : null;
}

export function sameTokenAddress(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
