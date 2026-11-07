"use server";

import { randomUUID } from "node:crypto";
import { serverError, UNAUTHORIZED, validationError, type ActionResult } from "@/lib/admin/action-result";
import { requireAdminAction } from "@/lib/admin/auth";
import { inquiryStatusSchema } from "@/lib/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Inbox writes (prompt-6 §3). RLS `inquiries_admin_update` /
 * `inquiries_admin_delete` (migration 0003) enforce the allowlist; the typed
 * purge requires the exact 8-char reference to be retyped (delete-on-request
 * flow, OPERATIONS.md).
 */

export async function setInquiryStatus(id: string, status: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  const parsed = inquiryStatusSchema.safeParse(status);
  if (!parsed.success) {
    return validationError("Unknown status.");
  }

  const supabase = await createSupabaseServerClient();
  try {
    const { error } = await supabase.from("inquiries").update({ status: parsed.data }).eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    const requestId = randomUUID();
    console.error(`[admin/inquiries] setInquiryStatus failed (${requestId})`, error);
    return serverError("status update", requestId);
  }
}

export async function bulkArchiveInquiries(ids: string[]): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return validationError("Nothing selected.");
  }
  if (ids.length > 100) {
    return validationError("Archive at most 100 inquiries at a time.");
  }

  const supabase = await createSupabaseServerClient();
  try {
    const { error, count } = await supabase
      .from("inquiries")
      .update({ status: "archived" }, { count: "exact" })
      .in("id", ids);
    if (error) throw error;
    return { ok: true, message: `Archived ${count ?? ids.length} inquiry(ies).` };
  } catch (error) {
    const requestId = randomUUID();
    console.error(`[admin/inquiries] bulkArchiveInquiries failed (${requestId})`, error);
    return serverError("bulk archive", requestId);
  }
}

/** Delete-on-request: hard delete after the exact reference id is retyped. */
export async function purgeInquiry(id: string, typedReference: string): Promise<ActionResult> {
  const session = await requireAdminAction();
  if (session === null) return UNAUTHORIZED;

  if (typeof typedReference !== "string" || typedReference.trim() !== id.slice(0, 8)) {
    return validationError("The typed reference does not match this inquiry.");
  }

  const supabase = await createSupabaseServerClient();
  try {
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) throw error;
    return { ok: true, message: "Inquiry permanently deleted." };
  } catch (error) {
    const requestId = randomUUID();
    console.error(`[admin/inquiries] purgeInquiry failed (${requestId})`, error);
    return serverError("purge", requestId);
  }
}
