import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fotedev.me";
const publicPaths = ["", "/projects", "/about", "/contact", "/privacy"] as const;

/** Sitemap for both locales with hreflang alternates (docs/SEO-I18N.md §5). */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const path of publicPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
        },
      });
    }
  }

  return entries;
}
