import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  // next-intl's middleware also emits a `Link` response header for alternates,
  // but its x-default points at the locale-stripped path (https://fotedev.me/about
  // for /en/about — a 307, not a 200; found by the M6 SEO audit). The HTML
  // hreflang tags from routeMetadata() are complete and correct, so the
  // duplicate, lossy header is disabled.
  alternateLinks: false,
});

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Narrow a route param to a Locale or throw. Route params are typed `string`;
 * the intl middleware only lets valid prefixes through, so this is a
 * type-level seatbelt, not UX.
 */
export function toLocale(value: string): Locale {
  if (!isLocale(value)) {
    throw new Error(`Unknown locale: ${value}`);
  }
  return value;
}
