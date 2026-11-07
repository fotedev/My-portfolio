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
import { serviceInputSchema } from "@/lib/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Service writes. `services.key` is immutable (inquiries.service_interest
 * references it; the FK has no ON UPDATE action), so updates may not change
 * it — the editor disables the field for existing rows and the action
 * double-checks. Visibility is `is_active` (the service "publish gate").
 */

function describeError(operation: string, error: unknown): ActionResult {
  const requestId = randomUUID();
  console.error(`[admin/services] ${operation} failed (${requestId})`, error);
  return serverError(operation, requestId);
}

export async function saveService(id: string | null, input: unknown): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const parsed = serviceInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(firstIssue(parsed.error));
  }
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();

  try {
    let serviceId = id;
    if (serviceId === null) {
      const { data: inserted, error: insertError } = await supabase
        .from("services")
        .insert({ key: data.key, icon: data.icon, sort_order: data.sort_order, is_active: data.is_active })
        .select("id")
        .single();
      if (insertError) {
        if (insertError.code === "23505") {
          return { ok: false, error: "That service key is already in use.", code: "conflict" };
        }
        throw insertError;
      }
      serviceId = inserted.id;
    } else {
      const { data: existing, error: fetchError } = await supabase
        .from("services")
        .select("key")
        .eq("id", serviceId)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!existing) {
        return validationError("This service no longer exists.");
      }
      if (existing.key !== data.key) {
        return {
          ok: false,
          error: "The service key is immutable — inquiries reference it. Create a new service instead.",
          code: "conflict",
        };
      }
      const { error: updateError } = await supabase
        .from("services")
        .update({ icon: data.icon, sort_order: data.sort_order, is_active: data.is_active })
        .eq("id", serviceId);
      if (updateError) throw updateError;
    }

    const translationRows = [
      { service_id: serviceId, locale: "en", ...data.translations_en },
      ...(data.translations_ar
        ? [{ service_id: serviceId, locale: "ar", ...data.translations_ar }]
        : []),
    ];
    const { error: trError } = await supabase
      .from("service_translations")
      .upsert(translationRows, { onConflict: "service_id,locale" });
    if (trError) throw trError;

    revalidateContent("service");
    return { ok: true, id: serviceId };
  } catch (error) {
    return describeError("saveService", error);
  }
}
