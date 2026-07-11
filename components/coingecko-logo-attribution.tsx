/** https://brand.coingecko.com/resources/attribution-guide */

const COINGECKO_ATTRIBUTION_URL =
  "https://www.coingecko.com/?utm_source=altcoindepot&utm_medium=referral";

const baseAttributionClass =
  "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs";

type CoingeckoLogoAttributionProps = {
  className?: string;
  logoClassName?: string;
};

export function CoingeckoLogoAttribution({
  className = "",
  logoClassName = "h-8 w-8",
}: CoingeckoLogoAttributionProps) {
  return (
    <p className={`${baseAttributionClass} ${className}`.trim()}>
      <span className="font-sans text-zinc-500">Data powered by</span>
      <a
        href={COINGECKO_ATTRIBUTION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center rounded-sm ring-[#a855f7] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
        aria-label="CoinGecko (opens in a new tab)"
      >
        <img
          src="/cg-favicon.ico"
          alt=""
          width={32}
          height={32}
          decoding="async"
          className={`${logoClassName} object-contain`}
        />
      </a>
      <span className="font-sans text-zinc-600">Not financial advice.</span>
    </p>
  );
}
