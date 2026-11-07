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
import { settingsInputSchema } from "@/lib/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Site settings (singleton id=1): base row + both translation rows, then a
 * layout-scope revalidation (hero/availability/footer render from the locale
 * layout — ARCHITECTURE §5.2 "settings" scope).
 */

function describeError(operation: string, error: unknown): ActionResult {
  const requestId = randomUUID();
  console.error(`[admin/settings] ${operation} failed (${requestId})`, error);
  return serverError(operation, requestId);
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(firstIssue(parsed.error));
  }
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();

  try {
    const { error: baseError } = await supabase
      .from("site_settings")
      .update({
        contact_email: data.contact_email,
        availability_status: data.availability_status,
        cv_url: data.cv_url,
        socials: data.socials,
      })
      .eq("id", 1);
    if (baseError) throw baseError;

    const translationRows = [
      { site_settings_id: 1, locale: "en", ...data.translations_en },
      { site_settings_id: 1, locale: "ar", ...data.translations_ar },
    ];
    const { error: trError } = await supabase
      .from("site_settings_translations")
      .upsert(translationRows, { onConflict: "site_settings_id,locale" });
    if (trError) throw trError;

    revalidateContent("settings");
    return { ok: true };
  } catch (error) {
    return describeError("saveSettings", error);
  }
}
