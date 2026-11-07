import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin root wrapper (no chrome — the authed route group supplies the shell;
 * /admin/login renders bare). English-only backoffice (ADR-0005).
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>;
}
