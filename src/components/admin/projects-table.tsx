"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteDraftProject, unpublishProject } from "@/app/(admin)/admin/_actions/projects";
import { Badge, SortHeader } from "@/components/admin/form";
import { useToast } from "@/components/admin/toast";

export type ProjectRow = {
  id: string;
  slug: string;
  status: "draft" | "published";
  is_featured: boolean;
  sort_order: number;
  updated_at: string;
  title: string;
};

/**
 * Sortable projects table (prompt-6 §3: sortable columns, ≥20 rows/page —
 * the library is small; pagination is added when it exceeds 20 rows).
 * Unpublish/delete are draft-safe server actions (RLS-gated).
 */
export function ProjectsTable({ rows }: { rows: ProjectRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [sort, setSort] = useState<{ column: string; dir: "asc" | "desc" }>({ column: "sort_order", dir: "asc" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const key = sort.column as keyof ProjectRow;
      const left = a[key];
      const right = b[key];
      if (typeof left === "number" && typeof right === "number") return (left - right) * dir;
      return String(left).localeCompare(String(right)) * dir;
    });
  }, [rows, sort]);

  function onSort(column: string) {
    setSort((current) =>
      current.column === column
        ? { column, dir: current.dir === "asc" ? "desc" : "asc" }
        : { column, dir: "asc" },
    );
  }

  async function onUnpublish(row: ProjectRow) {
    setBusyId(row.id);
    const result = await unpublishProject(row.id);
    setBusyId(null);
    if (result.ok) {
      toast.info(`Unpublished "${row.slug}" — the public page now 404s.`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onDelete(row: ProjectRow) {
    if (!window.confirm(`Delete draft "${row.slug}" permanently?`)) return;
    setBusyId(row.id);
    const result = await deleteDraftProject(row.id);
    setBusyId(null);
    if (result.ok) {
      toast.info("Draft deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-start">
            <th scope="col" className="py-2 pe-4 text-start">
              <SortHeader label="Title" column="title" sort={sort} onSort={onSort} />
            </th>
            <th scope="col" className="py-2 pe-4 text-start">
              <SortHeader label="Slug" column="slug" sort={sort} onSort={onSort} />
            </th>
            <th scope="col" className="py-2 pe-4 text-start">
              <SortHeader label="Status" column="status" sort={sort} onSort={onSort} />
            </th>
            <th scope="col" className="py-2 pe-4 text-start">
              <SortHeader label="Sort" column="sort_order" sort={sort} onSort={onSort} />
            </th>
            <th scope="col" className="py-2 pe-4 text-start">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-border-subtle/60">
              <td className="py-3 pe-4">
                <Link href={`/admin/projects/${row.id}`} className="font-medium text-accent underline-offset-4 hover:underline">
                  {row.title || "(untitled)"}
                </Link>
                {row.is_featured && (
                  <span className="ms-2 rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent">featured</span>
                )}
              </td>
              <td className="py-3 pe-4 font-mono text-xs" dir="ltr">
                {row.slug}
              </td>
              <td className="py-3 pe-4">
                <Badge tone={row.status === "published" ? "published" : "draft"}>{row.status}</Badge>
              </td>
              <td className="py-3 pe-4">{row.sort_order}</td>
              <td className="py-3 pe-4">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/preview/projects/${row.slug}`}
                    className="min-h-9 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs hover:bg-background"
                  >
                    Preview
                  </Link>
                  {row.status === "published" ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => {
                        void onUnpublish(row);
                      }}
                      className="min-h-9 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs hover:bg-background disabled:opacity-50"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => {
                        void onDelete(row);
                      }}
                      className="min-h-9 rounded-md border border-danger-text px-2.5 py-1.5 text-xs text-danger-text hover:bg-background disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
