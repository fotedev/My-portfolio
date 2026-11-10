/**
 * Shared CTA class strings (DESIGN §10.1) — md/lg heights, one primary per
 * section, hover = color only (no translate, no layout shift).
 */
export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-accent-strong px-5 py-2.5 font-medium text-accent-foreground transition-colors duration-150 hover:opacity-90";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong px-5 py-2.5 font-medium text-foreground transition-colors duration-150 hover:bg-surface";

/** Inline text link with external indicator (arrow is NOT mirrored in RTL). */
export const externalLink =
  "inline-flex min-h-11 items-center gap-1 text-accent underline-offset-4 transition-colors duration-150 hover:underline";
