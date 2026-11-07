"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme contract (DESIGN.md §9): system theme on first visit + persistent
 * manual override, class attribute on <html>, dark-capable. Zero-FOUC is
 * guaranteed by next-themes' blocking init script (no flash on reload).
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fotedev-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
