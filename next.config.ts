import type { NextConfig } from "next";
import { COIN_ID_ALIASES } from "./lib/coin-id-aliases";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.dexscreener.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dd.dexscreener.com",
        pathname: "/**",
      },
      // YouTube thumbnails are often served from numbered CDN hosts (i1, i2, …).
      ...["i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8", "i9"].map((h) => ({
        protocol: "https" as const,
        hostname: `${h}.ytimg.com`,
        pathname: "/**" as const,
      })),
    ],
  },
  async redirects() {
    return Object.entries(COIN_ID_ALIASES).map(([from, to]) => ({
      source: `/coin/${from}`,
      destination: `/coin/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
