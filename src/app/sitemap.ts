import type { MetadataRoute } from "next";
import { getPublishedSlugs } from "@/lib/content/queries";
import { locales } from "@/lib/i18n/routing";
import { hreflangSet, localeUrl } from "@/lib/seo";

const staticPaths = ["", "/projects", "/services", "/about", "/contact", "/privacy"] as const;

/**
 * Sitemap for both locales with full hreflang sets incl. x-default
 * (docs/SEO-I18N.md §5.2). Case-study URLs carry truthful lastmod from the
 * database; /admin, /api and drafts are never listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const path of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: localeUrl(locale, path),
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: hreflangSet(path),
        },
      });
    }
  }

  try {
    const slugs = await getPublishedSlugs();
    for (const { slug, updatedAt } of slugs) {
      const path = `/projects/${slug}`;
      const lastModified = new Date(updatedAt);
      for (const locale of locales) {
        entries.push({
          url: localeUrl(locale, path),
          lastModified,
          changeFrequency: "monthly",
          priority: 0.8,
          alternates: {
            languages: hreflangSet(path),
          },
        });
      }
    }
  } catch {
    // DB unreachable at build: static routes still ship; case-study URLs omitted.
  }

  return entries;
}
