/**
 * Token icon URLs — Dex first, optional Gecko cache, never fetch for a picture alone.
 */

import { isTokenAddress, normalizeDexChainId } from "@/lib/dex-token-path";

/** DexScreener CDN path for a token contract (works for most listed majors). */
export function dexCdnTokenImageUrl(
  chain: string | undefined,
  address: string | undefined,
): string | null {
  const chainId = normalizeDexChainId(chain);
  const raw = address?.trim() ?? "";
  if (!chainId || !raw || !isTokenAddress(raw)) return null;
  const addr = raw.startsWith("0x") ? raw.toLowerCase() : raw;
  return `https://dd.dexscreener.com/ds-data/tokens/${encodeURIComponent(chainId)}/${encodeURIComponent(addr)}.png`;
}

function isHttpUrl(v: string | null | undefined): v is string {
  if (!v) return false;
  const t = v.trim();
  return /^https?:\/\//i.test(t);
}

/**
 * Prefer Dex pair image → Dex CDN → cached Gecko image.small.
 * Returns null when nothing usable (letter badge).
 */
export function resolveTokenImageUrl(opts: {
  dexImage?: string | null;
  chain?: string | null;
  address?: string | null;
  geckoImageSmall?: string | null;
}): string | null {
  if (isHttpUrl(opts.dexImage)) return opts.dexImage.trim();
  const cdn = dexCdnTokenImageUrl(opts.chain ?? undefined, opts.address ?? undefined);
  if (cdn) return cdn;
  if (isHttpUrl(opts.geckoImageSmall)) return opts.geckoImageSmall.trim();
  return null;
}
