import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import { PriceAlertWatcher } from "@/components/price-alert-watcher";
import { SiteFooter } from "@/components/site-footer";
import { ToastHost } from "@/components/toast-host";
import { BackToTop } from "@/components/back-to-top";
import { MobileTabBar } from "@/components/mobile-tab-bar";
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
    default: "AltCoin Depot – Market Regime, Live Crypto Prices & Compare",
    template: "%s · AltCoin Depot",
  },
  description:
    "Live crypto market dashboard: Market Regime, Market Brief, prices, gainers & losers, and side-by-side coin compare. Free real-time data on AltCoin Depot.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-mark.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "AltCoin Depot – Market Regime, Live Crypto Prices & Compare",
    description:
      "Live crypto market dashboard: Market Regime, Market Brief, prices, gainers & losers, and side-by-side coin compare. Free real-time data on AltCoin Depot.",
    url: "https://altcoindepot.com",
    siteName: "AltCoin Depot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AltCoin Depot – Market Regime, Live Crypto Prices & Compare",
    description:
      "Live crypto market dashboard: Market Regime, Market Brief, prices, gainers & losers, and side-by-side coin compare. Free real-time data on AltCoin Depot.",
  },
  // Do not set robots here: parent `index, follow` conflicts with Next.js
  // auto-`noindex` on real 404s (soft-404 / conflicting signals in Search Console).
  // Public pages are indexable by default; coin pages set robots explicitly.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <div className="flex min-h-full flex-1 flex-col pb-[4.25rem] lg:pb-0">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
          <MobileTabBar />
          <PriceAlertWatcher />
          <ToastHost />
          <BackToTop />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
