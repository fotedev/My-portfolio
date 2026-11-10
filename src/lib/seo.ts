import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/routing";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fotedev.me";

export function localeUrl(locale: Locale, path = ""): string {
  return `${SITE_URL}/${locale}${path}`;
}

/**
 * Full hreflang set including x-default → EN (docs/SEO-I18N.md §5):
 * every member lists all members, itself included.
 */
export function hreflangSet(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = localeUrl(locale, path);
  }
  languages["x-default"] = localeUrl(defaultLocale, path);
  return languages;
}

/**
 * Per-route localized metadata: self-referencing canonical (never across
 * locales), hreflang alternates, localized og:locale (docs/SEO-I18N.md §4/§6).
 * og:image comes from the [locale]/opengraph-image.tsx file convention.
 */
export function routeMetadata(opts: {
  locale: Locale;
  path: string;
  description: string;
  title?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const canonical = localeUrl(opts.locale, opts.path);
  return {
    ...(opts.title
      ? { title: opts.absoluteTitle ? { absolute: opts.title } : opts.title }
      : {}),
    description: opts.description,
    alternates: {
      canonical,
      languages: hreflangSet(opts.path),
    },
    openGraph: {
      url: canonical,
      type: "website",
      siteName: "fotedev",
      locale: opts.locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: opts.locale === "ar" ? ["en_US"] : ["ar_EG"],
      ...(opts.title ? { title: opts.title } : {}),
      description: opts.description,
      // Every route shares the localized brand card rendered by the stable
      // [locale]/og-image route. The file-convention opengraph-image route is
      // not referenceable from metadata (Next serves it under an internal
      // hashed path), and without explicit images page-level metadata dropped
      // the card entirely (M6 SEO audit: og:image/twitter:image home-only).
      images: [
        {
          url: `/${opts.locale}/og-image`,
          width: 1200,
          height: 630,
          alt: "fotedev — Ahmed Aboalayoun, Full-Stack AI Engineer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/${opts.locale}/og-image`],
    },
  };
}
