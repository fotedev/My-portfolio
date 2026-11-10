"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDraftProject, saveProject, unpublishProject } from "@/app/(admin)/admin/_actions/projects";
import { Badge, CheckboxField, TextField } from "@/components/admin/form";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { GalleryPicker, MediaPicker } from "@/components/admin/media-picker";
import { TagInput } from "@/components/admin/tag-input";
import { useToast } from "@/components/admin/toast";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-guard";
import type { MediaAssetSummary, ProjectEditorData } from "@/lib/admin/types";

type ProjectFormState = Omit<ProjectEditorData, "id" | "status">;

const EMPTY_AR = { title: "", summary: "", problem: "", solution: "", results: "" };

/**
 * Projects editor (prompt-6 §3): structured fields + EN/AR tabs, media
 * picker, draft/publish split, unsaved-changes guard. Server actions do the
 * validation + gate-ordered writes; this form only collects and surfaces.
 */
export function ProjectEditorForm({
  initial,
  isNew,
  status,
  assets,
}: {
  initial: ProjectEditorData;
  isNew: boolean;
  status: "draft" | "published";
  assets: MediaAssetSummary[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<ProjectFormState>(toFormState(initial));
  const [pending, setPending] = useState<"draft" | "publish" | "unpublish" | "delete" | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(toFormState(initial));
  useUnsavedChangesGuard(dirty);

  function set<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildInput() {
    const arProvided =
      !form.en_only &&
      Object.values(form.translations_ar ?? {}).some((value) => value.trim().length > 0);
    return {
      slug: form.slug,
      is_featured: form.is_featured,
      en_only: form.en_only,
      sort_order: form.sort_order,
      tech_stack: form.tech_stack,
      repo_url: form.repo_url ?? "",
      live_url: form.live_url ?? "",
      cover_asset_id: form.cover_asset_id ?? "",
      gallery: form.gallery,
      translations_en: form.translations_en,
      translations_ar: arProvided ? (form.translations_ar ?? EMPTY_AR) : null,
    };
  }

  async function submit(intent: "draft" | "publish") {
    setPending(intent);
    setTopError(null);
    const result = await saveProject(initial.id, intent, buildInput());
    if (result.ok) {
      toast.success(
        intent === "publish"
          ? "Published — public pages revalidated on demand."
          : "Draft saved. Use Preview to check it before publishing.",
      );
      router.push("/admin/projects");
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
    const result = await unpublishProject(initial.id);
    setPending(null);
    if (result.ok) {
      toast.info("Unpublished — the case study is no longer public (published_at is preserved).");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onDelete() {
    if (initial.id === null) return;
    if (!window.confirm("Delete this draft permanently?")) return;
    setPending("delete");
    const result = await deleteDraftProject(initial.id);
    setPending(null);
    if (result.ok) {
      toast.info("Draft deleted.");
      router.push("/admin/projects");
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
        {!isNew && (
          <Link
            href={`/admin/preview/projects/${form.slug}`}
            className="text-sm text-accent underline underline-offset-4"
          >
            Open draft preview ↗
          </Link>
        )}
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
      {topError && (
        <p role="alert" className="mt-4 rounded-lg bg-surface p-4 text-sm text-danger-text">
          {topError}
        </p>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <TextField
          id="project-slug"
          label="Slug"
          value={form.slug}
          onChange={(event) => {
            set("slug", event.target.value);
          }}
          help="Lowercase letters, numbers, hyphens. /en/projects/<slug> — renaming a published project leaves a 301 redirect."
          required
        />
        <TextField
          id="project-sort"
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
          id="project-live"
          label="Live URL"
          type="url"
          value={form.live_url ?? ""}
          onChange={(event) => {
            set("live_url", event.target.value);
          }}
          placeholder="https://…"
        />
        <TextField
          id="project-repo"
          label="Repository URL"
          type="url"
          value={form.repo_url ?? ""}
          onChange={(event) => {
            set("repo_url", event.target.value);
          }}
          help="Leave empty for private-repo case studies — the public page shows the 'Private production repo' pill."
        />
        <div className="flex flex-col gap-3 md:col-span-2">
          <CheckboxField
            id="project-featured"
            label="Featured on the home page"
            checked={form.is_featured}
            onChange={(event) => {
              set("is_featured", event.target.checked);
            }}
          />
          <CheckboxField
            id="project-en-only"
            label="English-only (skip Arabic translation)"
            help="Publishing without Arabic requires this flag (R3). The public AR page falls back to English copy."
            checked={form.en_only}
            onChange={(event) => {
              set("en_only", event.target.checked);
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TagInput
            id="project-tech"
            label="Tech stack"
            value={form.tech_stack}
            onChange={(tags) => {
              set("tech_stack", tags);
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
              id="en-summary"
              label="Summary (EN)"
              value={form.translations_en.summary}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, summary: event.target.value });
              }}
              help="Shown on cards and the page intro."
              required
            />
            <TextField
              id="en-problem"
              label="Problem (EN)"
              value={form.translations_en.problem}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, problem: event.target.value });
              }}
              required
            />
            <TextField
              id="en-solution"
              label="Solution (EN)"
              value={form.translations_en.solution}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, solution: event.target.value });
              }}
              required
            />
            <TextField
              id="en-results"
              label="Results (EN, optional)"
              value={form.translations_en.results}
              onChange={(event) => {
                set("translations_en", { ...form.translations_en, results: event.target.value });
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
            <TextField
              id="ar-problem"
              label="Problem (AR)"
              value={form.translations_ar?.problem ?? ""}
              onChange={(event) => {
                set("translations_ar", { ...(form.translations_ar ?? EMPTY_AR), problem: event.target.value });
              }}
              required
            />
            <TextField
              id="ar-solution"
              label="Solution (AR)"
              value={form.translations_ar?.solution ?? ""}
              onChange={(event) => {
                set("translations_ar", { ...(form.translations_ar ?? EMPTY_AR), solution: event.target.value });
              }}
              required
            />
            <TextField
              id="ar-results"
              label="Results (AR, optional)"
              value={form.translations_ar?.results ?? ""}
              onChange={(event) => {
                set("translations_ar", { ...(form.translations_ar ?? EMPTY_AR), results: event.target.value });
              }}
            />
          </div>
        }
      />

      <h2 className="mt-8 text-lg font-semibold">Media</h2>
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium">Cover image</p>
          <MediaPicker
            assets={assets.filter((asset) => asset.media_kind === "image")}
            selected={form.cover_asset_id}
            onSelect={(id) => {
              set("cover_asset_id", id);
            }}
          />
        </div>
        <div>
          <p className="text-sm font-medium">Gallery</p>
          <GalleryPicker
            assets={assets}
            selected={form.gallery}
            onChange={(ids) => {
              set("gallery", ids);
            }}
          />
        </div>
      </div>

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
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-strong disabled:opacity-60"
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

function toFormState(data: ProjectEditorData): ProjectFormState {
  return {
    slug: data.slug,
    is_featured: data.is_featured,
    en_only: data.en_only,
    sort_order: data.sort_order,
    tech_stack: data.tech_stack,
    repo_url: data.repo_url,
    live_url: data.live_url,
    cover_asset_id: data.cover_asset_id,
    gallery: data.gallery,
    translations_en: data.translations_en,
    translations_ar: data.translations_ar ?? (data.en_only ? null : { ...EMPTY_AR }),
  };
}
