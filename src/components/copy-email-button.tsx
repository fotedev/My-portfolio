"use client";

import { useRef, useState } from "react";

/**
 * Clipboard copy with a polite live-region confirmation (DESIGN §10.7).
 * Labels come from the caller so the footer and the contact page can use
 * their own namespaces. Clipboard failures are silent — the adjacent mailto
 * link always works.
 */
export function CopyEmailButton({
  email,
  label,
  copiedLabel,
  className,
}: {
  email: string;
  label: string;
  copiedLabel: string;
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
      // Clipboard unavailable (permissions / http): mailto fallback still works.
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={className} aria-label={label}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        <span className="type-body-sm">{copied ? copiedLabel : label}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
