import type { NextConfig } from "next";

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
      // YouTube thumbnails are often served from numbered CDN hosts (i1, i2, …).
      ...["i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8", "i9"].map((h) => ({
        protocol: "https" as const,
        hostname: `${h}.ytimg.com`,
        pathname: "/**" as const,
      })),
    ],
  },
};

export default nextConfig;
