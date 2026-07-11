/** Curated project updates (RSS-style). Replace with X API or RSS when available. */
export type ProjectUpdate = {
  id: string;
  title: string;
  publishedAt: string;
  summary: string;
  href: string;
};

export const PROJECT_UPDATES: ProjectUpdate[] = [
  {
    id: "1",
    title: "Altcoin Depot hub refresh",
    publishedAt: "2026-04-10T14:00:00Z",
    summary: "Live ticker, price tables, and roadmap for directory + tools.",
    href: "https://x.com/altcoindepot",
  },
  {
    id: "2",
    title: "CoinGecko market data",
    publishedAt: "2026-04-08T10:30:00Z",
    summary: "Top coins and 24h moves update automatically on the homepage.",
    href: "https://x.com/altcoindepot",
  },
  {
    id: "3",
    title: "Affiliate disclosure",
    publishedAt: "2026-04-05T09:15:00Z",
    summary: "Exchange links are placeholders until official referral IDs are configured.",
    href: "https://x.com/altcoindepot",
  },
  {
    id: "4",
    title: "Coming: blog & guides",
    publishedAt: "2026-04-01T16:45:00Z",
    summary: "Deep dives on Layer 1s, DePIN, and risk checks for new listings.",
    href: "https://x.com/altcoindepot",
  },
];
