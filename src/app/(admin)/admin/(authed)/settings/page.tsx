import { SettingsEditorForm } from "@/components/admin/settings-editor-form";
import type { SettingsEditorData } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings — Admin" };

/** Settings editor (prompt-6 §3) — singleton + both locale translation rows. */
export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "contact_email, availability_status, cv_url, socials, translations:site_settings_translations(locale, hero_name, hero_role, hero_offer, availability_text)",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;

  type Row = {
    contact_email: string;
    availability_status: string;
    cv_url: string | null;
    socials: Array<{ platform: string; url: string }> | null;
    translations: Array<{
      locale: string;
      hero_name: string;
      hero_role: string;
      hero_offer: string;
      availability_text: string;
    }>;
  };

  const row = data as unknown as Row | null;
  if (row === null) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-4 rounded-xl border border-border-subtle bg-surface p-6 text-muted-foreground">
          The settings singleton (id = 1) is missing — it is created by the M1 seed.
        </p>
      </section>
    );
  }

  const en = row.translations.find((tr) => tr.locale === "en");
  const ar = row.translations.find((tr) => tr.locale === "ar");

  const initial: SettingsEditorData = {
    contact_email: row.contact_email,
    availability_status: row.availability_status === "unavailable" ? "unavailable" : "available",
    cv_url: row.cv_url ?? "",
    socials: row.socials ?? [],
    translations_en: {
      hero_name: en?.hero_name ?? "",
      hero_role: en?.hero_role ?? "",
      hero_offer: en?.hero_offer ?? "",
      availability_text: en?.availability_text ?? "",
    },
    translations_ar: {
      hero_name: ar?.hero_name ?? "",
      hero_role: ar?.hero_role ?? "",
      hero_offer: ar?.hero_offer ?? "",
      availability_text: ar?.availability_text ?? "",
    },
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hero copy, availability, contact email, socials. Saving revalidates every public page
        (layout scope) on demand.
      </p>
      <div className="mt-6 rounded-xl border border-border-subtle bg-surface p-5">
        <SettingsEditorForm initial={initial} />
      </div>
    </section>
  );
}
