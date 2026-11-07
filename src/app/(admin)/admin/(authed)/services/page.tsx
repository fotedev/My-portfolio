import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Services — Admin" };

/** Services list — rows link to editors; is_active is the service "publish" gate. */
export default async function AdminServicesPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("services")
    .select("id, key, sort_order, is_active, translations:service_translations(locale, title)")
    .order("sort_order");
  if (error) throw error;

  type Row = {
    id: string;
    key: string;
    sort_order: number;
    is_active: boolean;
    translations: Array<{ locale: string; title: string }>;
  };

  const rows = (data ?? []) as unknown as Row[];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Services</h1>
        <Link
          href="/admin/services/new"
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong"
        >
          New service
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border-subtle bg-surface p-6 text-muted-foreground">
          No services yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={`/admin/services/${row.id}`} className="font-medium text-accent underline-offset-4 hover:underline">
                  {row.translations.find((tr) => tr.locale === "en")?.title ?? row.key}
                </Link>
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                  {row.key}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                    row.is_active ? "bg-success-bg text-success-text" : "bg-neutral-subtle text-muted-foreground"
                  }`}
                >
                  {row.is_active ? "active" : "inactive"}
                </span>
                <span className="ms-auto text-xs text-muted-foreground">sort {row.sort_order}</span>
                <Link
                  href={`/admin/services/${row.id}`}
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
