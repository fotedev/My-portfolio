"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

/**
 * Light/dark toggle (DESIGN.md §9): persisted override, keyboard accessible.
 * Icon visibility is CSS-driven (.dark variants) — no mount state, no effect,
 * SSR-consistent. The click handler reads the resolved theme at event time.
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
      <span aria-hidden="true" className="hidden text-lg dark:inline">
        ☀
      </span>
      <span aria-hidden="true" className="text-lg dark:hidden">
        ☾
      </span>
    </button>
  );
}
