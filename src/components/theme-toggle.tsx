"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

/**
 * Light/dark toggle (DESIGN.md §9): persisted override, keyboard accessible.
 * Icons are SVGs (aria-hidden) — text glyphs would violate Label-in-Name
 * (WCAG 2.5.3: visible text must be part of the accessible name).
 */
export function ThemeToggle() {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={t("toggle")}
      title={t("toggle")}
      onClick={() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-subtle bg-surface transition-colors duration-200 hover:bg-background"
    >
      <span aria-hidden="true" className="hidden dark:inline-flex">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      </span>
      <span aria-hidden="true" className="inline-flex dark:hidden">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </span>
    </button>
  );
}
