import type { MetadataRoute } from "next";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";

const SITE = "https://altcoindepot.com";

const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/disclaimer",
  "/affiliate-disclosure",
  "/coin",
  "/podcasts",
  "/blog",
  "/directory",
  "/tools",
  "/cex-trending",
  "/dex-trending",
  "/top-100-trending",
  "/top-200-trending",
  "/watchlist",
  "/portfolio",
  "/alerts",
] as const;

const TOP_COIN_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "binancecoin",
  "usd-coin",
  "ripple",
  "solana",
  "tron",
  "dogecoin",
  "cardano",
  "chainlink",
  "hyperliquid",
  "avalanche-2",
  "stellar",
  "monero",
  "litecoin",
  "bitcoin-cash",
  "uniswap",
  "hedera-hashgraph",
  "shiba-inu",
  "injective-protocol",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "hourly" : "daily",
    priority: path === "/" ? 1 : 0.7,
  }));

  const coinEntries: MetadataRoute.Sitemap = TOP_COIN_IDS.map((id) => ({
    url: `${SITE}/coin/${id}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.9,
  }));

  const categoryEntries: MetadataRoute.Sitemap = PUBLIC_CATEGORIES.map((category) => ({
    url: `${SITE}/category/${encodeURIComponent(category.slug)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticEntries, ...coinEntries, ...categoryEntries];
}
