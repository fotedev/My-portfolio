"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/routing";

/** Abbreviated visible labels; full localized names for screen readers. */
const localeLabels: Record<Locale, string> = { en: "EN", ar: "ع" };
const localeNames: Record<Locale, string> = { en: "English", ar: "العربية" };

/**
 * Language switcher that preserves the equivalent path (SEO-I18N §3.3):
 * /en/projects/abc ↔ /ar/projects/abc. Every button carries a descriptive
 * aria-label — "ع" alone is not an accessible name.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div role="group" aria-label={t("label")} className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          // Content-based naming (WCAG 2.5.3 Label-in-Name): the accessible
          // name comes from the button's own text (sr-only + visible token),
          // so the visible "EN"/"ع" is always part of it.
          title={t("switchToAria", { name: localeNames[l] })}
          aria-current={l === locale ? "true" : undefined}
          onClick={() => {
            switchTo(l);
          }}
          className={`min-h-11 rounded-md border border-border-subtle px-2.5 text-sm transition-colors duration-150 ${
            l === locale ? "bg-accent-strong text-white" : "bg-surface hover:bg-background"
          }`}
        >
          <span className="sr-only">{t("switchToAria", { name: localeNames[l] })}</span>
          <span aria-hidden="true">{localeLabels[l]}</span>
        </button>
      ))}
    </div>
  );
}
