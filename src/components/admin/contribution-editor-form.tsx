"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDraftContribution, saveContribution } from "@/app/(admin)/admin/_actions/contributions";
import { Badge, CheckboxField, SelectField, TextField } from "@/components/admin/form";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { useToast } from "@/components/admin/toast";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-guard";
import type { ContributionEditorData } from "@/lib/admin/types";

type ContributionFormState = Omit<ContributionEditorData, "id" | "is_published">;

const EMPTY_AR = { title: "", summary: "" };

/**
 * Contributions editor (prompt-6 §3). The claim status is a semantic lock:
 * merged | open | acknowledged — never "fixed" (superseded PRs surface via
 * related_number). `is_published` is the publish toggle; verification_date +
 * proof_url are required (no invented claims).
 */
export function ContributionEditorForm({
  initial,
  isNew,
  isPublished,
}: {
  initial: ContributionEditorData;
  isNew: boolean;
  isPublished: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<ContributionFormState>(toFormState(initial));
  const [published, setPublished] = useState(isPublished);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  const dirty = JSON.stringify({ ...form, is_published: published }) !== JSON.stringify(toFormState({ ...initial, is_published: isPublished }));
  useUnsavedChangesGuard(dirty);

  function set<K extends keyof ContributionFormState>(key: K, value: ContributionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildInput() {
    const arProvided =
      Object.values(form.translations_ar ?? {}).some((value) => value.trim().length > 0);
    return {
      repo: form.repo,
      number: form.number,
      kind: form.kind,
      status: form.status,
      your_role: form.your_role,
      related_number: form.related_number,
      event_date: form.event_date,
      verification_date: form.verification_date,
      proof_url: form.proof_url,
      sort_order: form.sort_order,
      is_published: published,
      translations_en: form.translations_en,
      translations_ar: arProvided ? (form.translations_ar ?? EMPTY_AR) : null,
    };
  }

  async function submit() {
    setPending("save");
    setTopError(null);
    const result = await saveContribution(initial.id, buildInput());
    if (result.ok) {
      toast.success(published ? "Saved — contribution is live on /about." : "Saved (unpublished).");
      router.push("/admin/contributions");
      router.refresh();
    } else {
      setTopError(result.error);
      toast.error(result.error);
      setPending(null);
    }
  }

  async function onDelete() {
    if (initial.id === null) return;
    if (!window.confirm("Delete this draft contribution permanently?")) return;
    setPending("delete");
    const result = await deleteDraftContribution(initial.id);
    setPending(null);
    if (result.ok) {
      toast.info("Draft deleted.");
      router.push("/admin/contributions");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={published ? "published" : "draft"}>{published ? "published" : "draft"}</Badge>
        <Badge tone={form.status === "merged" ? "published" : "warning"}>{form.status}</Badge>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
      {topError && (
        <p role="alert" className="mt-4 rounded-lg bg-surface p-4 text-sm text-danger-text">
          {topError}
        </p>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <TextField
          id="contribution-repo"
          label="Repository (owner/name)"
          value={form.repo}
          dir="ltr"
          onChange={(event) => {
            set("repo", event.target.value);
          }}
          placeholder="vercel/next.js"
          required
        />
        <TextField
          id="contribution-number"
          label="PR / issue number"
          type="number"
          min={1}
          value={form.number}
          onChange={(event) => {
            set("number", event.target.value === "" ? "" : Number(event.target.value));
          }}
          required
        />
        <SelectField
          id="contribution-kind"
          label="Kind"
          value={form.kind}
          options={[
            { value: "pr", label: "Pull request" },
            { value: "issue", label: "Issue" },
          ]}
          onChange={(event) => {
            set("kind", event.target.value as ContributionFormState["kind"]);
          }}
        />
        <SelectField
          id="contribution-status"
          label="Claim status (semantic lock)"
          value={form.status}
          options={[
            { value: "merged", label: "Merged" },
            { value: "open", label: "Open" },
            { value: "acknowledged", label: "Acknowledged (vendor confirmed, not merged)" },
          ]}
          onChange={(event) => {
            set("status", event.target.value as ContributionFormState["status"]);
          }}
          help="Never 'fixed' — vendor-acknowledged disclosures stay acknowledged."
        />
        <TextField
          id="contribution-role"
          label="Your role"
          value={form.your_role}
          onChange={(event) => {
            set("your_role", event.target.value);
          }}
          required
        />
        <TextField
          id="contribution-related"
          label="Related number (optional)"
          type="number"
          min={1}
          value={form.related_number}
          onChange={(event) => {
            set("related_number", event.target.value === "" ? "" : Number(event.target.value));
          }}
          help="Superseding PR — e.g. the merged PR that salvaged a closed issue."
        />
        <TextField
          id="contribution-event"
          label="Event date (merge / vendor-ack; empty while open)"
          type="date"
          value={form.event_date}
          onChange={(event) => {
            set("event_date", event.target.value);
          }}
        />
        <TextField
          id="contribution-verification"
          label="Verification date (required)"
          type="date"
          value={form.verification_date}
          onChange={(event) => {
            set("verification_date", event.target.value);
          }}
          help="The date you last verified the proof URL resolves."
          required
        />
        <TextField
          id="contribution-proof"
          label="Proof URL (required)"
          type="url"
          value={form.proof_url}
          onChange={(event) => {
            set("proof_url", event.target.value);
          }}
          required
        />
        <TextField
          id="contribution-sort"
          label="Sort order"
          type="number"
          min={0}
          max={9999}
          value={form.sort_order}
          onChange={(event) => {
            set("sort_order", Number(event.target.value));
          }}
        />
        <div className="flex items-end">
          <CheckboxField
            id="contribution-published"
            label="Published (visible on /about)"
            checked={published}
            onChange={(event) => {
              setPublished(event.target.checked);
            }}
          />
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Content</h2>
      <LocaleTabs
        en={
          <div className="grid gap-5">
            <TextField
              id="en-title"
              label="Title (EN) — verbatim GitHub title"
              value={form.translations_en.title}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, title: event.target.value });
              }}
              required
            />
            <TextField
              id="en-summary"
              label="Summary (EN)"
              value={form.translations_en.summary}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, summary: event.target.value });
              }}
              help="One-liner; merged rows carry the salvage lineage."
              required
            />
          </div>
        }
        ar={
          <div className="grid gap-5">
            <TextField
              id="ar-title"
              label="Title (AR)"
              value={form.translations_ar?.title ?? ""}
              onChange={(event) => {
                set("translations_ar", { ...(form.translations_ar ?? EMPTY_AR), title: event.target.value });
              }}
              required
            />
            <TextField
              id="ar-summary"
              label="Summary (AR)"
              value={form.translations_ar?.summary ?? ""}
              onChange={(event) => {
                set("translations_ar", { ...(form.translations_ar ?? EMPTY_AR), summary: event.target.value });
              }}
              required
            />
          </div>
        }
      />

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => {
            void submit();
          }}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {pending === "save" ? "Saving…" : "Save"}
        </button>
        {!isNew && !published && (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => {
              void onDelete();
            }}
            className="ms-auto min-h-11 rounded-md border border-danger-text px-4 py-2 text-sm text-danger-text hover:bg-background disabled:opacity-50"
          >
            {pending === "delete" ? "Deleting…" : "Delete draft"}
          </button>
        )}
      </div>
    </form>
  );
}

function toFormState(data: ContributionEditorData): ContributionFormState {
  return {
    repo: data.repo,
    number: data.number,
    kind: data.kind,
    status: data.status,
    your_role: data.your_role,
    related_number: data.related_number,
    event_date: data.event_date,
    verification_date: data.verification_date,
    proof_url: data.proof_url,
    sort_order: data.sort_order,
    translations_en: data.translations_en,
    translations_ar: data.translations_ar ?? { ...EMPTY_AR },
  };
}
