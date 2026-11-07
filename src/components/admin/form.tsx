"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

/**
 * Small admin form primitives (English-only backoffice, ADR-0005).
 * Visible labels + aria-describedby errors (same a11y contract as the
 * public contact form, prompt-5 §5).
 */

export const labelCls = "block text-sm font-medium";
export const inputCls =
  "mt-1 w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-ring disabled:opacity-50";
export const helpCls = "mt-1 text-xs text-muted-foreground";
export const errorCls = "mt-1 text-xs text-danger-text";

export function Field({
  label,
  htmlFor,
  error,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {help && <p className={helpCls}>{help}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className={errorCls}>
          {error}
        </p>
      )}
    </div>
  );
}

type BaseProps = { id: string; label: string; error?: string; help?: string };

export function TextField({
  id,
  label,
  error,
  help,
  ...input
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} htmlFor={id} error={error} help={help}>
      <input id={id} aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${id}-error` : undefined} className={inputCls} {...input} />
    </Field>
  );
}

export function TextAreaField({
  id,
  label,
  error,
  help,
  rows = 4,
  ...area
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} htmlFor={id} error={error} help={help}>
      <textarea id={id} rows={rows} aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${id}-error` : undefined} className={inputCls} {...area} />
    </Field>
  );
}

export function SelectField({
  id,
  label,
  error,
  help,
  options,
  ...select
}: BaseProps & { options: Array<{ value: string; label: string }> } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} htmlFor={id} error={error} help={help}>
      <select id={id} aria-invalid={error ? "true" : undefined} className={inputCls} {...select}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  id,
  label,
  help,
  ...input
}: Omit<BaseProps, "error"> & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-start gap-2">
      <input id={id} type="checkbox" className="mt-1 size-4 accent-[var(--accent)]" {...input} />
      <div>
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
        {help && <p className={helpCls}>{help}</p>}
      </div>
    </div>
  );
}

/** Submit button with the form's implicit pending state (useFormStatus). */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "",
  formAction,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      name={name}
      value={value}
      formAction={formAction}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

const BADGE_TONES = {
  draft: "bg-neutral-subtle text-muted-foreground",
  published: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  accent: "bg-accent-subtle text-accent",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Sortable-table helpers (prompt-6 §3: sortable columns). */
export function SortHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: string;
  sort: { column: string; dir: "asc" | "desc" };
  onSort: (column: string) => void;
}) {
  const active = sort.column === column;
  return (
    <button
      type="button"
      onClick={() => {
        onSort(column);
      }}
      aria-label={`Sort by ${label}`}
      className={`inline-flex min-h-8 items-center gap-1 text-xs font-semibold uppercase tracking-wide ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <span aria-hidden="true" className="text-[10px]">
        {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}
