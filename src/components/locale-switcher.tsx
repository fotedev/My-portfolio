"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales } from "@/lib/i18n/routing";

const localeLabels: Record<string, string> = { en: "EN", ar: "ع" };

/**
 * Language switcher that preserves the equivalent path (prompt-3 §4):
 * /en/projects/abc ↔ /ar/projects/abc.
 *
 * next-intl's usePathname returns the locale-stripped internal pathname
 * (e.g. "/projects"), and the locale-aware router re-prefixes the target
 * locale — the documented next-intl idiom, no manual segment swapping.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(nextLocale: string) {
    if (nextLocale === locale) {
      return;
    }
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div role="group" aria-label="Language" className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-current={l === locale ? "true" : undefined}
          onClick={() => {
            switchTo(l);
          }}
          className={`min-h-11 rounded-md border border-border-subtle px-2.5 text-sm transition-colors duration-200 ${
            l === locale ? "bg-accent-strong text-white" : "bg-surface hover:bg-background"
          }`}
        >
          {localeLabels[l] ?? l}
        </button>
      ))}
    </div>
  );
}
