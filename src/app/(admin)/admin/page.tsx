import { createServerClient } from "@supabase/ssr";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Admin home stub (M2). Real dashboard arrives in M5. */
export default async function AdminHomePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server components cannot set cookies; middleware refreshes sessions.
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect("/admin/login");
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Signed in</h1>
      <p className="mt-2 text-muted-foreground">
        {user.email} — dashboard ships in M5 (projects, services, credentials, inbox, settings).
      </p>
    </section>
  );
}
