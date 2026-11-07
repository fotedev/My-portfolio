"use client";

import { useState } from "react";
import { assetPublicUrl, type MediaAssetSummary } from "@/lib/admin/types";
import { Badge } from "./form";

/**
 * Single-select media picker (prompt-6 §3: projects editor picks cover image
 * from /admin/media). Keyboard-operable: each asset is a toggle button.
 */
export function MediaPicker({
  assets,
  selected,
  onSelect,
  emptyHint = "No media yet — upload images in the Media screen.",
}: {
  assets: MediaAssetSummary[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  emptyHint?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = assets.filter((asset) =>
    `${asset.alt_en} ${asset.alt_ar} ${asset.storage_path}`.toLowerCase().includes(query.toLowerCase()),
  );

  if (assets.length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">{emptyHint}</p>;
  }

  return (
    <div className="mt-2">
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        placeholder="Filter by alt text or path"
        aria-label="Filter media"
        className="w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm"
      />
      <ul className="mt-2 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
        {filtered.map((asset) => {
          const active = selected === asset.id;
          return (
            <li key={asset.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onSelect(active ? null : asset.id);
                }}
                className={`w-full rounded-lg border p-1.5 text-start transition-colors ${
                  active ? "border-accent ring-2 ring-ring" : "border-border-subtle hover:border-accent"
                }`}
              >
                {asset.media_kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only picker thumbnail; next/image adds no value here
                  <img
                    src={assetPublicUrl(asset.storage_path)}
                    alt=""
                    className="h-20 w-full rounded object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-full items-center justify-center rounded bg-neutral-subtle text-xs">
                    {asset.mime_type === "application/pdf" ? "PDF" : "File"}
                  </div>
                )}
                <span className="mt-1 block truncate text-xs text-muted-foreground" dir="ltr">
                  {asset.alt_en}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected && (
        <div className="mt-2 flex items-center gap-2">
          <Badge tone="accent">Selected</Badge>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
            }}
            className="min-h-9 rounded-md border border-border-subtle px-3 text-sm hover:bg-background"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}

/** Multi-select gallery picker (stores asset ids). */
export function GalleryPicker({
  assets,
  selected,
  onChange,
}: {
  assets: MediaAssetSummary[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const images = assets.filter((asset) => asset.media_kind === "image");
  if (images.length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">No images yet — upload in the Media screen.</p>;
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  }

  return (
    <ul className="mt-2 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
      {images.map((asset) => {
        const active = selected.includes(asset.id);
        return (
          <li key={asset.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => {
                toggle(asset.id);
              }}
              className={`w-full rounded-lg border p-1.5 text-start transition-colors ${
                active ? "border-accent ring-2 ring-ring" : "border-border-subtle hover:border-accent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only gallery thumbnail */}
              <img src={assetPublicUrl(asset.storage_path)} alt="" className="h-20 w-full rounded object-cover" />
              <span className="mt-1 block truncate text-xs text-muted-foreground" dir="ltr">
                {asset.alt_en}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
