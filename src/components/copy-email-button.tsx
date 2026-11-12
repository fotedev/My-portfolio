"use client";

import { useRef, useState } from "react";

/**
 * The email address itself is the copy control (owner request, 2026-11-11):
 * click to copy, a native hover/focus tooltip carries the hint, and success
 * flashes the success color while a polite live region announces it (DESIGN
 * §10.7). The adjacent explicit mailto CTA ("Get in touch" / "Write an
 * email") remains the open-in-mail-app path (ADR-0004 email-first).
 */
export function CopyEmailButton({
  email,
  label,
  copiedLabel,
  hintLabel,
  className,
}: {
  email: string;
  label: string;
  copiedLabel: string;
  hintLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions / http): the adjacent mailto CTA works.
    }
  }

  return (
    <>
      {/* 2.5.3 Label in Name: the accessible name must contain the visible
          text (the address), so the instruction is prefixed with it. */}
      <button
        type="button"
        onClick={copy}
        className={className}
        aria-label={`${label} ${email}`}
        title={copied ? copiedLabel : hintLabel}
      >
        <span className={copied ? "text-success-text" : undefined}>{email}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
