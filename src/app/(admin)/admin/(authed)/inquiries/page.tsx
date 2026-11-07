import { InboxList, type InboxRow } from "@/components/admin/inbox-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inquiries — Admin" };

/** Full inbox (prompt-6 §3): filter, bulk archive, purge, mailto reply. */
export default async function AdminInquiriesPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("inquiries")
    .select("id, name, email, service_interest, message, budget, timeline, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = (data ?? []) as unknown as InboxRow[];

  return (
    <section>
      <h1 className="text-2xl font-semibold">Inquiries</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length} loaded (newest 100) — the delete-on-request purge removes a row permanently.
      </p>
      <div className="mt-6">
        <InboxList rows={rows} />
      </div>
    </section>
  );
}
