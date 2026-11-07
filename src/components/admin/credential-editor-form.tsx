"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDraftCredential, saveCredential, unpublishCredential } from "@/app/(admin)/admin/_actions/credentials";
import { Badge, CheckboxField, SelectField, TextField } from "@/components/admin/form";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { useToast } from "@/components/admin/toast";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-guard";
import type { CredentialEditorData, MediaAssetSummary } from "@/lib/admin/types";

type CredentialFormState = Omit<CredentialEditorData, "id" | "status">;

const EMPTY_AR = { title: "", issuer_display: "", summary: "" };

/**
 * Credentials editor (prompt-6 §3). TO VERIFY fields (issued_at,
 * credential_id, verification_url) stay null/empty until Ahmed supplies
 * verified values — the public page omits them when empty (no invented
 * claims). The certificate PDF is picked from Media.
 */
export function CredentialEditorForm({
  initial,
  isNew,
  status,
  assets,
}: {
  initial: CredentialEditorData;
  isNew: boolean;
  status: "draft" | "published";
  assets: MediaAssetSummary[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<CredentialFormState>(toFormState(initial));
  const [pending, setPending] = useState<"draft" | "publish" | "unpublish" | "delete" | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(toFormState(initial));
  useUnsavedChangesGuard(dirty);

  function set<K extends keyof CredentialFormState>(key: K, value: CredentialFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildInput() {
    const arProvided =
      !form.en_only &&
      Object.values(form.translations_ar ?? {}).some((value) => value.trim().length > 0);
    return {
      kind: form.kind,
      recipient_name: form.recipient_name,
      issued_at: form.issued_at,
      credential_id: form.credential_id ?? "",
      verification_url: form.verification_url ?? "",
      proof_url: form.proof_url,
      asset_media_id: form.asset_media_id ?? "",
      asset_url: form.asset_url ?? "",
      sort_order: form.sort_order,
      en_only: form.en_only,
      translations_en: form.translations_en,
      translations_ar: arProvided ? (form.translations_ar ?? EMPTY_AR) : null,
    };
  }

  async function submit(intent: "draft" | "publish") {
    setPending(intent);
    setTopError(null);
    const result = await saveCredential(initial.id, intent, buildInput());
    if (result.ok) {
      toast.success(intent === "publish" ? "Published — /about revalidated." : "Draft saved.");
      router.push("/admin/credentials");
      router.refresh();
    } else {
      setTopError(result.error);
      toast.error(result.error);
      setPending(null);
    }
  }

  async function onUnpublish() {
    if (initial.id === null) return;
    setPending("unpublish");
    const result = await unpublishCredential(initial.id);
    setPending(null);
    if (result.ok) {
      toast.info("Unpublished — hidden from /about (published_at preserved).");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onDelete() {
    if (initial.id === null) return;
    if (!window.confirm("Delete this draft credential permanently?")) return;
    setPending("delete");
    const result = await deleteDraftCredential(initial.id);
    setPending(null);
    if (result.ok) {
      toast.info("Draft deleted.");
      router.push("/admin/credentials");
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
        <Badge tone={status === "published" ? "published" : "draft"}>{status}</Badge>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
      {topError && (
        <p role="alert" className="mt-4 rounded-lg bg-surface p-4 text-sm text-danger-text">
          {topError}
        </p>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <SelectField
          id="credential-kind"
          label="Kind"
          value={form.kind}
          options={[
            { value: "certificate", label: "Certificate" },
            { value: "award", label: "Award" },
            { value: "program", label: "Program" },
          ]}
          onChange={(event) => {
            set("kind", event.target.value as CredentialFormState["kind"]);
          }}
        />
        <TextField
          id="credential-recipient"
          label="Recipient name"
          value={form.recipient_name}
          onChange={(event) => {
            set("recipient_name", event.target.value);
          }}
          required
        />
        <TextField
          id="credential-issued"
          label="Issued at (TO VERIFY)"
          type="date"
          value={form.issued_at}
          onChange={(event) => {
            set("issued_at", event.target.value);
          }}
          help="Leave empty unless verified — never invent a date. Empty = hidden publicly."
        />
        <TextField
          id="credential-id"
          label="Credential ID (TO VERIFY)"
          value={form.credential_id ?? ""}
          onChange={(event) => {
            set("credential_id", event.target.value);
          }}
          help="Empty = hidden publicly."
        />
        <TextField
          id="credential-verify-url"
          label="Verification URL (TO VERIFY)"
          type="url"
          value={form.verification_url ?? ""}
          onChange={(event) => {
            set("verification_url", event.target.value);
          }}
          help="Empty = no verification link is shown."
        />
        <TextField
          id="credential-proof"
          label="Proof URL (required)"
          type="url"
          value={form.proof_url}
          onChange={(event) => {
            set("proof_url", event.target.value);
          }}
          help="External program page — never presented as printed verification."
          required
        />
        <TextField
          id="credential-asset-url"
          label="External asset URL (optional)"
          type="url"
          value={form.asset_url ?? ""}
          onChange={(event) => {
            set("asset_url", event.target.value);
          }}
        />
        <TextField
          id="credential-sort"
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
            id="credential-en-only"
            label="English-only (skip Arabic translation)"
            checked={form.en_only}
            onChange={(event) => {
              set("en_only", event.target.checked);
            }}
          />
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Content</h2>
      <LocaleTabs
        arDisabled={form.en_only}
        en={
          <div className="grid gap-5">
            <TextField
              id="en-title"
              label="Title (EN)"
              value={form.translations_en.title}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, title: event.target.value });
              }}
              required
            />
            <TextField
              id="en-issuer"
              label="Issuer display (EN)"
              value={form.translations_en.issuer_display}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, issuer_display: event.target.value });
              }}
              help="Logo-credits wording — never an 'issued by' legal sentence."
              required
            />
            <TextField
              id="en-summary"
              label="Summary (EN)"
              value={form.translations_en.summary}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, summary: event.target.value });
              }}
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
              id="ar-issuer"
              label="Issuer display (AR)"
              value={form.translations_ar?.issuer_display ?? ""}
              onChange={(event) => {
                set("translations_ar", { ...(form.translations_ar ?? EMPTY_AR), issuer_display: event.target.value });
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

      <h2 className="mt-8 text-lg font-semibold">Certificate asset</h2>
      <MediaPicker
        assets={assets}
        selected={form.asset_media_id}
        onSelect={(id) => {
          set("asset_media_id", id);
        }}
        emptyHint="No media yet — upload the certificate PDF in the Media screen."
      />

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => {
            void submit("draft");
          }}
          className="inline-flex min-h-11 items-center rounded-md border border-border-subtle bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-background disabled:opacity-60"
        >
          {pending === "draft" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => {
            void submit("publish");
          }}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {pending === "publish" ? "Publishing…" : "Publish"}
        </button>
        {status === "published" && (
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => {
              void onUnpublish();
            }}
            className="min-h-11 rounded-md border border-border-subtle px-4 py-2 text-sm hover:bg-background disabled:opacity-50"
          >
            {pending === "unpublish" ? "Unpublishing…" : "Unpublish"}
          </button>
        )}
        {!isNew && status === "draft" && (
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
      <p className="mt-2 text-xs text-muted-foreground">
        Save never changes visibility — use Publish to make it live, Unpublish to take it offline.
      </p>
    </form>
  );
}

function toFormState(data: CredentialEditorData): CredentialFormState {
  return {
    kind: data.kind,
    recipient_name: data.recipient_name,
    issued_at: data.issued_at,
    credential_id: data.credential_id,
    verification_url: data.verification_url,
    proof_url: data.proof_url,
    asset_media_id: data.asset_media_id,
    asset_url: data.asset_url,
    sort_order: data.sort_order,
    en_only: data.en_only,
    translations_en: data.translations_en,
    translations_ar: data.translations_ar ?? (data.en_only ? null : { ...EMPTY_AR }),
  };
}
