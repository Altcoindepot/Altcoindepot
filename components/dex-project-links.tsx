import type { DexProjectLink, DexProjectLinkKind } from "@/lib/dex-project-links";
import { ds } from "@/lib/ui-classes";

function Icon({ kind }: { kind: DexProjectLinkKind }) {
  const className = "size-3.5 shrink-0";
  if (kind === "twitter") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (kind === "telegram") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21.5 3.4 18.9 20.1c-.2 1-1.2 1.4-2 .9l-5.3-4.1-2.6 2.5c-.3.3-.8.1-.9-.3l-.7-5.3L3 11.3c-1-.3-.9-1.7.2-2l17.2-6.1c.9-.3 1.7.5 1.1 1.2z" />
      </svg>
    );
  }
  if (kind === "discord") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.3 5.2A18 18 0 0 0 14.9 4l-.2.4a16 16 0 0 1 3.1 1.1 12.6 12.6 0 0 0-12.6 0A16 16 0 0 1 9.3 4L9.1 4a18 18 0 0 0-4.4 1.2C2.2 9 1.6 12.6 1.8 16.2a18.4 18.4 0 0 0 5.6 2.8l.7-1.1a12 12 0 0 1-1.8-.9l.4-.3a9.5 9.5 0 0 0 11.6 0l.4.3c-.6.4-1.2.7-1.8.9l.7 1.1a18.4 18.4 0 0 0 5.6-2.8c.4-4.1-.5-7.7-2.7-11zM8.7 14.3c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7zm6.6 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7z" />
      </svg>
    );
  }
  if (kind === "github") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.36 1.08 2.94.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.95 0-1.1.39-1.99 1.03-2.7-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.71 1.03 1.6 1.03 2.7 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 18.07"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

const fullLinkClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-[#0c0e14] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-teal-400/35 hover:text-teal-200 md:min-h-8 md:min-w-8";

const iconLinkClass =
  "inline-flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-teal-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/50";

export function DexProjectLinks({
  links,
  variant = "full",
  className = "",
}: {
  links?: DexProjectLink[] | null;
  variant?: "full" | "icons";
  className?: string;
}) {
  if (!links || links.length === 0) return null;

  if (variant === "icons") {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`.trim()}>
        {links.slice(0, 4).map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label}
            aria-label={link.label}
            className={iconLinkClass}
          >
            <Icon kind={link.kind} />
          </a>
        ))}
      </span>
    );
  }

  return (
    <section className={className} aria-label="Project links">
      <p className={ds.label}>Links</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.url}
            className={fullLinkClass}
          >
            <Icon kind={link.kind} />
            <span className="max-w-[8rem] truncate">{link.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
