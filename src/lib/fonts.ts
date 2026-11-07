import { Fira_Code, IBM_Plex_Sans_Arabic, Inter } from "next/font/google";

/** English/LTR body + headings (DESIGN.md §7). */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Arabic (RTL) text (DESIGN.md §7). */
export const plexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-arabic",
  display: "swap",
});

/** Code, metrics, badges (DESIGN.md §7). */
export const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = [inter.variable, plexSansArabic.variable, firaCode.variable].join(" ");
