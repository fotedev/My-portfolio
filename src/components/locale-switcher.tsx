"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/routing";

const localeNames: Record<Locale, string> = { en: "English", ar: "العربية" };

/**
 * Single-button language switcher (owner request, 2026-11-11): one translate
 * icon that toggles to the other locale, preserving the equivalent path
 * (SEO-I18N §3.3): /en/projects/abc ↔ /ar/projects/abc. The accessible name
 * always names the TARGET language ("Switch language to العربية" on /en).
 * Icon-only button, same cluster styling as the theme toggle.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  const otherLocale = locales.find((l) => l !== locale);

  if (!otherLocale) {
    return null;
  }

  const switchLabel = t("switchToAria", { name: localeNames[otherLocale] });

  return (
    <button
      type="button"
      aria-label={switchLabel}
      title={switchLabel}
      onClick={() => {
        router.replace(pathname, { locale: otherLocale });
      }}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-subtle bg-surface transition-colors duration-200 hover:bg-background"
    >
      <span aria-hidden="true" className="inline-flex">
        {/* Translate/languages glyph (A over 文-style), stroke style matches
            the theme toggle icons. Mirrored glyphs stay unmirrored in RTL —
            the icon is direction-neutral. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="m5 8 6 6" />
          <path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
      </span>
    </button>
  );
}
