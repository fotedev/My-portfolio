import { MediaManager } from "@/components/admin/media-manager";
import type { MediaAssetSummary } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Media — Admin" };

/** Media library (prompt-6 §3): upload + grid; assets feed project/credential editors. */
export default async function AdminMediaPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("media_assets")
    .select("id, storage_path, mime_type, media_kind, alt_en, alt_ar, is_private")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return (
    <section>
      <h1 className="text-2xl font-semibold">Media</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Images (PNG/JPEG/WEBP/AVIF ≤ 2 MB) and PDFs (≤ 10 MB). Both alt texts are required — the
        database refuses the row without them.
      </p>
      <div className="mt-6">
        <MediaManager assets={(data ?? []) as unknown as MediaAssetSummary[]} />
      </div>
    </section>
  );
}
