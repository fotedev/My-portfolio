import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectEditorForm } from "@/components/admin/project-editor-form";
import type { MediaAssetSummary, ProjectEditorData } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit project — Admin" };

const EMPTY_STUDY: ProjectEditorData = {
  id: null,
  status: "draft",
  slug: "",
  is_featured: false,
  en_only: false,
  sort_order: 10,
  tech_stack: [],
  repo_url: null,
  live_url: null,
  cover_asset_id: null,
  gallery: [],
  translations_en: { title: "", summary: "", problem: "", solution: "", results: "" },
  translations_ar: null,
};

/** Projects editor — `[id]` is a UUID or "new" (prompt-6 §3). */
export default async function AdminProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const supabase = await createSupabaseServerClient();

  const [{ data: assets }, projectResult] = await Promise.all([
    supabase
      .from("media_assets")
      .select("id, storage_path, mime_type, media_kind, alt_en, alt_ar")
      .order("created_at", { ascending: false })
      .limit(200),
    isNew
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from("projects")
          .select(
            "id, slug, status, is_featured, en_only, sort_order, tech_stack, repo_url, live_url, cover_asset_id, gallery, translations:project_translations(locale, title, summary, problem, solution, results)",
          )
          .eq("id", id)
          .maybeSingle(),
  ]);

  if (projectResult.error) throw projectResult.error;
  const row = projectResult.data as unknown as
    | (Omit<ProjectEditorData, "translations_en" | "translations_ar" | "status"> & {
        status: string;
        translations: Array<{
          locale: string;
          title: string;
          summary: string;
          problem: string;
          solution: string;
          results: string | null;
        }>;
      })
    | null;
  if (row === null) {
    if (!isNew) {
      notFound();
    }
  }
  const en = row?.translations.find((tr) => tr.locale === "en");
  const ar = row?.translations.find((tr) => tr.locale === "ar");

  const initial: ProjectEditorData =
    row === null
      ? EMPTY_STUDY
      : {
          id: row.id,
          status: row.status === "published" ? "published" : "draft",
          slug: row.slug,
          is_featured: row.is_featured,
          en_only: row.en_only,
          sort_order: row.sort_order,
          tech_stack: row.tech_stack,
          repo_url: row.repo_url,
          live_url: row.live_url,
          cover_asset_id: row.cover_asset_id,
          gallery: row.gallery ?? [],
          translations_en: {
            title: en?.title ?? "",
            summary: en?.summary ?? "",
            problem: en?.problem ?? "",
            solution: en?.solution ?? "",
            results: en?.results ?? "",
          },
          translations_ar: ar
            ? {
                title: ar.title,
                summary: ar.summary,
                problem: ar.problem,
                solution: ar.solution,
                results: ar.results ?? "",
              }
            : null,
        };

  return (
    <section>
      <Link href="/admin/projects" className="text-sm text-muted-foreground hover:text-foreground">
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "New project" : `Edit: ${initial.translations_en.title || initial.slug}`}
      </h1>

      <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
        <ProjectEditorForm
          initial={initial}
          isNew={isNew}
          status={initial.status}
          assets={(assets ?? []) as unknown as MediaAssetSummary[]}
        />
      </div>
    </section>
  );
}
