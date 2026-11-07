"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteMedia, uploadMedia } from "@/app/(admin)/admin/_actions/media";
import { Badge, Field } from "@/components/admin/form";
import { useToast } from "@/components/admin/toast";
import { assetPublicUrl, type MediaAssetSummary } from "@/lib/admin/types";

const IMAGE_MAX = 2 * 1024 * 1024;
const PDF_MAX = 10 * 1024 * 1024;
const CLIENT_ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/avif", "application/pdf"];

/**
 * Media screen (prompt-6 §3/§6): uploader with client MIME+size checks
 * (magic-byte sniffing happens server-side too — declared Content-Type is
 * never trusted) + alt EN/AR required before upload; grid with delete
 * (referenced assets are blocked server-side).
 */
export function MediaManager({ assets }: { assets: MediaAssetSummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [altEn, setAltEn] = useState("");
  const [altAr, setAltAr] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function validateClient(file: File): string | null {
    if (!CLIENT_ALLOWED.includes(file.type)) {
      return `Not an allowed type (${file.type || "unknown"}). Use PNG, JPEG, WEBP, AVIF or PDF.`;
    }
    const limit = file.type === "application/pdf" ? PDF_MAX : IMAGE_MAX;
    if (file.size > limit) {
      return `Too large (${Math.ceil(file.size / 1024)} KB) — limit ${Math.ceil(limit / 1024)} KB.`;
    }
    return null;
  }

  async function onUpload() {
    setClientError(null);
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setClientError("Choose a file first.");
      return;
    }
    const clientProblem = validateClient(file);
    if (clientProblem) {
      setClientError(clientProblem);
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt_en", altEn);
    formData.set("alt_ar", altAr);
    formData.set("is_private", String(isPrivate));

    setPending(true);
    const result = await uploadMedia(formData);
    setPending(false);
    if (result.ok) {
      toast.success("Uploaded.");
      setAltEn("");
      setAltAr("");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function onDelete(asset: MediaAssetSummary) {
    if (!window.confirm(`Delete "${asset.alt_en}" permanently (removes the stored object)?`)) return;
    setBusyId(asset.id);
    const result = await deleteMedia(asset.id);
    setBusyId(null);
    if (result.ok) {
      toast.info("Deleted.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="rounded-xl border border-border-subtle bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <h2 className="text-lg font-semibold">Upload</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <Field label="File (image ≤ 2 MB · PDF ≤ 10 MB)" htmlFor="media-file" error={clientError ?? undefined}>
            <input
              id="media-file"
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,application/pdf"
              className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm file:me-3 file:rounded file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-sm"
            />
          </Field>
          <div className="grid gap-4">
            <Field label="Alt text (English)" htmlFor="media-alt-en">
              <input
                id="media-alt-en"
                value={altEn}
                onChange={(event) => {
                  setAltEn(event.target.value);
                }}
                className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                required
              />
            </Field>
            <Field label="Alt text (Arabic)" htmlFor="media-alt-ar">
              <input
                id="media-alt-ar"
                dir="rtl"
                value={altAr}
                onChange={(event) => {
                  setAltAr(event.target.value);
                }}
                className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
                required
              />
            </Field>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => {
              setIsPrivate(event.target.checked);
            }}
            className="size-4 accent-[var(--accent)]"
          />
          Private (hidden from anon reads — e.g. unreleased assets)
        </label>
        <div className="mt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              void onUpload();
            }}
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
          >
            {pending ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-semibold">
          Library <span className="text-sm font-normal text-muted-foreground">({assets.length})</span>
        </h2>
        {assets.length === 0 ? (
          <p className="mt-4 rounded-xl border border-border-subtle bg-surface p-6 text-muted-foreground">
            No media yet.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <li key={asset.id} className="rounded-xl border border-border-subtle bg-surface p-3">
                {asset.media_kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin library thumbnail
                  <img src={assetPublicUrl(asset.storage_path)} alt={asset.alt_en} className="h-28 w-full rounded object-cover" />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded bg-neutral-subtle text-sm">
                    {asset.mime_type === "application/pdf" ? "PDF" : "File"}
                  </div>
                )}
                <p className="mt-2 truncate text-xs" dir="ltr" title={asset.alt_en}>
                  {asset.alt_en}
                </p>
                <p className="truncate text-xs text-muted-foreground" dir="rtl" title={asset.alt_ar}>
                  {asset.alt_ar}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {asset.is_private && <Badge tone="warning">private</Badge>}
                  <button
                    type="button"
                    disabled={busyId === asset.id}
                    onClick={() => {
                      void onDelete(asset);
                    }}
                    className="ms-auto min-h-8 rounded-md border border-danger-text px-2 py-1 text-xs text-danger-text hover:bg-background disabled:opacity-50"
                  >
                    {busyId === asset.id ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
