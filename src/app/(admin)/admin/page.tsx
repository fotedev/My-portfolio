import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Admin home (M2 shell + M4 hardening): session AND allowlist enforced. */
export default async function AdminHomePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect("/admin/login");
  }

  // Defense in depth with the proxy gate: RLS enforces the allowlist for
  // data; this screen also refuses non-admins outright.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-muted-foreground">
          {user.email} is signed in but is not on the admin allowlist. Ask the owner to add this
          account to <code>admin_users</code>.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Signed in</h1>
      <p className="mt-2 text-muted-foreground">
        {user.email} — inbox is live at{" "}
        <Link href="/admin/inquiries" className="text-accent underline underline-offset-4">
          /admin/inquiries
        </Link>
        ; full CRUD (projects, services, credentials, settings) ships in M5.
      </p>
    </section>
  );
}
