import Link from "next/link";
import { ProjectsTable, type ProjectRow } from "@/components/admin/projects-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Projects — Admin" };

/** Projects list (prompt-6 §3): sortable table → editors. */
export default async function AdminProjectsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, slug, status, is_featured, sort_order, updated_at, translations:project_translations(locale, title)",
    )
    .order("sort_order");
  if (error) throw error;

  type Row = {
    id: string;
    slug: string;
    status: string;
    is_featured: boolean;
    sort_order: number;
    updated_at: string;
    translations: Array<{ locale: string; title: string }>;
  };

  const rows: ProjectRow[] = (data as unknown as Row[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    status: row.status === "published" ? "published" : "draft",
    is_featured: row.is_featured,
    sort_order: row.sort_order,
    updated_at: row.updated_at,
    title: row.translations.find((tr) => tr.locale === "en")?.title ?? row.translations[0]?.title ?? "",
  }));

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-strong"
        >
          New project
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border-subtle bg-surface p-6 text-muted-foreground">
          No projects yet — create the first case study.
        </p>
      ) : (
        <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-4">
          <ProjectsTable rows={rows} />
        </div>
      )}
    </section>
  );
}
