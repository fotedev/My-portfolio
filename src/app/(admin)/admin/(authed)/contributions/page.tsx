import Link from "next/link";
import { Badge } from "@/components/admin/form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contributions — Admin" };

/** Contributions list — claim status pills + publish gate. */
export default async function AdminContributionsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("contributions")
    .select("id, repo, number, kind, status, is_published, verification_date, proof_url, translations:contribution_translations(locale, title)")
    .order("sort_order");
  if (error) throw error;

  type Row = {
    id: string;
    repo: string;
    number: number;
    kind: string;
    status: string;
    is_published: boolean;
    verification_date: string;
    proof_url: string;
    translations: Array<{ locale: string; title: string }>;
  };

  const rows = (data ?? []) as unknown as Row[];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Contributions</h1>
        <Link
          href="/admin/contributions/new"
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-strong"
        >
          New contribution
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border-subtle bg-surface p-6 text-muted-foreground">
          No contributions yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link
                  href={`/admin/contributions/${row.id}`}
                  className="font-medium text-accent underline-offset-4 hover:underline"
                >
                  {row.translations.find((tr) => tr.locale === "en")?.title ?? "(untitled)"}
                </Link>
                <Badge tone={row.is_published ? "published" : "draft"}>
                  {row.is_published ? "published" : "draft"}
                </Badge>
                <Badge tone={row.status === "merged" ? "published" : "warning"}>{row.status}</Badge>
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                  {row.repo}#{row.number} ({row.kind})
                </span>
                <span className="ms-auto" />
                <Link
                  href={`/admin/contributions/${row.id}`}
                  className="min-h-9 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs hover:bg-background"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
