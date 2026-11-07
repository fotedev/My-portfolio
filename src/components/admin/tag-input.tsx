"use client";

import { useState } from "react";
import { useUnsavedChangesGuard } from "./unsaved-guard";

/**
 * Comma/newline → tag list input (tech stack, deliverables). Controlled:
 * value is the array, presented as removable chips + a text field.
 */
export function TagInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Type and press Enter or comma",
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const parts = raw
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...value, ...parts]));
    onChange(next.slice(0, 50));
    setDraft("");
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => {
                    onChange(value.filter((item) => item !== tag));
                  }}
                  className="rounded-full hover:text-foreground"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          if (next.endsWith(",") || next.endsWith("\n")) {
            commit(next);
          } else {
            setDraft(next);
          }
        }}
        onBlur={(event) => {
          commit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
          }
        }}
        className="mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

/** Dirty-state helper for editors (shared with the unsaved-changes guard). */
export function useDirtyGuard(dirty: boolean) {
  useUnsavedChangesGuard(dirty);
}
