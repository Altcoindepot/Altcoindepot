import { unstable_cache } from "next/cache";
import {
  mergeDexProjectLinks,
  parseDexProjectLinks,
  type DexProjectLink,
} from "@/lib/dex-project-links";

const DEX_BASE = "https://api.dexscreener.com";
const REVALIDATE = 300;

async function dexFetch(path: string): Promise<unknown> {
  const res = await fetch(`${DEX_BASE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "force-cache",
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) return null;
  return res.json();
}

function ingest(raw: unknown, into: Record<string, DexProjectLink[]>) {
  if (!Array.isArray(raw)) return;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as {
      chainId?: unknown;
      tokenAddress?: unknown;
      links?: unknown;
    };
    if (typeof row.chainId !== "string" || typeof row.tokenAddress !== "string") continue;
    const chain = row.chainId.trim().toLowerCase();
    const address = row.tokenAddress.trim();
    if (!chain || !address) continue;
    const links = parseDexProjectLinks({ profileLinks: row.links });
    if (links.length === 0) continue;
    const key = `${chain}:${address.toLowerCase()}`;
    into[key] = mergeDexProjectLinks(into[key], links);
  }
}

async function loadProfileLinksUncached(): Promise<Record<string, DexProjectLink[]>> {
  const [profiles, recent, boosts] = await Promise.all([
    dexFetch("/token-profiles/latest/v1"),
    dexFetch("/token-profiles/recent-updates/v1"),
    dexFetch("/token-boosts/latest/v1"),
  ]);
  const into: Record<string, DexProjectLink[]> = {};
  ingest(profiles, into);
  ingest(recent, into);
  ingest(boosts, into);
  return into;
}

const loadProfileLinksCached = unstable_cache(
  loadProfileLinksUncached,
  ["dexscreener-profile-links-v1"],
  { revalidate: REVALIDATE },
);

/** Website/socials from DexScreener token-profiles and boosts, keyed by `chain:address`. */
export async function getDexProfileLinksByToken(): Promise<Record<string, DexProjectLink[]>> {
  try {
    return await loadProfileLinksCached();
  } catch (err) {
    console.warn("[dex-profile-links] fetch failed", err);
    return {};
  }
}
