import Image from "next/image";
import Link from "next/link";
import type { CoinGeckoDetail } from "@/lib/coingecko";
import type { XFeedItem } from "@/lib/x-feed";
import type { MediumFeedItem } from "@/lib/medium-feed";
import type { CoinNewsItem } from "@/lib/coin-news";
import type { YoutubeFeedItem } from "@/lib/youtube-feed";
import type { ReppoStatsSnapshot } from "@/lib/reppo-stats-data";
import { CoinXFeed } from "@/components/coin-x-feed";
import { CoinNewsFeed } from "@/components/coin-news-feed";
import { CoinYoutubeFeed } from "@/components/coin-youtube-feed";
import { ReppoStatsSection } from "@/components/reppo-stats-section";
import { CoinGeckoPriceChart } from "@/components/coingecko-price-chart";
import { formatShortMonthDay } from "@/lib/format-date";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { CoingeckoLogoAttribution } from "@/components/coingecko-logo-attribution";
import { WatchlistToggleButton } from "@/components/watchlist-toggle-button";
import { PriceAlertForm } from "@/components/price-alert-form";
import { RelatedCoins } from "@/components/related-coins";

function tradingViewSymbol(symbol: string | undefined) {
  return (symbol ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function tradingViewCandidates(coinId: string, symbol: string): string[] {
  const s = tradingViewSymbol(symbol);
  const fallback = [
    `BINANCE:${s}USDT`,
    `BYBIT:${s}USDT`,
    `COINBASE:${s}USD`,
    `KRAKEN:${s}USD`,
    `KUCOIN:${s}USDT`,
    `GATEIO:${s}USDT`,
    `MEXC:${s}USDT`,
  ];
  const byId: Record<string, string[]> = {
    bitcoin: ["BINANCE:BTCUSDT", "COINBASE:BTCUSD"],
    ethereum: ["BINANCE:ETHUSDT", "COINBASE:ETHUSD"],
    tether: ["CRYPTOCAP:USDT", "BINANCE:USDTUSD"],
    "usd-coin": ["CRYPTOCAP:USDC", "COINBASE:USDCUSD"],
    "wrapped-bitcoin": ["COINBASE:BTCUSD", "BINANCE:BTCUSDT"],
    "staked-ether": ["COINBASE:ETHUSD", "BINANCE:ETHUSDT"],
    "leo-token": ["BITFINEX:LEOUSD", "BITFINEX:LEOUSDT"],
    okb: ["OKX:OKBUSDT", "OKX:OKBUSD"],
    "the-open-network": ["BINANCE:TONUSDT", "BYBIT:TONUSDT"],
  };
  return [...new Set([...(byId[coinId] ?? []), ...fallback])];
}

function tradingViewFromCoinGeckoTickers(
  tickers: CoinGeckoDetail["tickers"],
): string[] {
  if (!Array.isArray(tickers)) return [];
  const exchangeToTv: Record<string, string> = {
    binance: "BINANCE",
    bybit_spot: "BYBIT",
    bybit: "BYBIT",
    coinbase_exchange: "COINBASE",
    kraken: "KRAKEN",
    bitfinex: "BITFINEX",
    okx: "OKX",
    okex: "OKX",
    kucoin: "KUCOIN",
    gate: "GATEIO",
    mexc: "MEXC",
  };
  const allowedTargets = new Set(["USDT", "USD", "USDC", "BTC", "ETH"]);
  const out: string[] = [];
  for (const t of tickers.slice(0, 80)) {
    const ex = t.market?.identifier?.toLowerCase() ?? "";
    const tvEx = exchangeToTv[ex];
    if (!tvEx) continue;
    const base = tradingViewSymbol(t.base ?? "");
    const target = tradingViewSymbol(t.target ?? "");
    if (!base || !target || !allowedTargets.has(target)) continue;
    out.push(`${tvEx}:${base}${target}`);
  }
  return [...new Set(out)];
}

function usd(obj: Record<string, number> | undefined): number | null {
  const v = obj?.usd;
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function formatNum(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function formatPctText(v: number | null | undefined, digits = 2) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v.toFixed(digits)}%`;
}

function signedPctText(v: number | null | undefined, digits = 2) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

function pct(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  const s = `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  const cls =
    v >= 0 ? "text-emerald-400" : "text-red-400";
  return <span className={cls}>{s}</span>;
}

function pctNum(v: number | null | undefined): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function MiniSparkline({
  points,
  color = "#00ff9f",
}: {
  points: number[];
  color?: string;
}) {
  const width = 220;
  const height = 64;
  if (!points.length) {
    return <div className="mt-2 h-16 rounded-md border border-white/10 bg-[#0a0a0a]" />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const polyline = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 h-16 w-full rounded-md border border-white/10 bg-[#0a0a0a]"
      role="img"
      aria-label="Trend sparkline"
    >
      <defs>
        <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${height} ${polyline} ${width},${height}`} fill="url(#sparkline-fill)" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniRangeBar({
  low,
  high,
  current,
}: {
  low: number | null;
  high: number | null;
  current: number | null;
}) {
  const pct =
    low != null && high != null && current != null && high > low
      ? clamp(((current - low) / (high - low)) * 100, 0, 100)
      : null;
  return (
    <div className="mt-2 rounded-md border border-white/10 bg-[#0a0a0a] px-2 py-2">
      <div className="relative h-2 rounded-full bg-zinc-800">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00ff9f]/20 via-[#00ff9f]/35 to-[#00ff9f]/20" />
        {pct != null ? (
          <span
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00ff9f]/80 bg-[#00ff9f] shadow-[0_0_10px_rgba(0,255,159,0.6)]"
            style={{ left: `${pct}%` }}
          />
        ) : null}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
        <span>24h low</span>
        <span>24h high</span>
      </div>
    </div>
  );
}

function MiniMomentumBars({
  values,
}: {
  values: Array<{ label: string; value: number | null }>;
}) {
  const cap = 25;
  return (
    <div className="mt-2 grid grid-cols-4 gap-1 rounded-md border border-white/10 bg-[#0a0a0a] p-2">
      {values.map((v) => {
        const heightPct = v.value == null ? 8 : clamp((Math.abs(v.value) / cap) * 100, 8, 100);
        const positive = (v.value ?? 0) >= 0;
        return (
          <div key={v.label} className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-full items-end rounded-sm bg-zinc-900/80 px-1 py-1">
              <div
                className={`w-full rounded-sm ${positive ? "bg-emerald-400/80" : "bg-red-400/80"}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500">{v.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MiniGauge({ value }: { value: number }) {
  const bounded = clamp(value, -30, 30);
  const pct = ((bounded + 30) / 60) * 100;
  return (
    <div className="mt-2 rounded-md border border-white/10 bg-[#0a0a0a] p-2">
      <div className="h-2 rounded-full bg-gradient-to-r from-red-500/70 via-zinc-600 to-emerald-400/80" />
      <div className="relative -mt-2 h-4">
        <span
          className="absolute top-0 h-4 w-4 -translate-x-1/2 rounded-full border border-white/30 bg-white shadow-[0_0_10px_rgba(255,255,255,0.35)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>Bearish</span>
        <span>Neutral</span>
        <span>Bullish</span>
      </div>
    </div>
  );
}

function stripHtmlToText(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function firstHttpUrlFromUnknown(value: unknown): string | undefined {
  if (typeof value === "string") {
    return /^https?:\/\//i.test(value) ? value : undefined;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && /^https?:\/\//i.test(item)) return item;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const hit = firstHttpUrlFromUnknown(v);
      if (hit) return hit;
    }
  }
  return undefined;
}

type ExchangeButton = {
  id: string;
  label: string;
  exchangeName: string;
  href: string;
  className: string;
};

function exchangeThemeClass(identifier: string): string {
  const id = identifier.toLowerCase();
  if (id.includes("binance")) {
    return "border-[#f0b90b]/70 bg-gradient-to-b from-[#4a3a10] to-[#2b2308] text-[#f0b90b] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_#1a1405] hover:brightness-110";
  }
  if (id.includes("kraken")) {
    return "border-[#6f4cff]/70 bg-gradient-to-b from-[#34265a] to-[#1d1734] text-[#b8a6ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_0_#120e22] hover:brightness-110";
  }
  if (id.includes("coinbase")) {
    return "border-[#2f6aff]/70 bg-gradient-to-b from-[#1f3772] to-[#101e43] text-[#8fb3ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_0_#0a1228] hover:brightness-110";
  }
  if (id.includes("bybit")) {
    return "border-[#f5be4f]/70 bg-[#2b2212] text-[#f5be4f] hover:bg-[#3a2d18]";
  }
  if (id.includes("kucoin")) {
    return "border-[#00d1b2]/70 bg-[#0d2d2a] text-[#6de9d8] hover:bg-[#13413d]";
  }
  if (id.includes("okx") || id.includes("okex")) {
    return "border-zinc-300/50 bg-zinc-800/60 text-zinc-100 hover:bg-zinc-700/70";
  }
  if (id.includes("mexc")) {
    return "border-[#2ad3b0]/70 bg-gradient-to-b from-[#12413a] to-[#0b2a25] text-[#7cf0d7] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_0_#071a17] hover:brightness-110";
  }
  return "border-[#00ff9f]/70 bg-gradient-to-b from-[#1c3f37] to-[#0f1420] text-[#87ffd0] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_0_#09110f] hover:brightness-110";
}

type CoinTickerRow = NonNullable<CoinGeckoDetail["tickers"]>[number];

function exchangeButtons(coin: CoinGeckoDetail): ExchangeButton[] {
  const tickers = Array.isArray(coin.tickers) ? coin.tickers : [];
  const preferredTargets = ["USDT", "USD", "USDC", "BTC", "ETH"];
  const preferredExchanges = ["binance", "kraken", "coinbase", "mexc"] as const;
  type Canonical = (typeof preferredExchanges)[number] | "other";

  function canonicalExchange(t: CoinTickerRow): Canonical {
    const id = (t.market?.identifier ?? "").toLowerCase();
    const name = (t.market?.name ?? "").toLowerCase();
    const value = `${id} ${name}`;
    if (value.includes("binance")) return "binance";
    if (value.includes("kraken")) return "kraken";
    if (value.includes("coinbase")) return "coinbase";
    if (value.includes("mexc")) return "mexc";
    return "other";
  }

  type TickerWithVol = CoinTickerRow & { __vol: number };
  const byCanonical = new Map<Canonical, TickerWithVol[]>();
  const byOtherIdentifier = new Map<string, TickerWithVol>();

  for (const t of tickers) {
    const tvTarget = tradingViewSymbol(t.target ?? "");
    if (!preferredTargets.includes(tvTarget)) continue;
    const item: TickerWithVol = { ...t, __vol: t.converted_volume?.usd ?? 0 };
    const c = canonicalExchange(t);
    if (c === "other") {
      const key = (t.market?.identifier ?? t.market?.name ?? "").toLowerCase();
      if (!key) continue;
      const existing = byOtherIdentifier.get(key);
      if (!existing || item.__vol > existing.__vol) byOtherIdentifier.set(key, item);
      continue;
    }
    const arr = byCanonical.get(c) ?? [];
    arr.push(item);
    byCanonical.set(c, arr);
  }

  const picked: Array<[string, TickerWithVol]> = [];
  for (const ex of preferredExchanges) {
    const best = (byCanonical.get(ex) ?? []).sort((a, b) => b.__vol - a.__vol)[0];
    if (best) picked.push([ex, best]);
  }
  if (picked.length === 0) {
    const rankedByVol = [...byOtherIdentifier.entries()].sort(
      (a, b) => b[1].__vol - a[1].__vol,
    );
    picked.push(...rankedByVol.slice(0, 4));
  }

  const buttons: ExchangeButton[] = [];
  for (const [identifier, t] of picked) {
    const canonicalName =
      identifier === "coinbase"
        ? "Coinbase"
        : t.market?.name || identifier.toUpperCase();
    const base = tradingViewSymbol(t.base ?? coin.symbol);
    const target = tradingViewSymbol(t.target ?? "USDT");
    const pair = `${base}/${target}`;
    const href =
      (typeof t.trade_url === "string" && t.trade_url.startsWith("http")
        ? t.trade_url
        : null) ??
      `https://www.coingecko.com/en/coins/${coin.id}`;
    buttons.push({
      id: `${identifier}-${pair}`,
      label: `Buy on ${canonicalName} (${pair})`,
      exchangeName: canonicalName,
      href,
      className: exchangeThemeClass(identifier),
    });
  }
  return buttons;
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5 transition-[border-color,box-shadow] hover:border-[#00ff9f]/20 hover:shadow-[0_0_16px_rgba(0,255,159,0.05)]">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-xs text-zinc-100 sm:text-sm">{children}</dd>
    </div>
  );
}

export function CoinDetailView({
  coin,
  twitterHref,
  tweets,
  mediumPosts,
  mediumSourceUrl,
  mediumStale,
  newsItems,
  newsSourceUrl,
  newsStale,
  youtubeVideos,
  youtubeStale,
  youtubeSourceHint,
  showYoutubeSidebar,
  reppoStats,
}: {
  coin: CoinGeckoDetail;
  twitterHref?: string;
  tweets?: XFeedItem[];
  mediumPosts?: MediumFeedItem[];
  mediumSourceUrl?: string;
  mediumStale?: boolean;
  newsItems?: CoinNewsItem[];
  newsSourceUrl?: string;
  newsStale?: boolean;
  youtubeVideos?: YoutubeFeedItem[];
  youtubeStale?: boolean;
  youtubeSourceHint?: string | null;
  showYoutubeSidebar?: boolean;
  reppoStats?: ReppoStatsSnapshot;
}) {
  const md = coin.market_data;
  const img = coin.image?.large ?? coin.image?.small;
  const homepage = coin.links?.homepage?.find((u) => u && /^https?:\/\//i.test(u));
  const whitepaper = firstHttpUrlFromUnknown((coin.links as { whitepaper?: unknown } | undefined)?.whitepaper);
  const geckoUrl = `https://www.coingecko.com/en/coins/${coin.id}`;
  const descriptionText = stripHtmlToText(coin.description?.en ?? "");
  const whatIsSummary = (() => {
    if (!descriptionText) return null;
    const sentences = descriptionText.split(/(?<=[.!?])\s+/).filter(Boolean);
    const short = sentences.slice(0, 3).join(" ");
    return short.length > 420 ? `${short.slice(0, 417)}…` : short;
  })();
  const tickerDerived = tradingViewFromCoinGeckoTickers(coin.tickers);
  const tvInstruments = [
    ...tickerDerived,
    ...tradingViewCandidates(coin.id, coin.symbol),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  const primaryInstrument = tvInstruments[0] ?? "CRYPTOCAP:TOTAL";
  const buyButtons = exchangeButtons(coin);
  const ch24 = pctNum(md?.price_change_percentage_24h);
  const ch7 = pctNum(
    md?.price_change_percentage_7d ?? usd(md?.price_change_percentage_7d_in_currency),
  );
  const ch30 = pctNum(md?.price_change_percentage_30d);
  const ch1y = pctNum(md?.price_change_percentage_1y);
  const high24 = usd(md?.high_24h);
  const low24 = usd(md?.low_24h);
  const current = usd(md?.current_price);
  const range24Pct =
    high24 != null && low24 != null && low24 > 0 ? ((high24 - low24) / low24) * 100 : null;
  const nearHighPct =
    high24 != null && current != null && high24 > 0 ? (current / high24) * 100 : null;
  const momentumScore =
    (ch24 ?? 0) * 0.4 + (ch7 ?? 0) * 0.35 + (ch30 ?? 0) * 0.15 + (ch1y ?? 0) * 0.1;
  const circulating = md?.circulating_supply ?? null;
  const totalSupply = md?.total_supply ?? null;
  const maxSupply = md?.max_supply ?? null;
  const fdv = usd(md?.fully_diluted_valuation);
  const marketCap = usd(md?.market_cap);
  const circulatingVsMaxPct =
    circulating != null && maxSupply != null && maxSupply > 0 ? (circulating / maxSupply) * 100 : null;
  const circulatingVsTotalPct =
    circulating != null && totalSupply != null && totalSupply > 0
      ? (circulating / totalSupply) * 100
      : null;
  const mcapToFdvPct = marketCap != null && fdv != null && fdv > 0 ? (marketCap / fdv) * 100 : null;
  const unlockPastPct = circulatingVsMaxPct ?? circulatingVsTotalPct;
  const maxOrTotalSupply = maxSupply ?? totalSupply;
  const remainingToUnlock =
    maxOrTotalSupply != null && circulating != null ? Math.max(maxOrTotalSupply - circulating, 0) : null;
  const remainingToUnlockPct =
    maxOrTotalSupply != null && remainingToUnlock != null && maxOrTotalSupply > 0
      ? (remainingToUnlock / maxOrTotalSupply) * 100
      : null;
  const fdvOverhangPct =
    fdv != null && marketCap != null && marketCap > 0 ? ((fdv - marketCap) / marketCap) * 100 : null;
  const trendLabel =
    momentumScore > 8
      ? "Strong Bullish"
      : momentumScore > 2
        ? "Bullish"
        : momentumScore < -8
          ? "Strong Bearish"
          : momentumScore < -2
            ? "Bearish"
            : "Neutral";
  const momentumSeries = [ch24 ?? 0, ch7 ?? 0, ch30 ?? 0, ch1y ?? 0];
  const hasMediumPosts = (mediumPosts?.length ?? 0) > 0;
  const showMediumPanel = hasMediumPosts || Boolean(mediumSourceUrl);
  const hasNewsItems = (newsItems?.length ?? 0) > 0;
  const showNewsPanel = hasNewsItems || Boolean(newsSourceUrl);
  const showYoutubePanel = Boolean(showYoutubeSidebar);
  const showLeftRail = showMediumPanel || showNewsPanel || showYoutubePanel;

  return (
    <div className="w-full px-0 py-8 sm:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {showLeftRail ? (
          <aside className="order-2 lg:order-1 lg:sticky lg:top-24 lg:w-72 lg:shrink-0">
            <div className="space-y-3">
              {showNewsPanel ? (
                <CoinNewsFeed
                  coinId={coin.id}
                  initialItems={newsItems ?? []}
                  initialStale={newsStale}
                  initialSourceUrl={newsSourceUrl}
                />
              ) : null}

              {showMediumPanel ? (
                <section
                  aria-labelledby="coin-medium-feed"
                  className="rounded-xl border border-white/10 bg-[#101217] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 id="coin-medium-feed" className="text-sm font-semibold text-zinc-100">
                      Medium <span className="font-normal text-zinc-500">· latest 5</span>
                    </h2>
                    {mediumStale ? (
                      <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200">
                        Delayed
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {hasMediumPosts ? (
                      (mediumPosts ?? []).slice(0, 5).map((post) => (
                        <a
                          key={post.id}
                          href={post.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border border-white/10 bg-[#0d0f14] px-2.5 py-2 transition-colors hover:border-[#00ff9f]/35"
                        >
                          <p className="line-clamp-2 text-xs font-semibold text-zinc-100">{post.title}</p>
                          <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-zinc-400">
                            {post.summary || "Read the full post on Medium."}
                          </p>
                          <p className="mt-1 text-[10px] text-zinc-500">
                            {formatShortMonthDay(post.publishedAt)}
                          </p>
                        </a>
                      ))
                    ) : (
                      <div className="rounded-lg border border-white/10 bg-[#0d0f14] px-2.5 py-2">
                        <p className="text-[11px] text-zinc-400">
                          Medium feed detected, but no posts could be loaded right now. Try opening the
                          profile directly.
                        </p>
                      </div>
                    )}
                  </div>
                  {mediumSourceUrl ? (
                    <a
                      href={mediumSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex text-[11px] font-medium text-[#00ff9f] underline-offset-2 hover:underline"
                    >
                      Open Medium profile
                    </a>
                  ) : null}
                </section>
              ) : null}

              {showYoutubePanel ? (
                <CoinYoutubeFeed
                  coinId={coin.id}
                  initialVideos={youtubeVideos ?? []}
                  initialStale={youtubeStale}
                  initialSourceHint={youtubeSourceHint ?? null}
                />
              ) : null}
            </div>
          </aside>
        ) : null}

        <div className="order-1 min-w-0 flex-1 px-4 sm:px-6 lg:order-2 lg:pr-8">
          <Link
            href="/"
            className="text-metallic text-sm font-medium underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
          >
            ← Back to hub
          </Link>

          <header className="mt-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        {img ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/10 sm:size-24">
            <Image
              src={img}
              alt=""
              width={96}
              height={96}
              sizes="96px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            {coin.market_cap_rank != null ? `Rank #${coin.market_cap_rank}` : "Unranked"}
          </p>
          <h1 className="text-metallic-hero mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {coin.name}
          </h1>
          <p className="mt-1 font-mono text-base text-zinc-400">
            {(coin.symbol ?? "—").toString().toUpperCase()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={geckoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg border border-[#00ff9f]/40 bg-[#00ff9f]/10 px-3.5 py-2.5 text-sm font-semibold text-[#00ff9f] transition-[box-shadow] hover:shadow-[0_0_20px_rgba(0,255,159,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              View on CoinGecko
            </a>
            {homepage ? (
              <a
                href={homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-[#a855f7]/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                Official site
              </a>
            ) : null}
            {twitterHref ? (
              <a
                href={twitterHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                X (Twitter)
              </a>
            ) : null}
            {mediumSourceUrl ? (
              <a
                href={mediumSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                Medium
              </a>
            ) : null}
            {whitepaper ? (
              <a
                href={whitepaper}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-[#d1a173]/40 hover:text-[#d7ad82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                Whitepaper
              </a>
            ) : null}
            <WatchlistToggleButton
              coinId={coin.id}
              name={coin.name}
              symbol={(coin.symbol ?? "").toString()}
              image={img}
            />
          </div>
        </div>
          </header>

          <div className="mt-4 space-y-3">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-[#f4ddc3]/20 bg-[#0f131b]/80 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Price</dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold text-zinc-100">
                  {formatUsd(current)}
                </dd>
              </div>
              <div className="rounded-lg border border-[#f4ddc3]/20 bg-[#0f131b]/80 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-zinc-500">Market cap</dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold text-zinc-100">
                  {formatCompactUsd(marketCap)}
                </dd>
              </div>
              <div className="rounded-lg border border-[#f4ddc3]/20 bg-[#0f131b]/80 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-zinc-500">24h volume</dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold text-zinc-100">
                  {formatCompactUsd(usd(md?.total_volume))}
                </dd>
              </div>
              <div className="rounded-lg border border-[#f4ddc3]/20 bg-[#0f131b]/80 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-zinc-500">24h change</dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold">{pct(ch24)}</dd>
              </div>
            </dl>
            <PriceAlertForm
              coinId={coin.id}
              name={coin.name}
              symbol={(coin.symbol ?? "").toString()}
              image={img}
              currentPrice={current}
            />
          </div>

          <nav
            aria-label="Coin page sections"
            className="mt-4 flex flex-wrap gap-2 border-b border-white/10 pb-3"
          >
        <a
          href="#coin-market-stats"
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
        >
          Overview
        </a>
        <a
          href="#coin-analytics"
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
        >
          Analytics
        </a>
        <a
          href="#coin-tokenomics"
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
        >
          Tokenomics
        </a>
        <a
          href="#coin-unlocks"
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
        >
          Token unlocks
        </a>
        <a
          href="#coin-x-feed"
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#00ff9f]/40 hover:text-[#00ff9f]"
        >
          X Feed
        </a>
            {coin.id === "reppo" ? (
              <a
                href="#reppo-network-stats"
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#a855f7]/40 hover:text-[#a855f7]"
              >
                Reppo network
              </a>
            ) : null}
          </nav>

          <section aria-labelledby="coin-market-stats" className="mt-6">
        <h2 id="coin-market-stats" className="text-base font-semibold text-white sm:text-lg">
          Market stats <span className="text-zinc-500">(USD, CoinGecko)</span>
        </h2>
        <article className="mt-4 rounded-lg border border-white/10 bg-[#111111] p-3">
          <h3 className="text-sm font-semibold text-zinc-100">What is {coin.name}?</h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            {whatIsSummary ?? "A short explanation is not available from CoinGecko right now."}
          </p>
          {descriptionText && descriptionText.length > (whatIsSummary?.length ?? 0) + 40 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-[#d7ad82]">
                Read more
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                {`${descriptionText.slice(0, 1200)}${descriptionText.length > 1200 ? "…" : ""}`}
              </p>
            </details>
          ) : null}
        </article>
        <CoinGeckoPriceChart
          coinId={coin.id}
          coinName={coin.name}
          symbol={(coin.symbol ?? "").toString()}
        />
        <p className="mt-2 text-[11px] text-zinc-500">
          Prefer TradingView?{" "}
          <a
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(primaryInstrument)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00ff9f] underline-offset-2 hover:underline"
          >
            Open {primaryInstrument}
          </a>
        </p>
        <article className="mt-3 rounded-lg border border-white/10 bg-[#111111] p-3">
          <h3 className="text-sm font-semibold text-zinc-100">
            Where to buy {(coin.symbol ?? "").toString().toUpperCase() || "—"}
          </h3>
          <div className="mt-2 flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1 [scrollbar-color:rgba(63,63,70,0.8)_transparent] [scrollbar-width:thin]">
            {buyButtons.length > 0 ? (
              buyButtons.map((btn) => (
                <a
                  key={btn.id}
                  href={btn.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  title={btn.label}
                  aria-label={btn.label}
                  className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-xs font-extrabold tracking-wide transition-[filter,transform] hover:-translate-y-px active:translate-y-px sm:min-h-8 sm:px-3.5 sm:py-1.5 sm:text-[11px] ${btn.className}`}
                >
                  {btn.exchangeName}
                </a>
              ))
            ) : (
              <a
                href={geckoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View markets on CoinGecko"
                aria-label="View markets on CoinGecko"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#00ff9f]/70 bg-gradient-to-b from-[#1c3f37] to-[#0f1420] px-4 py-2 text-xs font-bold tracking-wide text-[#87ffd0] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_0_#09110f] transition-[filter,transform] hover:-translate-y-px hover:brightness-110 active:translate-y-px sm:min-h-8 sm:px-3 sm:py-1.5 sm:text-[11px]"
              >
                CoinGecko
              </a>
            )}
          </div>
        </article>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Price">{formatUsd(usd(md?.current_price))}</Stat>
          <Stat label="Market cap">{formatCompactUsd(usd(md?.market_cap))}</Stat>
          <Stat label="24h volume">{formatCompactUsd(usd(md?.total_volume))}</Stat>
          <Stat label="24h high">{formatUsd(usd(md?.high_24h))}</Stat>
          <Stat label="24h low">{formatUsd(usd(md?.low_24h))}</Stat>
          <Stat label="24h change">{pct(md?.price_change_percentage_24h)}</Stat>
          <Stat label="7d change">
            {pct(
              md?.price_change_percentage_7d ??
                usd(md?.price_change_percentage_7d_in_currency),
            )}
          </Stat>
          <Stat label="30d change">{pct(md?.price_change_percentage_30d)}</Stat>
          <Stat label="1y change">{pct(md?.price_change_percentage_1y)}</Stat>
          <Stat label="ATH">{formatUsd(usd(md?.ath))}</Stat>
          <Stat label="From ATH">{pct(usd(md?.ath_change_percentage))}</Stat>
          <Stat label="ATL">{formatUsd(usd(md?.atl))}</Stat>
          <Stat label="From ATL">{pct(usd(md?.atl_change_percentage))}</Stat>
          <Stat label="Circulating supply">{formatNum(md?.circulating_supply)}</Stat>
          <Stat label="Total supply">{formatNum(md?.total_supply)}</Stat>
          <Stat label="Max supply">{formatNum(md?.max_supply)}</Stat>
        </dl>
          </section>

          <RelatedCoins coinId={coin.id} />

          {coin.id === "reppo" && reppoStats ? <ReppoStatsSection data={reppoStats} /> : null}

          <section id="coin-tokenomics" aria-labelledby="coin-tokenomics-heading" className="mt-6">
        <h2 id="coin-tokenomics-heading" className="text-base font-semibold text-white sm:text-lg">
          Tokenomics
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Circulating / max</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatPctText(circulatingVsMaxPct)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {formatNum(circulating)} / {formatNum(maxSupply)}
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Circulating / total</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatPctText(circulatingVsTotalPct)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {formatNum(circulating)} / {formatNum(totalSupply)}
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Market cap / FDV</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatPctText(mcapToFdvPct)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {formatCompactUsd(marketCap)} / {formatCompactUsd(fdv)}
            </p>
          </article>
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5 text-xs text-zinc-400">
          {whitepaper ? (
            <>
              Project documentation is available:{" "}
              <a
                href={whitepaper}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d7ad82] underline-offset-2 hover:underline"
              >
                open whitepaper
              </a>
              .
            </>
          ) : (
            "Whitepaper link is not currently provided by CoinGecko for this asset."
          )}
        </div>
          </section>

          <section id="coin-unlocks" aria-labelledby="coin-unlocks-heading" className="mt-6">
        <h2 id="coin-unlocks-heading" className="text-base font-semibold text-white sm:text-lg">
          Token unlocks
        </h2>
        <p className="mt-2 text-xs text-zinc-400">
          Historical/current/future unlock context based on CoinGecko supply snapshots. Exact vesting
          schedules may vary by project and should be verified in project docs.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Past unlocked</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatPctText(unlockPastPct)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {formatNum(circulating)} circulating
              {maxSupply != null ? ` of ${formatNum(maxSupply)} max` : totalSupply != null ? ` of ${formatNum(totalSupply)} total` : ""}
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Present float</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatCompactUsd(marketCap)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Market cap with {formatNum(circulating)} currently circulating tokens
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Future unlock potential</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatPctText(remainingToUnlockPct)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {remainingToUnlock != null
                ? `${formatNum(remainingToUnlock)} tokens remain outside circulation`
                : "Remaining unlock amount unavailable (max/total supply not reported)."}
            </p>
          </article>
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5 text-xs text-zinc-400">
          <p>
            FDV overhang vs current market cap:{" "}
            <span className="font-mono text-zinc-200">{signedPctText(fdvOverhangPct)}</span>.
          </p>
          <p className="mt-1">
            {whitepaper ? (
              <>
                For exact cliff/vesting dates and beneficiary breakdowns, review the{" "}
                <a
                  href={whitepaper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d7ad82] underline-offset-2 hover:underline"
                >
                  project whitepaper
                </a>
                .
              </>
            ) : (
              "No whitepaper link was provided by CoinGecko for this asset, so exact unlock calendar references may be limited."
            )}
          </p>
        </div>
          </section>

          <section aria-labelledby="coin-x-feed" className="mt-6">
        <h2 id="coin-x-feed" className="text-base font-semibold text-white sm:text-lg">
          Recent on X
        </h2>
        <CoinXFeed
          coinId={coin.id}
          initialTweets={tweets ?? []}
          twitterHandle={twitterHref ? twitterHref.split("/").pop() : undefined}
        />
          </section>

          <section id="coin-analytics" aria-labelledby="coin-analytics-heading" className="mt-6">
        <h2 id="coin-analytics-heading" className="text-base font-semibold text-white sm:text-lg">
          Analytics
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Trend score</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{momentumScore.toFixed(2)}</p>
            <p className="mt-1 text-xs text-zinc-400">{trendLabel}</p>
            <MiniGauge value={momentumScore} />
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">24h volatility</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">
              {range24Pct != null ? `${range24Pct.toFixed(2)}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">Range between 24h high and low</p>
            <MiniRangeBar low={low24} high={high24} current={current} />
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Position vs 24h high</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">
              {nearHighPct != null ? `${nearHighPct.toFixed(1)}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">Current price as % of today&apos;s high</p>
            <MiniRangeBar low={low24} high={high24} current={current} />
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Support zone (est.)</p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatUsd(low24)}</p>
            <p className="mt-1 text-xs text-zinc-400">Using 24h low as short-term support proxy</p>
            <MiniRangeBar low={low24} high={high24} current={low24} />
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Resistance zone (est.)
            </p>
            <p className="mt-1 font-mono text-sm text-zinc-100">{formatUsd(high24)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Using 24h high as short-term resistance proxy
            </p>
            <MiniRangeBar low={low24} high={high24} current={high24} />
          </article>
          <article className="rounded-lg border border-white/10 bg-[#111111] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Momentum blend</p>
            <p className="mt-1 text-xs text-zinc-300">
              40% 24h · 35% 7d · 15% 30d · 10% 1y
            </p>
            <MiniSparkline points={momentumSeries} />
            <MiniMomentumBars
              values={[
                { label: "24h", value: ch24 },
                { label: "7d", value: ch7 },
                { label: "30d", value: ch30 },
                { label: "1y", value: ch1y },
              ]}
            />
          </article>
        </div>
          </section>

          <CoingeckoLogoAttribution className="mt-6 text-center [&_span]:text-zinc-600" />
        </div>
      </div>
    </div>
  );
}
