import { redirect } from "next/navigation";
import { InquiryCard } from "@/components/admin/inquiry-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type AdminInquiry = {
  id: string;
  name: string;
  email: string;
  service_interest: string | null;
  message: string;
  budget: string | null;
  timeline: string | null;
  status: "unread" | "read" | "replied" | "archived";
  created_at: string;
};

const STATUS_STYLES: Record<AdminInquiry["status"], string> = {
  unread: "bg-accent-subtle text-accent",
  read: "bg-neutral-subtle text-muted-foreground",
  replied: "bg-success-bg text-success-text",
  archived: "bg-neutral-subtle text-muted-foreground",
};

/** Minimal auth-gated inbox (prompt-5 §6). RLS (`inquiries_admin_select`,
 * `is_admin()`) enforces the allowlist at the database level; the UI gate
 * below is defense in depth. Read-only + status updates — full CRUD is M5. */
export default async function AdminInquiriesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-muted-foreground">
          {user.email} is not on the admin allowlist.
        </p>
      </section>
    );
  }

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select(
      "id, name, email, service_interest, message, budget, timeline, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (inquiries ?? []) as AdminInquiry[];
  const unread = rows.filter((row) => row.status === "unread").length;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} total{unread > 0 ? ` · ${unread} unread` : ""}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border-subtle bg-surface p-6 text-muted-foreground">
          No inquiries yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li key={row.id}>
              <InquiryCard
                inquiry={row}
                statusStyle={STATUS_STYLES[row.status]}
                replySubject={encodeURIComponent(`Re: your inquiry (ref ${row.id.slice(0, 8)})`)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
