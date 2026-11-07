import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributionEditorForm } from "@/components/admin/contribution-editor-form";
import type { ContributionEditorData } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit contribution — Admin" };

const EMPTY_CONTRIBUTION: ContributionEditorData = {
  id: null,
  is_published: false,
  repo: "",
  number: "",
  kind: "pr",
  status: "open",
  your_role: "",
  related_number: "",
  event_date: "",
  verification_date: "",
  proof_url: "",
  sort_order: 10,
  translations_en: { title: "", summary: "" },
  translations_ar: null,
};

/** Contributions editor — `[id]` is a UUID or "new". */
export default async function AdminContributionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const supabase = await createSupabaseServerClient();

  const result = isNew
    ? { data: null, error: null }
    : await supabase
        .from("contributions")
        .select(
          "id, repo, number, kind, status, is_published, your_role, related_number, event_date, verification_date, proof_url, sort_order, translations:contribution_translations(locale, title, summary)",
        )
        .eq("id", id)
        .maybeSingle();
  if (result.error) throw result.error;

  const row = result.data as unknown as
    | (Omit<ContributionEditorData, "translations_en" | "translations_ar" | "number" | "related_number"> & {
        number: number;
        related_number: number | null;
        translations: Array<{ locale: string; title: string; summary: string }>;
      })
    | null;

  if (row === null && !isNew) {
    notFound();
  }

  const en = row?.translations.find((tr) => tr.locale === "en");
  const ar = row?.translations.find((tr) => tr.locale === "ar");

  const initial: ContributionEditorData =
    row === null
      ? EMPTY_CONTRIBUTION
      : {
          id: row.id,
          is_published: row.is_published,
          repo: row.repo,
          number: row.number,
          kind: row.kind,
          status: row.status,
          your_role: row.your_role,
          related_number: row.related_number ?? "",
          event_date: row.event_date ?? "",
          verification_date: row.verification_date,
          proof_url: row.proof_url,
          sort_order: row.sort_order,
          translations_en: { title: en?.title ?? "", summary: en?.summary ?? "" },
          translations_ar: ar ? { title: ar.title, summary: ar.summary } : null,
        };

  return (
    <section>
      <Link href="/admin/contributions" className="text-sm text-muted-foreground hover:text-foreground">
        ← Contributions
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "New contribution" : `Edit: ${initial.repo}#${initial.number}`}
      </h1>
      <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
        <ContributionEditorForm
          initial={initial}
          isNew={isNew}
          isPublished={initial.is_published}
        />
      </div>
    </section>
  );
}
