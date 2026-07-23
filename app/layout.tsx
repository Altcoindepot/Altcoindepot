import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import { PriceAlertWatcher } from "@/components/price-alert-watcher";
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
    default: "AltCoin Depot – Live Crypto Prices, Charts & Market Data",
    template: "%s · AltCoin Depot",
  },
  description:
    "Track real-time cryptocurrency prices, charts, and market data for Bitcoin, Ethereum, and top altcoins. Free and updated live.",
  openGraph: {
    title: "AltCoin Depot – Live Crypto Prices, Charts & Market Data",
    description:
      "Track real-time cryptocurrency prices, charts, and market data for Bitcoin, Ethereum, and top altcoins. Free and updated live.",
    url: "https://altcoindepot.com",
    siteName: "AltCoin Depot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AltCoin Depot – Live Crypto Prices, Charts & Market Data",
    description:
      "Track real-time cryptocurrency prices, charts, and market data for Bitcoin, Ethereum, and top altcoins. Free and updated live.",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          {children}
          <PriceAlertWatcher />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
