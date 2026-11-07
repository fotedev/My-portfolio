import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/admin/form";
import { CaseStudyView, type CaseStudyLabels } from "@/components/public/case-study-view";
import { formatDate } from "@/lib/content/localize";
import { toLocale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Draft preview — Admin",
  robots: { index: false, follow: false },
};

// English backoffice chrome (ADR-0005); content renders in its own locale.
const PREVIEW_LABELS: CaseStudyLabels = {
  backToProjects: "Back to projects",
  caseStudy: "Case study",
  liveDemo: "Live demo",
  sourceCode: "Source code",
  privateRepo: "Private production repo",
  stack: "Stack",
  problem: "Problem",
  solution: "Solution",
  results: "Results",
  lastUpdated: "Draft preview — timestamps not shown",
};

/**
 * Auth-gated draft preview (prompt-6 §5): renders the PENDING values for the
 * admin only — any status, both locales. Unauthenticated requests redirect
 * (proxy); non-admins are refused (RLS returns nothing to them anyway).
 * noindex via metadata + the proxy header; never CDN-cached (force-dynamic +
 * private no-store set in the proxy).
 */
export default async function AdminProjectPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: row } = await supabase
    .from("projects")
    .select(
      "slug, status, tech_stack, repo_url, live_url, updated_at, translations:project_translations(locale, title, summary, problem, solution, results)",
    )
    .eq("slug", slug)
    .maybeSingle();

  type Row = {
    slug: string;
    status: string;
    tech_stack: string[] | null;
    repo_url: string | null;
    live_url: string | null;
    updated_at: string;
    translations: Array<{
      locale: string;
      title: string;
      summary: string;
      problem: string | null;
      solution: string | null;
      results: string | null;
    }>;
  };

  if (row === null) {
    notFound();
  }
  const study = row as unknown as Row;

  // Preview prefers AR (the locale that has no public fallback yet), then EN.
  const tr = study.translations.find((item) => item.locale === "ar") ?? study.translations.find((item) => item.locale === "en");
  if (!tr || !tr.problem || !tr.solution) {
    notFound();
  }

  const previewLocale = tr.locale === "ar" ? toLocale("ar") : toLocale("en");

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning-bg bg-warning-bg/40 p-4">
        <Badge tone="warning">Draft preview</Badge>
        <p className="text-sm font-medium">
          Not visible to visitors — publish in the editor to make this live.
        </p>
        <Badge tone={study.status === "published" ? "published" : "draft"}>{study.status}</Badge>
        <Link href="/admin/projects" className="ms-auto text-sm text-accent underline underline-offset-4">
          ← Projects
        </Link>
      </div>

      <div className="mt-10 container-site" dir={previewLocale === "ar" ? "rtl" : "ltr"}>
        <CaseStudyView
          labels={PREVIEW_LABELS}
          study={{
            slug: study.slug,
            title: tr.title,
            summary: tr.summary,
            techStack: study.tech_stack ?? [],
            repoUrl: study.repo_url,
            liveUrl: study.live_url,
            problem: tr.problem,
            solution: tr.solution,
            results: tr.results,
            updatedAt: study.updated_at,
          }}
        />
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Rendered {formatDate(new Date().toISOString().slice(0, 10), "en")} · force-dynamic ·
        noindex, nofollow · Cache-Control: private, no-store
      </p>
    </section>
  );
}
