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
import { revalidateContent } from "@/lib/admin/revalidate.server";
import { projectInputSchema, validatePublish } from "@/lib/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Project (case study) writes — RLS `projects_admin_all` enforces the
 * allowlist; this file parses/validates, sequences the publish-gate order
 * (draft row → translations → UPDATE published, M3 lesson) and revalidates.
 */

type ProjectIntent = "draft" | "publish";

/** Resolve a media asset to its public URL (cover_image_url requires cover_asset_id — DB check). */
async function resolveCoverAsset(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  assetId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("media_assets")
    .select("bucket, storage_path")
    .eq("id", assetId)
    .maybeSingle();
  if (!data) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return base ? `${base}/storage/v1/object/public/${data.bucket}/${data.storage_path}` : null;
}

function describeError(operation: string, error: unknown): ActionResult {
  const requestId = randomUUID();
  console.error(`[admin/projects] ${operation} failed (${requestId})`, error);
  const code = (error as { code?: string })?.code;
  if (code === "23505") {
    return {
      ok: false,
      error: "That slug is already in use — pick a different one.",
      code: "conflict",
    };
  }
  const message = (error as Error)?.message ?? "";
  if (message.includes("R3 publish gate")) {
    return validationError(message.replace("R3 publish gate: ", ""));
  }
  return serverError(operation, requestId);
}

export async function saveProject(
  id: string | null,
  intent: ProjectIntent,
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(firstIssue(parsed.error));
  }
  const data = parsed.data;

  const publishProblem = validatePublish("project", data, intent === "publish");
  if (publishProblem) {
    return validationError(publishProblem);
  }

  const supabase = await createSupabaseServerClient();

  try {
    const coverUrl = data.cover_asset_id
      ? await resolveCoverAsset(supabase, data.cover_asset_id)
      : null;
    if (data.cover_asset_id && coverUrl === null) {
      return validationError("The selected cover image no longer exists — pick another one.");
    }

    const baseValues = {
      slug: data.slug,
      is_featured: data.is_featured,
      en_only: data.en_only,
      sort_order: data.sort_order,
      tech_stack: data.tech_stack,
      repo_url: data.repo_url,
      live_url: data.live_url,
      cover_asset_id: data.cover_asset_id,
      cover_image_url: coverUrl,
      gallery: data.gallery,
    };

    // Existing row? Needed for the R6 slug-redirect and revalidation of the old URL.
    let previousSlug: string | null = null;
    let wasPublished = false;
    if (id !== null) {
      const { data: existing, error: fetchError } = await supabase
        .from("projects")
        .select("slug, status")
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!existing) {
        return validationError("This project no longer exists — it may have been deleted elsewhere.");
      }
      previousSlug = existing.slug;
      wasPublished = existing.status === "published";
    }

    let projectId = id;
    if (projectId === null) {
      // New rows always land as draft; publishing happens after translations.
      const { data: inserted, error: insertError } = await supabase
        .from("projects")
        .insert({ ...baseValues, status: "draft" })
        .select("id")
        .single();
      if (insertError) throw insertError;
      projectId = inserted.id;
    } else {
      const { error: updateError } = await supabase
        .from("projects")
        .update(baseValues)
        .eq("id", projectId);
      if (updateError) throw updateError;
    }

    const translationRows = [
      { project_id: projectId, locale: "en", ...data.translations_en },
      ...(data.translations_ar
        ? [{ project_id: projectId, locale: "ar", ...data.translations_ar }]
        : []),
    ];
    const { error: trError } = await supabase
      .from("project_translations")
      .upsert(translationRows, { onConflict: "project_id,locale" });
    if (trError) throw trError;

    if (intent === "publish") {
      const { error: publishError } = await supabase
        .from("projects")
        .update({ status: "published" })
        .eq("id", projectId);
      if (publishError) throw publishError;
    }

    // R6 (CONTENT-MODEL): renaming a published slug leaves a 301 behind.
    if (previousSlug !== null && previousSlug !== data.slug && wasPublished) {
      await supabase
        .from("slug_redirects")
        .upsert({ from_slug: previousSlug, to_slug: data.slug }, { onConflict: "from_slug" });
    }

    const slugs = Array.from(new Set([data.slug, ...(previousSlug ? [previousSlug] : [])]));
    revalidateContent("project", slugs);

    return { ok: true, id: projectId };
  } catch (error) {
    return describeError("saveProject", error);
  }
}

/** Hard delete — draft rows only; published rows must be unpublished first. */
export async function deleteDraftProject(id: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const supabase = await createSupabaseServerClient();
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("projects")
      .select("slug, status")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) {
      return validationError("This project no longer exists.");
    }
    if (existing.status === "published") {
      return validationError("Unpublish this case study before deleting it.");
    }
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", id);
    if (deleteError) throw deleteError;
    revalidateContent("project", [existing.slug]);
    return { ok: true };
  } catch (error) {
    return describeError("deleteDraftProject", error);
  }
}

export async function unpublishProject(id: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const supabase = await createSupabaseServerClient();
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("projects")
      .select("slug")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) {
      return validationError("This project no longer exists.");
    }
    const { error: updateError } = await supabase
      .from("projects")
      .update({ status: "draft" })
      .eq("id", id);
    if (updateError) throw updateError;
    revalidateContent("project", [existing.slug]);
    return { ok: true };
  } catch (error) {
    return describeError("unpublishProject", error);
  }
}
