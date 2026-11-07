"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  bulkArchiveInquiries,
  purgeInquiry,
  setInquiryStatus,
} from "@/app/(admin)/admin/_actions/inquiries";
import { Badge, SortHeader } from "@/components/admin/form";
import { useToast } from "@/components/admin/toast";

export type InboxRow = {
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

const STATUSES = ["all", "unread", "read", "replied", "archived"] as const;
type Filter = (typeof STATUSES)[number];

const STATUS_TONE = {
  unread: "accent",
  read: "draft",
  replied: "published",
  archived: "draft",
} as const;

const NEXT_STATUS: Record<InboxRow["status"], InboxRow["status"][]> = {
  unread: ["read", "replied", "archived"],
  read: ["replied", "archived"],
  replied: ["read", "archived"],
  archived: ["read"],
};

const ACTION_LABELS: Record<InboxRow["status"], string> = {
  unread: "Mark unread",
  read: "Mark read",
  replied: "Mark replied",
  archived: "Archive",
};

/**
 * Full inbox (prompt-6 §3): status filter, sortable table, bulk archive,
 * per-row status transitions, mailto reply with the reference id, and the
 * delete-on-request purge (typed 8-char reference confirm — migration 0003
 * policy `inquiries_admin_delete`).
 */
export function InboxList({ rows }: { rows: InboxRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ column: string; dir: "asc" | "desc" }>({ column: "created_at", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<InboxRow | null>(null);
  const [purgeTyped, setPurgeTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => {
    const filtered = filter === "all" ? rows : rows.filter((row) => row.status === filter);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const key = sort.column as keyof InboxRow;
      const left = a[key];
      const right = b[key];
      if (sort.column === "created_at") {
        return (new Date(String(left)).getTime() - new Date(String(right)).getTime()) * dir;
      }
      if (typeof left === "number" && typeof right === "number") return (left - right) * dir;
      return String(left).localeCompare(String(right)) * dir;
    });
  }, [rows, filter, sort]);

  const unreadCount = rows.filter((row) => row.status === "unread").length;

  function onSort(column: string) {
    setSort((current) =>
      current.column === column
        ? { column, dir: current.dir === "asc" ? "desc" : "asc" }
        : { column, dir: "desc" },
    );
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function changeStatus(row: InboxRow, next: InboxRow["status"]) {
    setBusy(true);
    const result = await setInquiryStatus(row.id, next);
    setBusy(false);
    if (result.ok) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onBulkArchive() {
    if (selected.size === 0) return;
    setBusy(true);
    const result = await bulkArchiveInquiries(Array.from(selected));
    setBusy(false);
    if (result.ok) {
      toast.success(result.message ?? "Archived.");
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onPurge() {
    if (purgeTarget === null) return;
    setBusy(true);
    const result = await purgeInquiry(purgeTarget.id, purgeTyped);
    setBusy(false);
    if (result.ok) {
      toast.success(result.message ?? "Deleted.");
      setPurgeTarget(null);
      setPurgeTyped("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
        {STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => {
              setFilter(value);
            }}
            className={`min-h-9 rounded-full border px-3 py-1 text-sm capitalize transition-colors ${
              filter === value
                ? "border-accent bg-accent-subtle text-accent"
                : "border-border-subtle text-muted-foreground hover:text-foreground"
            }`}
          >
            {value}
            {value === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
        {selected.size > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void onBulkArchive();
            }}
            className="ms-auto min-h-9 rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-strong disabled:opacity-50"
          >
            Archive selected ({selected.size})
          </button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th scope="col" className="w-10 px-3 py-2">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className="px-3 py-2 text-start">
                <SortHeader label="From" column="name" sort={sort} onSort={onSort} />
              </th>
              <th scope="col" className="px-3 py-2 text-start">
                <SortHeader label="Received" column="created_at" sort={sort} onSort={onSort} />
              </th>
              <th scope="col" className="px-3 py-2 text-start">
                <SortHeader label="Status" column="status" sort={sort} onSort={onSort} />
              </th>
              <th scope="col" className="px-3 py-2 text-start">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No inquiries in this filter.
                </td>
              </tr>
            )}
            {visible.map((row) => {
              const created = new Intl.DateTimeFormat("en", {
                numberingSystem: "latn",
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(row.created_at));
              const preview = row.message.length > 120 ? `${row.message.slice(0, 120)}…` : row.message;
              return (
                <tr key={row.id} className="border-b border-border-subtle/60 align-top">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select inquiry from ${row.name}`}
                      checked={selected.has(row.id)}
                      onChange={() => {
                        toggleSelected(row.id);
                      }}
                      className="size-4 accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setExpanded((current) => (current === row.id ? null : row.id));
                      }}
                      className="text-start"
                      aria-expanded={expanded === row.id}
                    >
                      <span className="block font-medium">{row.name}</span>
                      <span className="block text-xs text-muted-foreground">{preview}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    <time dateTime={row.created_at}>{created}</time>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: your inquiry (ref ${row.id.slice(0, 8)})`)}`}
                        className="min-h-8 rounded-md border border-border-subtle px-2 py-1 text-xs hover:bg-background"
                      >
                        Reply
                      </a>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setPurgeTarget(row);
                          setPurgeTyped("");
                        }}
                        className="min-h-8 rounded-md border border-danger-text px-2 py-1 text-xs text-danger-text hover:bg-background disabled:opacity-50"
                      >
                        Purge
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded detail panels (kept out of the table for wrapping) */}
      {expanded !== null &&
        (() => {
          const row = rows.find((item) => item.id === expanded);
          if (!row) return null;
          const nextStatuses = NEXT_STATUS[row.status] ?? [];
          return (
            <div className="mt-4 rounded-xl border border-border-subtle bg-surface p-5" role="region" aria-label={`Inquiry from ${row.name}`}>
              <p className="whitespace-pre-wrap text-sm">{row.message}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Service: {row.service_interest ?? "other/unspecified"}
                {row.budget ? ` · Budget: ${row.budget}` : ""}
                {row.timeline ? ` · Timeline: ${row.timeline}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {nextStatuses.map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void changeStatus(row, next);
                    }}
                    className="min-h-9 rounded-md border border-border-subtle px-3 py-1.5 text-sm hover:bg-background disabled:opacity-50"
                  >
                    {ACTION_LABELS[next]}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

      {/* Purge confirm (typed reference, delete-on-request flow) */}
      {purgeTarget !== null && (
        <div className="mt-4 rounded-xl border border-danger-text bg-surface p-5" role="alertdialog" aria-label="Confirm permanent delete">
          <h2 className="font-semibold text-danger-text">Permanently delete this inquiry?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From <span className="font-medium">{purgeTarget.name}</span> (ref{" "}
            <span className="font-mono">{purgeTarget.id.slice(0, 8)}</span>). This removes the row
            for good — use only for delete-on-request. Type the reference to confirm.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={purgeTyped}
              onChange={(event) => {
                setPurgeTyped(event.target.value);
              }}
              placeholder={purgeTarget.id.slice(0, 8)}
              aria-label={`Type ${purgeTarget.id.slice(0, 8)} to confirm`}
              className="w-32 rounded-md border border-border-subtle bg-background px-3 py-2 font-mono text-sm"
            />
            <button
              type="button"
              disabled={busy || purgeTyped !== purgeTarget.id.slice(0, 8)}
              onClick={() => {
                void onPurge();
              }}
              className="min-h-9 rounded-md bg-danger-text px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPurgeTarget(null);
                setPurgeTyped("");
              }}
              className="min-h-9 rounded-md border border-border-subtle px-3 py-1.5 text-sm hover:bg-background"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
