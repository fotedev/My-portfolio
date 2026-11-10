"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSettings } from "@/app/(admin)/admin/_actions/settings";
import { SelectField, TextField } from "@/components/admin/form";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { useToast } from "@/components/admin/toast";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-guard";
import type { SettingsEditorData } from "@/lib/admin/types";

type SettingsFormState = SettingsEditorData;

/**
 * Settings editor (prompt-6 §3): email, availability, CV, socials, hero EN/AR.
 * Schema note: "contact copy" is not part of the site_settings contract —
 * that copy lives in the app's message files (logged in the PR).
 */
export function SettingsEditorForm({ initial }: { initial: SettingsEditorData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<SettingsFormState>(initial);
  const [pending, setPending] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChangesGuard(dirty);

  function set<K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setHero(
    locale: "translations_en" | "translations_ar",
    field: keyof SettingsFormState["translations_en"],
    value: string,
  ) {
    setForm((current) => ({ ...current, [locale]: { ...current[locale], [field]: value } }));
  }

  async function submit() {
    setPending(true);
    setTopError(null);
    const result = await saveSettings(form);
    if (result.ok) {
      toast.success("Settings saved — public pages revalidated.");
      router.refresh();
      setPending(false);
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
      {topError && (
        <p role="alert" className="rounded-lg bg-surface p-4 text-sm text-danger-text">
          {topError}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          id="settings-email"
          label="Contact email"
          type="email"
          dir="ltr"
          value={form.contact_email}
          onChange={(event) => {
            set("contact_email", event.target.value);
          }}
          required
        />
        <SelectField
          id="settings-availability"
          label="Availability"
          value={form.availability_status}
          options={[
            { value: "available", label: "Available for new projects" },
            { value: "unavailable", label: "Unavailable" },
          ]}
          onChange={(event) => {
            set("availability_status", event.target.value as SettingsFormState["availability_status"]);
          }}
        />
        <TextField
          id="settings-cv"
          label="CV URL (optional)"
          type="url"
          value={form.cv_url ?? ""}
          onChange={(event) => {
            set("cv_url", event.target.value);
          }}
        />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Social links</h2>
      <ul className="mt-3 space-y-2">
        {form.socials.map((social, index) => (
          <li key={index} className="flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface p-3">
            <div className="min-w-40 flex-1">
              <TextField
                id={`social-platform-${index}`}
                label="Platform"
                value={social.platform}
                onChange={(event) => {
                  const next = [...form.socials];
                  next[index] = { ...social, platform: event.target.value };
                  set("socials", next);
                }}
              />
            </div>
            <div className="min-w-60 flex-[2]">
              <TextField
                id={`social-url-${index}`}
                label="URL"
                type="url"
                dir="ltr"
                value={social.url}
                onChange={(event) => {
                  const next = [...form.socials];
                  next[index] = { ...social, url: event.target.value };
                  set("socials", next);
                }}
              />
            </div>
            <button
              type="button"
              aria-label={`Remove ${social.platform || "social link"}`}
              onClick={() => {
                set("socials", form.socials.filter((_, i) => i !== index));
              }}
              className="min-h-11 rounded-md border border-danger-text px-3 text-sm text-danger-text hover:bg-background"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          set("socials", [...form.socials, { platform: "", url: "" }]);
        }}
        className="mt-3 min-h-11 rounded-md border border-border-subtle px-4 py-2 text-sm hover:bg-background"
      >
        Add social link
      </button>

      <h2 className="mt-8 text-lg font-semibold">Hero + availability copy</h2>
      <div className="mt-3">
        <LocaleTabs
          en={
            <div className="grid gap-5">
              {(Object.keys(form.translations_en) as Array<keyof typeof form.translations_en>).map((field) => (
                <TextField
                  key={field}
                  id={`en-${field}`}
                  label={{
                    hero_name: "Hero name (EN)",
                    hero_role: "Hero role (EN)",
                    hero_offer: "Hero offer (EN)",
                    availability_text: "Availability text (EN)",
                  }[field]}
                  value={form.translations_en[field]}
                  onChange={(event) => {
                    setHero("translations_en", field, event.target.value);
                  }}
                  required
                />
              ))}
            </div>
          }
          ar={
            <div className="grid gap-5">
              {(Object.keys(form.translations_ar) as Array<keyof typeof form.translations_ar>).map((field) => (
                <TextField
                  key={field}
                  id={`ar-${field}`}
                  label={
                    {
                      hero_name: "Hero name (AR)",
                      hero_role: "Hero role (AR)",
                      hero_offer: "Hero offer (AR)",
                      availability_text: "Availability text (AR)",
                    }[field]
                  }
                  value={form.translations_ar[field]}
                  onChange={(event) => {
                    setHero("translations_ar", field, event.target.value);
                  }}
                  required
                />
              ))}
            </div>
          }
        />
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-border-subtle pt-6">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void submit();
          }}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </form>
  );
}
