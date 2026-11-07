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
import { contributionInputSchema } from "@/lib/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Contribution writes. Visibility is `is_published` (the status column carries
 * the *claim* status: merged/open/acknowledged — never "fixed", R-rule lock).
 * `verification_date` + `proof_url` are required by the schema (no invented
 * claims) and re-checked here for a friendly error.
 */

function describeError(operation: string, error: unknown): ActionResult {
  const requestId = randomUUID();
  console.error(`[admin/contributions] ${operation} failed (${requestId})`, error);
  return serverError(operation, requestId);
}

export async function saveContribution(id: string | null, input: unknown): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const parsed = contributionInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(firstIssue(parsed.error));
  }
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();

  try {
    const baseValues = {
      repo: data.repo,
      number: data.number,
      kind: data.kind,
      status: data.status,
      your_role: data.your_role,
      related_number: data.related_number,
      event_date: data.event_date,
      verification_date: data.verification_date,
      proof_url: data.proof_url,
      sort_order: data.sort_order,
      is_published: data.is_published,
    };

    let contributionId = id;
    if (contributionId === null) {
      const { data: inserted, error: insertError } = await supabase
        .from("contributions")
        .insert(baseValues)
        .select("id")
        .single();
      if (insertError) throw insertError;
      contributionId = inserted.id;
    } else {
      const { error: updateError } = await supabase
        .from("contributions")
        .update(baseValues)
        .eq("id", contributionId);
      if (updateError) throw updateError;
    }

    const translationRows = [
      { contribution_id: contributionId, locale: "en", ...data.translations_en },
      ...(data.translations_ar
        ? [{ contribution_id: contributionId, locale: "ar", ...data.translations_ar }]
        : []),
    ];
    const { error: trError } = await supabase
      .from("contribution_translations")
      .upsert(translationRows, { onConflict: "contribution_id,locale" });
    if (trError) throw trError;

    revalidateContent("contribution");
    return { ok: true, id: contributionId };
  } catch (error) {
    return describeError("saveContribution", error);
  }
}

export async function deleteDraftContribution(id: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const supabase = await createSupabaseServerClient();
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("contributions")
      .select("is_published")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) {
      return validationError("This contribution no longer exists.");
    }
    if (existing.is_published) {
      return validationError("Unpublish this contribution before deleting it.");
    }
    const { error: deleteError } = await supabase.from("contributions").delete().eq("id", id);
    if (deleteError) throw deleteError;
    revalidateContent("contribution");
    return { ok: true };
  } catch (error) {
    return describeError("deleteDraftContribution", error);
  }
}
