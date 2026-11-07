import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Admin gate (single-admin allowlist, ADR-0007). RLS is the real enforcement;
 * this gate is defense in depth for pages/actions (prompt-6 §4/§6).
 */

export type AdminSession = { userId: string; email: string };

export type AdminGate =
  | { kind: "unauthenticated" }
  | { kind: "unauthorized"; email: string }
  | { kind: "ok"; session: AdminSession };

/**
 * Resolve the gate for a request. Pages redirect unauthenticated visitors to
 * the login screen; server actions treat any non-"ok" result as a typed 401.
 */
export async function resolveAdminGate(): Promise<AdminGate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return { kind: "unauthenticated" };
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return { kind: "unauthorized", email: user.email ?? "" };
  }
  return { kind: "ok", session: { userId: user.id, email: user.email ?? "" } };
}

/** Page helper: redirects unauthenticated users, throws for non-admins (UI shows the screen). */
export async function requireAdminPage(): Promise<AdminSession> {
  const gate = await resolveAdminGate();
  if (gate.kind === "unauthenticated") {
    redirect("/admin/login");
  }
  if (gate.kind === "unauthorized") {
    throw new AdminNotAllowedError(gate.email);
  }
  return gate.session;
}

export class AdminNotAllowedError extends Error {
  readonly email: string;
  constructor(email: string) {
    super("not on the admin allowlist");
    this.email = email;
  }
}

/** Action helper: null means the action must answer {ok:false, error:"unauthorized"}. */
export async function requireAdminAction(): Promise<AdminSession | null> {
  const gate = await resolveAdminGate();
  return gate.kind === "ok" ? gate.session : null;
}
