import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cache } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { Database } from "@/lib/supabase/database.types";
import { pickLocalized } from "./localize";

/**
 * Build/revalidate-time reads of PUBLISHED public content (prompt-4 §4).
 * The anon key + RLS govern access; only published rows are visible.
 * These functions run in server components during build/ISR — never client-side.
 */

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — required for public content reads at build time.",
    );
  }
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No session on public read paths.
      },
    },
  });
}

export type ProjectCard = {
  slug: string;
  title: string;
  summary: string;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
};

export type CaseStudy = ProjectCard & {
  problem: string;
  solution: string;
  results: string | null;
  updatedAt: string;
};

export type ServiceItem = {
  key: string;
  title: string;
  summary: string;
  deliverables: string[];
};

export type Contribution = {
  repo: string;
  number: number;
  kind: "pr" | "issue";
  status: string;
  relatedNumber: number | null;
  verificationDate: string;
  proofUrl: string;
  title: string;
  summary: string;
};

export type Credential = {
  title: string;
  issuerDisplay: string;
  summary: string;
  recipientName: string;
  proofUrl: string;
  pdfUrl: string | null;
};

export type SiteSettings = {
  contactEmail: string;
  availabilityStatus: string;
  socials: Array<{ platform: string; url: string }>;
  heroName: string;
  heroRole: string;
  heroOffer: string;
  availabilityText: string;
};

type ProjectTranslations = Array<{
  locale: string;
  title: string;
  summary: string;
  problem: string | null;
  solution: string | null;
  results: string | null;
}>;

type ProjectRow = {
  slug: string;
  sort_order: number;
  tech_stack: string[] | null;
  repo_url: string | null;
  live_url: string | null;
  updated_at: string;
  translations: ProjectTranslations;
};

function toProjectCard(row: ProjectRow, locale: Locale): ProjectCard | null {
  const tr = pickLocalized(row.translations, locale);
  if (!tr) return null;
  return {
    slug: row.slug,
    title: tr.title,
    summary: tr.summary,
    techStack: row.tech_stack ?? [],
    repoUrl: row.repo_url,
    liveUrl: row.live_url,
  };
}

const PROJECT_SELECT =
  "slug, sort_order, tech_stack, repo_url, live_url, updated_at, translations:project_translations(locale, title, summary, problem, solution, results)";

/** All published case studies for the projects index (ISR-cached). */
export const getPublishedProjects = cache(async (locale: Locale): Promise<ProjectCard[]> => {
  const { data, error } = await publicClient()
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("status", "published")
    .order("sort_order");
  if (error) throw error;
  return (data as unknown as ProjectRow[])
    .map((row) => toProjectCard(row, locale))
    .filter((card): card is ProjectCard => card !== null);
});

/** Featured, published case studies for the home page. */
export const getFeaturedProjects = cache(async (locale: Locale): Promise<ProjectCard[]> => {
  const { data, error } = await publicClient()
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("sort_order");
  if (error) throw error;
  return (data as unknown as ProjectRow[])
    .map((row) => toProjectCard(row, locale))
    .filter((card): card is ProjectCard => card !== null);
});

/** All published project slugs (sitemap + generateStaticParams). */
export const getPublishedSlugs = cache(async (): Promise<Array<{ slug: string; updatedAt: string }>> => {
  const { data, error } = await publicClient()
    .from("projects")
    .select("slug, updated_at, translations:project_translations(locale)")
    .eq("status", "published")
    .order("sort_order");
  if (error) throw error;
  const rows = data as unknown as Array<ProjectRow>;
  // A slug is only publicly linkable when it has at least one translation.
  return rows.filter((r) => r.translations.length > 0).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
});

/** Full case study for a published slug, localized (EN fallback). */
export const getCaseStudy = cache(async (locale: Locale, slug: string): Promise<CaseStudy | null> => {
  const { data, error } = await publicClient()
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .limit(1);
  if (error) throw error;
  const row = (data as unknown as ProjectRow[])[0];
  if (!row) return null;
  const tr = pickLocalized(row.translations, locale);
  if (!tr || !tr.problem || !tr.solution) return null;
  return {
    slug: row.slug,
    title: tr.title,
    summary: tr.summary,
    techStack: row.tech_stack ?? [],
    repoUrl: row.repo_url,
    liveUrl: row.live_url,
    problem: tr.problem,
    solution: tr.solution,
    results: tr.results,
    updatedAt: row.updated_at,
  };
});

