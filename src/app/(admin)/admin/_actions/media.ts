"use server";

import { randomUUID } from "node:crypto";
import {
  firstIssue,
  serverError,
  UNAUTHORIZED,
  validationError,
  type ActionResult,
} from "@/lib/admin/action-result";
import { requireAdminAction } from "@/lib/admin/auth";
import { classifyUpload, KIND_MIME, maxBytesFor } from "@/lib/admin/magic";
import { revalidateContent } from "@/lib/admin/revalidate.server";
import { mediaMetaSchema, slugify } from "@/lib/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Media uploads (prompt-6 §3/§6): client AND server validate MIME (magic
 * bytes — declared Content-Type is not trusted) and size; storage path
 * `media/<yyyy-mm>/<uuid>-<slug>`; alt EN+AR required by the DB itself.
 * The bucket's own MIME whitelist + 10 MB cap remain the coarse gates.
 */

export async function uploadMedia(formData: FormData): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const meta = mediaMetaSchema.safeParse({
    alt_en: formData.get("alt_en"),
    alt_ar: formData.get("alt_ar"),
    is_private: formData.get("is_private") === "true",
  });
  if (!meta.success) {
    return validationError(firstIssue(meta.error));
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return validationError("file: choose an image (PNG/JPEG/WEBP/AVIF ≤ 2 MB) or a PDF ≤ 10 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = classifyUpload(bytes);
  if (detected.kind === null) {
    return validationError(
      "file: content is not an allowed type (PNG, JPEG, WEBP, AVIF or PDF). Executables, HTML and other formats are rejected regardless of the file name.",
    );
  }
  const maxBytes = maxBytesFor(detected.kind);
  if (bytes.length > maxBytes) {
    return validationError(
      `file: too large (${Math.ceil(bytes.length / 1024)} KB). Limit: ${Math.ceil(maxBytes / 1024)} KB for this type.`,
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    const now = new Date();
    const yyyyMm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const originalName = file.name.length > 0 ? file.name : "upload";
    const extension =
      detected.kind === "jpeg"
        ? "jpg"
        : detected.kind === "pdf"
          ? "pdf"
          : detected.kind;
    const baseName = slugify(originalName.replace(/\.[a-z0-9]+$/i, "")) || "asset";
    const storagePath = `media/${yyyyMm}/${randomUUID()}-${baseName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(storagePath, bytes, {
        contentType: KIND_MIME[detected.kind],
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: inserted, error: insertError } = await supabase
      .from("media_assets")
      .insert({
        bucket: "public-assets",
        storage_path: storagePath,
        media_kind: detected.kind === "pdf" ? "document" : "image",
        mime_type: KIND_MIME[detected.kind],
        size_bytes: bytes.length,
        alt_en: meta.data.alt_en,
        alt_ar: meta.data.alt_ar,
        is_private: meta.data.is_private,
        uploaded_by: session.userId,
      })
      .select("id")
      .single();
    if (insertError) {
      // Row insert failed — do not strand the uploaded object.
      await supabase.storage.from("public-assets").remove([storagePath]);
      throw insertError;
    }

    revalidateContent("media");
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    return {
      ok: true,
      id: inserted.id,
      message: base ? `${base}/storage/v1/object/public/public-assets/${storagePath}` : undefined,
    };
  } catch (error) {
    const requestId = randomUUID();
    console.error(`[admin/media] uploadMedia failed (${requestId})`, error);
    return serverError("upload", requestId);
  }
}

/** Block deleting assets that a published/draft row still references. */
export async function deleteMedia(id: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const supabase = await createSupabaseServerClient();
  try {
    const { data: asset, error: fetchError } = await supabase
      .from("media_assets")
      .select("bucket, storage_path")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!asset) {
      return validationError("This asset no longer exists.");
    }

    const [{ count: coverUses }, { count: credentialUses }] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("cover_asset_id", id),
      supabase.from("credentials").select("id", { count: "exact", head: true }).eq("asset_media_id", id),
    ]);
    const uses = (coverUses ?? 0) + (credentialUses ?? 0);
    if (uses > 0) {
      return {
        ok: false,
        error: `This asset is still referenced by ${uses} project(s)/credential(s) — detach it there first.`,
        code: "conflict",
      };
    }

    const { error: deleteError } = await supabase.from("media_assets").delete().eq("id", id);
    if (deleteError) throw deleteError;
    const { error: removeError } = await supabase.storage
      .from(asset.bucket)
      .remove([asset.storage_path]);
    if (removeError) {
      console.error(`[admin/media] orphaned object after row delete: ${asset.storage_path}`);
    }
    revalidateContent("media");
    return { ok: true };
  } catch (error) {
    const requestId = randomUUID();
    console.error(`[admin/media] deleteMedia failed (${requestId})`, error);
    return serverError("delete", requestId);
  }
}
