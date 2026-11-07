import Link from "next/link";
import { notFound } from "next/navigation";
import { CredentialEditorForm } from "@/components/admin/credential-editor-form";
import type { CredentialEditorData, MediaAssetSummary } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit credential — Admin" };

const EMPTY_CREDENTIAL: CredentialEditorData = {
  id: null,
  status: "draft",
  kind: "certificate",
  recipient_name: "Ahmed Aboalayoun",
  issued_at: "",
  credential_id: "",
  verification_url: "",
  proof_url: "",
  asset_media_id: null,
  asset_url: "",
  sort_order: 0,
  en_only: false,
  translations_en: { title: "", issuer_display: "", summary: "" },
  translations_ar: null,
};

/** Credentials editor — `[id]` is a UUID or "new". */
export default async function AdminCredentialEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const supabase = await createSupabaseServerClient();

  const [{ data: assets }, credentialResult] = await Promise.all([
    supabase
      .from("media_assets")
      .select("id, storage_path, mime_type, media_kind, alt_en, alt_ar")
      .order("created_at", { ascending: false })
      .limit(200),
    isNew
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from("credentials")
          .select(
            "id, kind, status, recipient_name, issued_at, credential_id, verification_url, proof_url, asset_media_id, asset_url, sort_order, en_only, translations:credential_translations(locale, title, issuer_display, summary)",
          )
          .eq("id", id)
          .maybeSingle(),
  ]);
  if (credentialResult.error) throw credentialResult.error;

  const row = credentialResult.data as unknown as
    | (Omit<CredentialEditorData, "translations_en" | "translations_ar" | "status" | "issued_at" | "credential_id" | "verification_url" | "asset_url"> & {
        status: string;
        issued_at: string | null;
        credential_id: string | null;
        verification_url: string | null;
        asset_url: string | null;
        translations: Array<{ locale: string; title: string; issuer_display: string; summary: string }>;
      })
    | null;

  if (row === null && !isNew) {
    notFound();
  }

  const en = row?.translations.find((tr) => tr.locale === "en");
  const ar = row?.translations.find((tr) => tr.locale === "ar");

  const initial: CredentialEditorData =
    row === null
      ? EMPTY_CREDENTIAL
      : {
          id: row.id,
          status: row.status === "published" ? "published" : "draft",
          kind: row.kind,
          recipient_name: row.recipient_name,
          issued_at: row.issued_at ?? "",
          credential_id: row.credential_id ?? "",
          verification_url: row.verification_url ?? "",
          proof_url: row.proof_url,
          asset_media_id: row.asset_media_id,
          asset_url: row.asset_url ?? "",
          sort_order: row.sort_order,
          en_only: row.en_only,
          translations_en: {
            title: en?.title ?? "",
            issuer_display: en?.issuer_display ?? "",
            summary: en?.summary ?? "",
          },
          translations_ar: ar
            ? { title: ar.title, issuer_display: ar.issuer_display, summary: ar.summary }
            : null,
        };

  return (
    <section>
      <Link href="/admin/credentials" className="text-sm text-muted-foreground hover:text-foreground">
        ← Credentials
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "New credential" : `Edit: ${initial.translations_en.title || initial.kind}`}
      </h1>
      <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
        <CredentialEditorForm
          initial={initial}
          isNew={isNew}
          status={initial.status}
          assets={(assets ?? []) as unknown as MediaAssetSummary[]}
        />
      </div>
    </section>
  );
}
