"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/credentials", label: "Credentials" },
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/**
 * Admin sidebar (prompt-6 §3). Desktop: fixed left rail. Mobile (≥375 px
 * usable): collapses to a disclosure above the content.
 */
export function AdminSidebar({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string): boolean {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const links = (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          onClick={() => {
            setOpen(false);
          }}
          className={`flex min-h-11 items-center justify-between rounded-md px-3 text-sm transition-colors ${
            isActive(item.href)
              ? "bg-accent-subtle font-medium text-accent"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          <span>{item.label}</span>
          {item.href === "/admin/inquiries" && unreadCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              {unreadCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile disclosure */}
      <div className="border-b border-border-subtle lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-sidebar-mobile"
          onClick={() => {
            setOpen((value) => !value);
          }}
          className="flex min-h-11 w-full items-center gap-2 px-4 text-sm font-medium"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
          Menu
        </button>
        {open && (
          <div id="admin-sidebar-mobile" className="px-3 pb-3">
            {links}
          </div>
        )}
      </div>

      {/* Desktop rail */}
      <aside className="hidden w-56 shrink-0 border-e border-border-subtle px-3 py-6 lg:block">
        <div className="sticky top-6">{links}</div>
      </aside>
    </>
  );
}
