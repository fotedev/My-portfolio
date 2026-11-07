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
import { credentialInputSchema, validatePublish } from "@/lib/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Credential writes — publish follows the same gate order as projects
 * (draft row → translations → UPDATE published; trigger stamps published_at
 * once and the R3 gate requires AR or en_only).
 */

type CredentialIntent = "draft" | "publish";

function describeError(operation: string, error: unknown): ActionResult {
  const requestId = randomUUID();
  console.error(`[admin/credentials] ${operation} failed (${requestId})`, error);
  const message = (error as Error)?.message ?? "";
  if (message.includes("R3 publish gate")) {
    return validationError(message.replace("R3 publish gate: ", ""));
  }
  return serverError(operation, requestId);
}

export async function saveCredential(
  id: string | null,
  intent: CredentialIntent,
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const parsed = credentialInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(firstIssue(parsed.error));
  }
  const data = parsed.data;

  const publishProblem = validatePublish("credential", data, intent === "publish");
  if (publishProblem) {
    return validationError(publishProblem);
  }

  const supabase = await createSupabaseServerClient();

  try {
    const baseValues = {
      kind: data.kind,
      recipient_name: data.recipient_name,
      issued_at: data.issued_at,
      credential_id: data.credential_id,
      verification_url: data.verification_url,
      proof_url: data.proof_url,
      asset_media_id: data.asset_media_id,
      asset_url: data.asset_url,
      sort_order: data.sort_order,
      en_only: data.en_only,
    };

    let credentialId = id;
    if (credentialId === null) {
      const { data: inserted, error: insertError } = await supabase
        .from("credentials")
        .insert({ ...baseValues, status: "draft" })
        .select("id")
        .single();
      if (insertError) throw insertError;
      credentialId = inserted.id;
    } else {
      const { error: updateError } = await supabase
        .from("credentials")
        .update(baseValues)
        .eq("id", credentialId);
      if (updateError) throw updateError;
    }

    const translationRows = [
      { credential_id: credentialId, locale: "en", ...data.translations_en },
      ...(data.translations_ar
        ? [{ credential_id: credentialId, locale: "ar", ...data.translations_ar }]
        : []),
    ];
    const { error: trError } = await supabase
      .from("credential_translations")
      .upsert(translationRows, { onConflict: "credential_id,locale" });
    if (trError) throw trError;

    if (intent === "publish") {
      const { error: publishError } = await supabase
        .from("credentials")
        .update({ status: "published" })
        .eq("id", credentialId);
      if (publishError) throw publishError;
    }

    revalidateContent("credential");
    return { ok: true, id: credentialId };
  } catch (error) {
    return describeError("saveCredential", error);
  }
}

export async function deleteDraftCredential(id: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const supabase = await createSupabaseServerClient();
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("credentials")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) {
      return validationError("This credential no longer exists.");
    }
    if (existing.status === "published") {
      return validationError("Unpublish this credential before deleting it.");
    }
    const { error: deleteError } = await supabase.from("credentials").delete().eq("id", id);
    if (deleteError) throw deleteError;
    revalidateContent("credential");
    return { ok: true };
  } catch (error) {
    return describeError("deleteDraftCredential", error);
  }
}

export async function unpublishCredential(id: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const supabase = await createSupabaseServerClient();
  try {
    const { error: updateError } = await supabase
      .from("credentials")
      .update({ status: "draft" })
      .eq("id", id);
    if (updateError) throw updateError;
    revalidateContent("credential");
    return { ok: true };
  } catch (error) {
    return describeError("unpublishCredential", error);
  }
}