/** Published services, localized, in the fixed PRODUCT.md order. */
export const getServices = cache(async (locale: Locale): Promise<ServiceItem[]> => {
  const { data, error } = await publicClient()
    .from("services")
    .select("key, sort_order, translations:service_translations(locale, title, summary, deliverables)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  type Row = {
    key: string;
    translations: Array<{ locale: string; title: string; summary: string; deliverables: string[] }>;
  };
  return (data as unknown as Row[])
    .map((row) => {
      const tr = pickLocalized(row.translations, locale);
      if (!tr) return null;
      return { key: row.key, title: tr.title, summary: tr.summary, deliverables: tr.deliverables ?? [] };
    })
    .filter((s): s is ServiceItem => s !== null);
});

/** Published contributions (OSS + security record), localized titles/summaries. */
export const getContributions = cache(async (locale: Locale): Promise<Contribution[]> => {
  const { data, error } = await publicClient()
    .from("contributions")
    .select(
      "repo, number, kind, status, related_number, verification_date, proof_url, translations:contribution_translations(locale, title, summary)",
    )
    .eq("is_published", true)
    .order("sort_order");
  if (error) throw error;
  type Row = {
    repo: string;
    number: number;
    kind: string;
    status: string;
    related_number: number | null;
    verification_date: string;
    proof_url: string;
    translations: Array<{ locale: string; title: string; summary: string }>;
  };
  return (data as unknown as Row[])
    .map((row) => {
      const tr = pickLocalized(row.translations, locale);
      if (!tr) return null;
      return {
        repo: row.repo,
        number: row.number,
        kind: row.kind === "issue" ? ("issue" as const) : ("pr" as const),
        status: row.status,
        relatedNumber: row.related_number,
        verificationDate: row.verification_date,
        proofUrl: row.proof_url,
        title: tr.title,
        summary: tr.summary,
      };
    })
    .filter((c): c is Contribution => c !== null);
});

/** Published credential (OMP certificate) + its Storage PDF URL. */
export const getPublishedCredential = cache(async (locale: Locale): Promise<Credential | null> => {
  const { data, error } = await publicClient()
    .from("credentials")
    .select(
      "recipient_name, proof_url, translations:credential_translations(locale, title, issuer_display, summary), media:media_assets(bucket, storage_path)",
    )
    .eq("status", "published")
    .order("sort_order")
    .limit(1);
  if (error) throw error;
  type Row = {
    recipient_name: string;
    proof_url: string;
    translations: Array<{ locale: string; title: string; issuer_display: string; summary: string }>;
    // Many-to-one embed (credentials.asset_media_id → media_assets): PostgREST
    // returns an object, but a missing/ambiguous relationship can yield an
    // array — accept both shapes.
    media: { bucket: string; storage_path: string } | Array<{ bucket: string; storage_path: string }> | null;
  };
  const row = (data as unknown as Row[])[0];
  if (!row) return null;
  const tr = pickLocalized(row.translations, locale);
  if (!tr) return null;
  const media = Array.isArray(row.media) ? row.media[0] : row.media;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const pdfUrl =
    media && base ? `${base}/storage/v1/object/public/${media.bucket}/${media.storage_path}` : null;
  return {
    title: tr.title,
    issuerDisplay: tr.issuer_display,
    summary: tr.summary,
    recipientName: row.recipient_name,
    proofUrl: row.proof_url,
    pdfUrl,
  };
});

/** Site settings singleton (contact email, availability, socials, hero copy). */
export const getSiteSettings = cache(async (locale: Locale): Promise<SiteSettings | null> => {
  const { data, error } = await publicClient()
    .from("site_settings")
    .select(
      "contact_email, availability_status, socials, translations:site_settings_translations(locale, hero_name, hero_role, hero_offer, availability_text)",
    )
    .eq("id", 1)
    .limit(1);
  if (error) throw error;
  type Row = {
    contact_email: string;
    availability_status: string;
    socials: Array<{ platform: string; url: string }> | null;
    translations: Array<{
      locale: string;
      hero_name: string;
      hero_role: string;
      hero_offer: string;
      availability_text: string;
    }>;
  };
  const row = (data as unknown as Row[])[0];
  if (!row) return null;
  const tr = pickLocalized(row.translations, locale);
  if (!tr) return null;
  return {
    contactEmail: row.contact_email,
    availabilityStatus: row.availability_status,
    socials: row.socials ?? [],
    heroName: tr.hero_name,
    heroRole: tr.hero_role,
    heroOffer: tr.hero_offer,
    availabilityText: tr.availability_text,
  };
});
