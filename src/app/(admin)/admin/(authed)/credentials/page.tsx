import Link from "next/link";
import { Badge } from "@/components/admin/form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Credentials — Admin" };

/** Credentials list — rows link to editors (status = publish gate). */
export default async function AdminCredentialsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("credentials")
    .select("id, kind, status, sort_order, issued_at, credential_id, verification_url, translations:credential_translations(locale, title)")
    .order("sort_order");
  if (error) throw error;

  type Row = {
    id: string;
    kind: string;
    status: string;
    sort_order: number;
    issued_at: string | null;
    credential_id: string | null;
    verification_url: string | null;
    translations: Array<{ locale: string; title: string }>;
  };

  const rows = (data ?? []) as unknown as Row[];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Credentials</h1>
        <Link
          href="/admin/credentials/new"
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-strong"
        >
          New credential
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border-subtle bg-surface p-6 text-muted-foreground">
          No credentials yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => {
            const pendingVerification =
              row.issued_at === null || row.credential_id === null || row.verification_url === null;
            return (
              <li key={row.id} className="rounded-xl border border-border-subtle bg-surface p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/admin/credentials/${row.id}`}
                    className="font-medium text-accent underline-offset-4 hover:underline"
                  >
                    {row.translations.find((tr) => tr.locale === "en")?.title ?? "(untitled)"}
                  </Link>
                  <Badge tone={row.status === "published" ? "published" : "draft"}>{row.status}</Badge>
                  <span className="rounded-full bg-neutral-subtle px-2.5 py-0.5 text-xs uppercase text-muted-foreground">
                    {row.kind}
                  </span>
                  {pendingVerification && (
                    <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs text-warning-text">
                      TO VERIFY fields pending
                    </span>
                  )}
                  <span className="ms-auto" />
                  <Link
                    href={`/admin/credentials/${row.id}`}
                    className="min-h-9 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs hover:bg-background"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
