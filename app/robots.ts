import type { MetadataRoute } from "next";

/** Allow all public pages to be crawled and indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
      },
    ],
    sitemap: "https://altcoindepot.com/sitemap.xml",
    host: "https://altcoindepot.com",
  };
}
