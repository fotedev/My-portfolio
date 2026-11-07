/**
 * Revalidation path/tag map (prompt-6 §4, ARCHITECTURE §5.2). Pure and
 * unit-testable: server actions call the executor in actions files which
 * walks these lists with `revalidatePath`. Caching is route-level ISR
 * (`revalidate = false`) — there are no fetch cache tags today, so paths are
 * the effective tool; the tag list documents the intended contract and is
 * passed to `revalidateTag` as well (no-op until tagged reads exist).
 */

export const CONTENT_TAGS = ["home", "projects:list", "project:slugs", "services", "settings", "credentials", "contributions"] as const;
export type ContentTag = (typeof CONTENT_TAGS)[number];

export type RevalidateKind = "settings" | "project" | "service" | "credential" | "contribution" | "media";

export type RevalidatePlan = {
  /** Exact page paths (page-level revalidation). */
  paths: string[];
  /** Locale layout scopes — revalidatePath(path, "layout"), used when layout data (settings/footer) changes. */
  layoutScopes: string[];
  tags: ContentTag[];
  /** Metadata route that must refresh after content changes. */
  metadata: string[];
};

function baseHome(): string[] {
  return ["/en", "/ar"];
}

function withSlug(slug: string): string[] {
  return [`/en/projects/${slug}`, `/ar/projects/${slug}`];
}

export function planRevalidation(kind: RevalidateKind, slug?: string): RevalidatePlan {
  switch (kind) {
    case "settings":
      // Settings (hero, availability, email, socials) render inside the
      // locale layout (footer, navbar badge) and on home/about/contact —
      // layout-scope revalidation covers every nested public route.
      return { paths: [], layoutScopes: ["/en", "/ar"], tags: ["settings", "home"], metadata: ["/sitemap.xml"] };
    case "project":
      return {
        paths: [...baseHome(), "/en/projects", "/ar/projects", ...(slug ? withSlug(slug) : [])],
        layoutScopes: [],
        tags: ["home", "projects:list", "project:slugs"],
        metadata: ["/sitemap.xml"],
      };
    case "service":
      return {
        paths: [...baseHome(), "/en/services", "/ar/services"],
        layoutScopes: [],
        tags: ["home", "services"],
        metadata: [],
      };
    case "credential":
    case "contribution":
      return {
        paths: [...baseHome(), "/en/about", "/ar/about"],
        layoutScopes: [],
        tags: ["home", "credentials", "contributions"],
        metadata: [],
      };
    case "media":
      // Media assets surface only through projects/credentials; nothing is
      // publicly rendered per-asset. Deleting an in-use asset is blocked in
      // the action, so no public path depends on this event.
      return { paths: [], layoutScopes: [], tags: [], metadata: [] };
  }
}

/** Tags a publish/unpublish of the given kind invalidates (subset map). */
export function tagsFor(kind: RevalidateKind): ContentTag[] {
  return planRevalidation(kind).tags;
}
