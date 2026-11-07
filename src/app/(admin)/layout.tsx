import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

/**
 * Root layout for the (admin) route group — English-only backoffice (locked
 * decision). The public (public)/[locale] group has its own root layout with
 * per-locale lang/dir. next/font must be referenced in a module that is
 * actually rendered; Inter is re-used from src/lib/fonts via CSS variable.
 */
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Admin · fotedev",
  robots: { index: false, follow: false },
};

export default function AdminGroupRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
