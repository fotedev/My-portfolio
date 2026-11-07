import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardStats = {
  unreadInquiries: number;
  totalInquiries: number;
  publishedProjects: number;
  draftProjects: number;
  activeServices: number;
  publishedCredentials: number;
  publishedContributions: number;
  mediaAssets: number;
};

/** Dashboard home (prompt-6 §3): unread count + quick stats, links into each screen. */
export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [
    unread,
    totalInquiries,
    publishedProjects,
    allProjects,
    activeServices,
    publishedCredentials,
    publishedContributions,
    mediaAssets,
  ] = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "unread"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("credentials")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("contributions")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("media_assets").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      href: "/admin/inquiries",
      label: "Unread inquiries",
      value: unread.count ?? 0,
      detail: `${totalInquiries.count ?? 0} total`,
    },
    {
      href: "/admin/projects",
      label: "Published case studies",
      value: publishedProjects.count ?? 0,
      detail: `${(allProjects.count ?? 0) - (publishedProjects.count ?? 0)} draft(s)`,
    },
    {
      href: "/admin/services",
      label: "Active services",
      value: activeServices.count ?? 0,
      detail: "live on /services",
    },
    {
      href: "/admin/credentials",
      label: "Published credentials",
      value: publishedCredentials.count ?? 0,
      detail: "live on /about",
    },
    {
      href: "/admin/contributions",
      label: "Published contributions",
      value: publishedContributions.count ?? 0,
      detail: "live on /about",
    },
    {
      href: "/admin/media",
      label: "Media assets",
      value: mediaAssets.count ?? 0,
      detail: "images + PDFs",
    },
  ];

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edits here go live after publish — public pages revalidate on demand (prompt-6 §4).
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.href}>
            <Link
              href={stat.href}
              className="block rounded-xl border border-border-subtle bg-surface p-5 transition-colors hover:border-accent"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
