"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ds } from "@/lib/ui-classes";

const FEEDBACK_EMAIL = "AltCoinDepot@gmail.com";
const FEEDBACK_SUBJECT = "AltCoin Depot feedback";

function buildMailto({
  message,
  replyEmail,
  pageUrl,
}: {
  message: string;
  replyEmail: string;
  pageUrl: string;
}) {
  const body = [
    "What to add / What's broken:",
    message.trim(),
    "",
    `Reply email: ${replyEmail.trim() || "(not provided)"}`,
    `Page URL: ${pageUrl.trim() || "(not provided)"}`,
  ].join("\n");

  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}&body=${encodeURIComponent(body)}`;
}

/**
 * Site feedback → mailto AltCoinDepot@gmail.com (no accounts, no comment wall).
 */
export function ContactFeedbackForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery =
      searchParams.get("page")?.trim() ||
      searchParams.get("from")?.trim() ||
      searchParams.get("url")?.trim() ||
      "";
    if (fromQuery) {
      setPageUrl(fromQuery);
      return;
    }
    try {
      const ref = document.referrer;
      if (ref) {
        const u = new URL(ref);
        if (u.origin === window.location.origin && u.pathname !== "/contact") {
          setPageUrl(u.href);
          return;
        }
      }
    } catch {
      /* ignore bad referrer */
    }
    // Token / deep links often land with hash or full path still useful as context.
    if (typeof window !== "undefined" && window.location.pathname !== "/contact") {
      setPageUrl(window.location.href);
    }
  }, [searchParams]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please tell us what to add or what’s broken.");
      return;
    }
    setError(null);
    const href = buildMailto({ message: trimmed, replyEmail, pageUrl });
    window.location.href = href;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="glass-panel rounded-2xl px-4 py-6 sm:px-5 sm:py-7" role="status">
        <p className="text-sm font-semibold text-teal-200 sm:text-base">
          Thanks — we’ll read it
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:text-sm">
          Your email app should open with the message ready for{" "}
          <span className="text-zinc-300">{FEEDBACK_EMAIL}</span>. If it didn’t, email us directly.
        </p>
        <button
          type="button"
          className={`${ds.btnSecondary} mt-4 min-h-11 px-4 text-sm`}
          onClick={() => {
            setSubmitted(false);
            setMessage("");
          }}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel flex flex-col gap-4 rounded-2xl px-4 py-5 sm:gap-5 sm:px-5 sm:py-6"
      noValidate
    >
      <div>
        <h2 className="text-sm font-bold tracking-tight text-zinc-50 sm:text-base">
          Send feedback
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
          What to add, what’s broken, or a data issue — no account needed.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={ds.label}>What to add / What’s broken</span>
        <textarea
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue or idea…"
          className={`${ds.input} min-h-[8rem] w-full resize-y rounded-xl px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={ds.label}>
          Your email <span className="normal-case tracking-normal text-zinc-600">(optional)</span>
        </span>
        <input
          type="email"
          name="replyEmail"
          autoComplete="email"
          value={replyEmail}
          onChange={(e) => setReplyEmail(e.target.value)}
          placeholder="so we can reply"
          className={`${ds.input} min-h-11 w-full rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={ds.label}>
          Page URL <span className="normal-case tracking-normal text-zinc-600">(optional)</span>
        </span>
        <input
          type="url"
          name="pageUrl"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="https://altcoindepot.com/…"
          className={`${ds.input} min-h-11 w-full rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600`}
        />
      </label>

      {error ? (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className={`${ds.btnPrimary} min-h-11 w-full px-4 text-sm font-semibold sm:w-auto`}>
        Send feedback
      </button>
    </form>
  );
}
