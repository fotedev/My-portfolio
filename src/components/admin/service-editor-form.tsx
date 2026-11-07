"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveService } from "@/app/(admin)/admin/_actions/services";
import { Badge, CheckboxField, TextField } from "@/components/admin/form";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { TagInput } from "@/components/admin/tag-input";
import { useToast } from "@/components/admin/toast";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-guard";
import type { ServiceEditorData } from "@/lib/admin/types";

type ServiceFormState = Omit<ServiceEditorData, "id">;

const EMPTY_AR = { title: "", summary: "", deliverables: [] };

/** Services editor (prompt-6 §3): key immutable on edit (inquiries FK). */
export function ServiceEditorForm({
  initial,
  isNew,
}: {
  initial: ServiceEditorData;
  isNew: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<ServiceFormState>(toFormState(initial));
  const [pending, setPending] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(toFormState(initial));
  useUnsavedChangesGuard(dirty);

  function set<K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildInput() {
    const arProvided =
      Object.values(form.translations_ar ?? {}).some(
        (value) => typeof value === "string" ? value.trim().length > 0 : (value as string[]).length > 0,
      );
    return {
      key: form.key,
      icon: form.icon ?? "",
      sort_order: form.sort_order,
      is_active: form.is_active,
      translations_en: form.translations_en,
      translations_ar: arProvided ? (form.translations_ar ?? EMPTY_AR) : null,
    };
  }

  async function submit() {
    setPending(true);
    setTopError(null);
    const result = await saveService(initial.id, buildInput());
    if (result.ok) {
      toast.success(form.is_active ? "Service saved — live on /services." : "Service saved (inactive — hidden publicly).");
      router.push("/admin/services");
      router.refresh();
    } else {
      setTopError(result.error);
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={form.is_active ? "published" : "draft"}>{form.is_active ? "active" : "inactive"}</Badge>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
      {topError && (
        <p role="alert" className="mt-4 rounded-lg bg-surface p-4 text-sm text-danger-text">
          {topError}
        </p>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <TextField
          id="service-key"
          label="Key (immutable)"
          value={form.key}
          disabled={!isNew}
          onChange={(event) => {
            set("key", event.target.value);
          }}
          help={isNew ? "Lowercase-hyphen key; the contact form's service select references it." : "Cannot be changed — inquiries reference it."}
          required
        />
        <TextField
          id="service-sort"
          label="Sort order"
          type="number"
          min={0}
          max={9999}
          value={form.sort_order}
          onChange={(event) => {
            set("sort_order", Number(event.target.value));
          }}
        />
        <TextField
          id="service-icon"
          label="Icon (optional identifier)"
          value={form.icon ?? ""}
          onChange={(event) => {
            set("icon", event.target.value);
          }}
        />
        <div className="flex items-end">
          <CheckboxField
            id="service-active"
            label="Active (visible on /services + home + contact select)"
            checked={form.is_active}
            onChange={(event) => {
              set("is_active", event.target.checked);
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
              label="Title (EN)"
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
              required
            />
            <TagInput
              id="en-deliverables"
              label="Deliverables (EN)"
              value={form.translations_en.deliverables}
              onChange={(items) => {
                set("translations_en", { ...form.translations_en, deliverables: items });
              }}
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
            <TagInput
              id="ar-deliverables"
              label="Deliverables (AR)"
              value={form.translations_ar?.deliverables ?? []}
              onChange={(items) => {
                set("translations_ar", { ...(form.translations_ar ?? EMPTY_AR), deliverables: items });
              }}
            />
          </div>
        }
      />

      <div className="mt-8 flex items-center gap-3 border-t border-border-subtle pt-6">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void submit();
          }}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function toFormState(data: ServiceEditorData): ServiceFormState {
  return {
    key: data.key,
    icon: data.icon,
    sort_order: data.sort_order,
    is_active: data.is_active,
    translations_en: data.translations_en,
    translations_ar: data.translations_ar ?? { ...EMPTY_AR },
  };
}
