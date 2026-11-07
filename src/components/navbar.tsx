"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/lib/i18n/navigation";

const navItems = [
  { href: "/", key: "home" },
  { href: "/projects", key: "projects" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-border-subtle">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3" aria-label="Main">
        <Link href="/" className="font-semibold">
          fotedev
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors duration-200 hover:bg-surface"
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-subtle bg-surface md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => {
              setIsMenuOpen((open) => !open);
            }}
          >
            <span aria-hidden="true">{isMenuOpen ? "✕" : "☰"}</span>
            <span className="sr-only">{isMenuOpen ? t("closeMenu") : t("openMenu")}</span>
          </button>
        </div>
      </nav>

      {/* Mobile nav (disclosure — no modal complexity needed at M2) */}
      {isMenuOpen && (
        <ul id="mobile-nav" className="border-t border-border-subtle px-4 pb-3 md:hidden">
          {navItems.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-surface"
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
