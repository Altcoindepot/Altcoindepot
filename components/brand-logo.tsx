import Link from "next/link";

/** Shared A+coin mark paths (matches public/logo-mark.svg). Coin sits in the lower counter. */
function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <path
        fill="#14b8a6"
        fillRule="evenodd"
        d="M32 2.5 61.5 62H49.2L41.4 44.2H22.6L14.8 62H2.5L32 2.5Zm0 16.2 6.6 14.8H25.4L32 18.7Z"
      />
      <circle cx="32" cy="50.2" r="8.1" fill="#2dd4bf" />
      <circle cx="32" cy="50.2" r="8.1" fill="none" stroke="#0a0a0a" strokeWidth="1.6" />
    </svg>
  );
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex items-baseline whitespace-nowrap text-[1.2rem] font-extrabold leading-none tracking-[-0.04em] sm:text-[1.35rem] ${className}`.trim()}
    >
      <span className="bg-[linear-gradient(118deg,#f8fafc_0%,#d4d4d8_28%,#a1a1aa_52%,#e4e4e7_78%,#fafafa_100%)] bg-clip-text text-transparent">
        AltCoin
      </span>
      <span className="bg-[linear-gradient(118deg,#99f6e4_0%,#2dd4bf_32%,#0f766e_62%,#5eead4_100%)] bg-clip-text text-transparent">
        Depot
      </span>
    </span>
  );
}

/**
 * Full lockup rendered inline so the wordmark always paints (SVG-as-<img> often drops <text>).
 * Metallic silver AltCoin + metallic teal Depot beside the A+coin mark.
 */
export function BrandLockup({
  className = "",
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <BrandMark className="h-8 w-8 shrink-0" />
      <span className="flex min-w-0 flex-col justify-center">
        <Wordmark />
        {showTagline ? (
          <span className="mt-0.5 hidden text-[10px] font-medium leading-none tracking-wide text-zinc-500 lg:block">
            Smart crypto discovery
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function BrandLogo({
  variant = "lockup",
  className = "",
}: {
  variant?: "lockup" | "mark";
  className?: string;
}) {
  if (variant === "mark") {
    return <BrandMark className={`h-8 w-8 ${className}`.trim()} />;
  }
  return <BrandLockup className={className} />;
}

/** Home link used in the site header on every page — always full lockup. */
export function BrandHomeLink({
  className = "",
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="AltCoin Depot home"
      className={`header-home-link inline-flex min-h-11 max-w-[calc(100vw-7.5rem)] items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 sm:max-w-none ${className}`.trim()}
    >
      <BrandLockup showTagline={showTagline} />
    </Link>
  );
}
