import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://altcoindepot.com"),
  title: {
    default:
      "AltCoinDepot — Live Altcoin Prices, Layer 1 & DePIN Tickers | Buy & Track 2026",
    template: "%s · AltCoinDepot",
  },
  description:
    "AltCoinDepot: near real-time altcoin prices, Layer 1 and DePIN tickers with 24h color moves, top-10 marquee, and sortable tables — jump to each project on X and to exchanges when you’re ready.",
  openGraph: {
    title: "AltCoinDepot — Live Prices, L1 & DePIN Tickers",
    description:
      "Track top coins, ecosystem tickers, and market cap in one dark hub. Built for quick scans and serious research.",
    url: "https://altcoindepot.com",
    siteName: "AltCoinDepot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AltCoinDepot — Altcoin prices that keep moving",
    description:
      "Live-updating tickers, X links for projects, and neon buy CTAs — your altcoin command center.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] font-sans text-zinc-100">
        {children}
      </body>
    </html>
  );
}
