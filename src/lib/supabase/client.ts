import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Browser Supabase client (anon key; RLS governs access). */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
