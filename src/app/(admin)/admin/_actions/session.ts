"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sign-out. The shared server client's setAll is a no-op (RSCs can't set
 * cookies), so this action clears the Supabase auth cookies explicitly via
 * `cookies()` — writable inside server actions — after revoking the session.
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }
}
