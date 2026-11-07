import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceEditorForm } from "@/components/admin/service-editor-form";
import type { ServiceEditorData } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit service — Admin" };

const EMPTY_SERVICE: ServiceEditorData = {
  id: null,
  key: "",
  icon: "",
  sort_order: 10,
  is_active: true,
  translations_en: { title: "", summary: "", deliverables: [] },
  translations_ar: null,
};

/** Services editor — `[id]` is a UUID or "new". */
export default async function AdminServiceEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const supabase = await createSupabaseServerClient();

  const projectResult = isNew
    ? { data: null, error: null }
    : await supabase
        .from("services")
        .select(
          "id, key, icon, sort_order, is_active, translations:service_translations(locale, title, summary, deliverables)",
        )
        .eq("id", id)
        .maybeSingle();
  if (projectResult.error) throw projectResult.error;

  const row = projectResult.data as unknown as
    | (Omit<ServiceEditorData, "translations_en" | "translations_ar"> & {
        translations: Array<{ locale: string; title: string; summary: string; deliverables: string[] }>;
      })
    | null;

  if (row === null && !isNew) {
    notFound();
  }

  const en = row?.translations.find((tr) => tr.locale === "en");
  const ar = row?.translations.find((tr) => tr.locale === "ar");

  const initial: ServiceEditorData =
    row === null
      ? EMPTY_SERVICE
      : {
          id: row.id,
          key: row.key,
          icon: row.icon ?? "",
          sort_order: row.sort_order,
          is_active: row.is_active,
          translations_en: {
            title: en?.title ?? "",
            summary: en?.summary ?? "",
            deliverables: en?.deliverables ?? [],
          },
          translations_ar: ar
            ? { title: ar.title, summary: ar.summary, deliverables: ar.deliverables ?? [] }
            : null,
        };

  return (
    <section>
      <Link href="/admin/services" className="text-sm text-muted-foreground hover:text-foreground">
        ← Services
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "New service" : `Edit: ${initial.translations_en.title || initial.key}`}
      </h1>
      <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
        <ServiceEditorForm initial={initial} isNew={isNew} />
      </div>
    </section>
  );
}
