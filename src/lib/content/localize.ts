import type { Locale } from "@/lib/i18n/routing";

/**
 * Pure localization helpers (no I/O) so the fallback and status semantics are
 * unit-testable. Used by the server queries in ./queries.ts.
 */

export type LocalizableRow = { locale: string };

/**
 * Pick the row for `locale`, falling back to EN (CONTENT-MODEL fallback rule:
 * missing AR falls back to EN; never the reverse).
 */
export function pickLocalized<T extends LocalizableRow>(rows: T[], locale: Locale): T | null {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "en") ?? null;
}

/** Status pill semantics (CONTENT-MODEL §6 — honesty mapping). */
export type PillKind = "success" | "neutral" | "warning";

export function statusPillKind(status: string): PillKind {
  switch (status) {
    case "merged":
      return "success";
    case "acknowledged":
      return "warning";
    default:
      // "open" and anything unknown render neutral — never dressed up.
      return "neutral";
  }
}

/**
 * Dates render with Western digits in BOTH locales (DESIGN §7.4).
 */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", {
    numberingSystem: "latn",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatYear(year: number): string {
  return new Intl.NumberFormat("en", { numberingSystem: "latn", useGrouping: false }).format(year);
}
