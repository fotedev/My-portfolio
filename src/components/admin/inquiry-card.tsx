"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminInquiry } from "@/app/(admin)/admin/inquiries/page";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NEXT_STATUS: Record<AdminInquiry["status"], AdminInquiry["status"][]> = {
  unread: ["read", "replied", "archived"],
  read: ["replied", "archived"],
  replied: ["read", "archived"],
  archived: ["read"],
};

const ACTION_LABELS: Record<AdminInquiry["status"], string> = {
  unread: "Mark unread",
  read: "Mark read",
  replied: "Mark replied",
  archived: "Archive",
};

/**
 * One inbox row (prompt-5 §6): preview + expandable detail, status transitions
 * (RLS `inquiries_admin_update` enforces the allowlist), and a prefilled
 * mailto reply carrying the reference id.
 */
export function InquiryCard({
  inquiry,
  statusStyle,
  replySubject,
}: {
  inquiry: AdminInquiry;
  statusStyle: string;
  replySubject: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(inquiry.status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const created = new Intl.DateTimeFormat("en", {
    numberingSystem: "latn",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(inquiry.created_at));

  async function updateStatus(next: AdminInquiry["status"]) {
    setPending(true);
    setError(false);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("inquiries")
      .update({ status: next })
      .eq("id", inquiry.id);
    setPending(false);
    if (updateError) {
      setError(true);
      return;
    }
    setStatus(next);
    router.refresh();
  }

  const preview =
    inquiry.message.length > 140 ? `${inquiry.message.slice(0, 140)}…` : inquiry.message;

  return (
    <article className="rounded-xl border border-border-subtle bg-surface p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${statusStyle}`}>
          {status}
        </span>
        <span className="font-medium">{inquiry.name}</span>
        <a href={`mailto:${inquiry.email}`} dir="ltr" className="text-sm text-accent hover:underline">
          {inquiry.email}
        </a>
        <span className="text-xs text-muted-foreground" dir="ltr">
          ref {inquiry.id.slice(0, 8)}
        </span>
        <time className="ms-auto text-xs text-muted-foreground" dateTime={inquiry.created_at}>
          {created}
        </time>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          {preview}
        </summary>
        <div className="mt-3 space-y-2 rounded-lg bg-background p-4 text-sm">
          <p className="whitespace-pre-wrap">{inquiry.message}</p>
          <p className="text-muted-foreground">
            Service: {inquiry.service_interest ?? "other/unspecified"}
            {inquiry.budget ? ` · Budget: ${inquiry.budget}` : ""}
            {inquiry.timeline ? ` · Timeline: ${inquiry.timeline}` : ""}
          </p>
        </div>
      </details>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${inquiry.email}?subject=${replySubject}`}
          className="rounded-md border border-border-subtle px-3 py-1.5 text-sm hover:bg-background"
        >
          Reply via email
        </a>
        {NEXT_STATUS[status].map((next) => (
          <button
            key={next}
            type="button"
            disabled={pending}
            onClick={() => {
              void updateStatus(next);
            }}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm hover:bg-background disabled:opacity-50"
          >
            {ACTION_LABELS[next]}
          </button>
        ))}
        {error && <span className="text-sm text-danger-text">Update failed — try again.</span>}
      </div>
    </article>
  );
}
