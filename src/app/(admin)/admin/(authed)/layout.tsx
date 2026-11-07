import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { ToastProvider } from "@/components/admin/toast";
import { AdminNotAllowedError, requireAdminPage } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Authed admin shell (prompt-6 §3): gate → sidebar + top bar with the
 * signed-in email, availability badge and sign-out. Unauthenticated visitors
 * redirect to /admin/login; non-admin sessions get the allowlist screen.
 */
export default async function AuthedAdminLayout({ children }: { children: ReactNode }) {
  let session;
  try {
    session = await requireAdminPage();
  } catch (error) {
    if (error instanceof AdminNotAllowedError) {
      return (
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-2xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-muted-foreground">
            {error.email} is signed in but is not on the admin allowlist. Ask the owner to add this
            account to <code>admin_users</code>.
          </p>
        </section>
      );
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();
  const [{ count: unreadCount }, { data: settings }] = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "unread"),
    supabase.from("site_settings").select("availability_status").eq("id", 1).maybeSingle(),
  ]);

  const available = settings?.availability_status !== "unavailable";

  return (
    <ToastProvider>
      <div className="lg:flex">
        <AdminSidebar unreadCount={unreadCount ?? 0} />
        <div className="min-w-0 flex-1">
          <header className="border-b border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="font-semibold">fotedev admin</span>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    available ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text"
                  }`}
                >
                  {available ? "Available" : "Unavailable"}
                </span>
                <span className="hidden text-sm text-muted-foreground sm:inline" dir="ltr">
                  {session.email}
                </span>
                <SignOutButton />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
