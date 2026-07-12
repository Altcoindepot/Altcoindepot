import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
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
    default: "AltCoin Depot - Live Crypto Prices, Charts & Market Data",
    template: "%s · AltCoin Depot",
  },
  description: "AltCoin Depot - Live Crypto Prices, Charts & Market Data",
  openGraph: {
    title: "AltCoin Depot - Live Crypto Prices, Charts & Market Data",
    description: "AltCoin Depot - Live Crypto Prices, Charts & Market Data",
    url: "https://altcoindepot.com",
    siteName: "AltCoin Depot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AltCoin Depot - Live Crypto Prices, Charts & Market Data",
    description: "AltCoin Depot - Live Crypto Prices, Charts & Market Data",
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
        <ThemeProvider>{children}</ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
