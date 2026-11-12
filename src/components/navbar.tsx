"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, usePathname } from "@/lib/i18n/navigation";

const navItems = [
  { href: "/", key: "home" },
  { href: "/projects", key: "projects" },
  { href: "/services", key: "services" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Sticky header (DESIGN §10.6): wordmark, nav links with active accent
 * underline, switcher + theme toggle at the inline-end. The SAME
 .container-site as every section, so all left edges line up.
 */
export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="site-header border-b border-border-subtle">
      <nav className="container-site flex items-center justify-between gap-4 py-2" aria-label="Main">
        <Link href="/" className="font-mono font-medium text-foreground">
          fotedev
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors duration-150 ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(item.key)}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-accent"
                    />
                  )}
                </Link>
              </li>
            );
          })}
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
            {/* SVG glyphs (no text) — visible text would violate Label-in-Name */}
            <span aria-hidden="true" className="inline-flex">
              {isMenuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </span>
            <span className="sr-only">{isMenuOpen ? t("closeMenu") : t("openMenu")}</span>
          </button>
        </div>
      </nav>

      {/* Mobile nav (disclosure — no modal complexity needed) */}
      {isMenuOpen && (
        <ul id="mobile-nav" className="container-site border-t border-border-subtle pb-3 md:hidden">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-md px-3 text-sm ${
                    active ? "bg-accent-subtle text-foreground" : "text-muted-foreground hover:bg-surface"
                  }`}
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}
