export type DexProjectLinkKind =
  | "website"
  | "docs"
  | "twitter"
  | "telegram"
  | "discord"
  | "reddit"
  | "github"
  | "youtube"
  | "other";

export type DexProjectLink = {
  kind: DexProjectLinkKind;
  label: string;
  url: string;
};

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function kindFrom(type: string | undefined, label: string | undefined, url: string): DexProjectLinkKind {
  const blob = `${type ?? ""} ${label ?? ""} ${url}`.toLowerCase();
  if (/\btwitter\b|\bx\.com\b/.test(blob)) return "twitter";
  if (/\btelegram\b|t\.me\//.test(blob)) return "telegram";
  if (/\bdiscord\b/.test(blob)) return "discord";
  if (/\breddit\b/.test(blob)) return "reddit";
  if (/\bgithub\b/.test(blob)) return "github";
  if (/\byoutube\b|youtu\.be\//.test(blob)) return "youtube";
  if (/\bdocs?\b|documentation|whitepaper|gitbook/.test(blob)) return "docs";
  if (/\bwebsite\b|\bhomepage\b/.test(blob)) return "website";
  return "other";
}

function displayLabel(kind: DexProjectLinkKind, rawLabel: string | undefined): string {
  if (kind === "twitter") return "X";
  if (kind === "telegram") return "Telegram";
  if (kind === "discord") return "Discord";
  if (kind === "reddit") return "Reddit";
  if (kind === "github") return "GitHub";
  if (kind === "youtube") return "YouTube";
  if (kind === "docs") return "Docs";
  if (kind === "website") return "Website";
  const label = rawLabel?.trim();
  if (label && label.length <= 18) return label;
  return "Link";
}

function addLink(
  out: DexProjectLink[],
  seen: Set<string>,
  urlRaw: unknown,
  type?: unknown,
  label?: unknown,
) {
  if (typeof urlRaw !== "string") return;
  const url = urlRaw.trim();
  if (!isSafeHttpUrl(url)) return;
  let hostPath = url;
  try {
    const parsed = new URL(url);
    hostPath = `${parsed.host}${parsed.pathname}`.replace(/\/$/, "").toLowerCase();
  } catch {
    return;
  }
  if (seen.has(hostPath)) return;
  seen.add(hostPath);
  const typeStr = typeof type === "string" ? type : undefined;
  const labelStr = typeof label === "string" ? label : undefined;
  const kind = kindFrom(typeStr, labelStr, url);
  out.push({ kind, label: displayLabel(kind, labelStr), url });
}

/** Parse DexScreener pair `info` and token-profile `links` into unique http(s) links. */
export function parseDexProjectLinks(input: {
  websites?: unknown;
  socials?: unknown;
  profileLinks?: unknown;
}): DexProjectLink[] {
  const out: DexProjectLink[] = [];
  const seen = new Set<string>();

  if (Array.isArray(input.websites)) {
    for (const item of input.websites) {
      if (!item || typeof item !== "object") continue;
      const row = item as { url?: unknown; label?: unknown };
      addLink(out, seen, row.url, row.label, row.label);
    }
  }
  if (Array.isArray(input.socials)) {
    for (const item of input.socials) {
      if (!item || typeof item !== "object") continue;
      const row = item as { url?: unknown; type?: unknown };
      addLink(out, seen, row.url, row.type, row.type);
    }
  }
  if (Array.isArray(input.profileLinks)) {
    for (const item of input.profileLinks) {
      if (!item || typeof item !== "object") continue;
      const row = item as { url?: unknown; type?: unknown; label?: unknown };
      addLink(out, seen, row.url, row.type, row.label);
    }
  }

  const order: DexProjectLinkKind[] = [
    "website",
    "docs",
    "twitter",
    "telegram",
    "discord",
    "github",
    "reddit",
    "youtube",
    "other",
  ];
  return out.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

export function parseDexPairInfoLinks(info: unknown): DexProjectLink[] {
  if (!info || typeof info !== "object") return [];
  const row = info as { websites?: unknown; socials?: unknown };
  return parseDexProjectLinks({ websites: row.websites, socials: row.socials });
}

export function mergeDexProjectLinks(...groups: Array<DexProjectLink[] | undefined>): DexProjectLink[] {
  return parseDexProjectLinks({
    profileLinks: groups.flat().map((link) => ({ url: link?.url, type: link?.kind, label: link?.label })),
  });
}
