import { z } from "zod";

/**
 * Admin input validation (prompt-6 §3/§4). Mirrors the SQL constraints in
 * migrations/0001 exactly so the DB never rejects what the UI accepted —
 * except the publish gate (R3), which is double-checked here for a friendly
 * error before the trigger fires.
 */

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(80, "Slug must be 80 characters or fewer")
  .regex(SLUG_RE, "Lowercase letters, numbers and single hyphens only");

export const keySchema = slugSchema; // services.key uses the same DB check

export const requiredText = (label: string, max = 5000) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const optionalText = (max = 5000) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((value) => (value.length === 0 ? null : value));

export const urlOrNull = z
  .union([z.literal(""), z.string().trim().url("Must be a valid URL").max(2048)])
  .transform((value) => (value === "" ? null : value));

export const dateOrNull = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")])
  .transform((value) => (value === "" ? null : value));

export const stringArray = z
  .array(z.string().trim().min(1).max(120))
  .max(50, "Too many entries")
  .transform((items) => Array.from(new Set(items)));

export const sortOrderSchema = z.coerce.number().int().min(0).max(9999).default(0);

// ---------------------------------------------------------------------------
// Localized translation bundles (EN always required; AR optional per en_only)
// ---------------------------------------------------------------------------

export const projectTranslationSchema = z.object({
  title: requiredText("Title", 200),
  summary: requiredText("Summary", 1000),
  problem: requiredText("Problem statement", 8000),
  solution: requiredText("Solution", 8000),
  results: optionalText(8000),
});

export const serviceTranslationSchema = z.object({
  title: requiredText("Title", 200),
  summary: requiredText("Summary", 1000),
  deliverables: stringArray,
});

export const credentialTranslationSchema = z.object({
  title: requiredText("Title", 200),
  issuer_display: requiredText("Issuer display", 200),
  summary: requiredText("Summary", 1000),
});

export const contributionTranslationSchema = z.object({
  title: requiredText("Title", 300),
  summary: requiredText("Summary", 1000),
});

export const settingsTranslationSchema = z.object({
  hero_name: requiredText("Hero name", 120),
  hero_role: requiredText("Hero role", 160),
  hero_offer: requiredText("Hero offer", 400),
  availability_text: requiredText("Availability text", 160),
});

// ---------------------------------------------------------------------------
// Entity input schemas (what the editors submit)
// ---------------------------------------------------------------------------

export const projectInputSchema = z.object({
  slug: slugSchema,
  is_featured: z.boolean().default(false),
  en_only: z.boolean().default(false),
  sort_order: sortOrderSchema,
  tech_stack: stringArray,
  repo_url: urlOrNull,
  live_url: urlOrNull,
  cover_asset_id: z.union([z.literal(""), z.string().uuid()]).transform((v) => (v === "" ? null : v)),
  gallery: z.array(z.string().uuid()).max(20).default([]),
  translations_en: projectTranslationSchema,
  translations_ar: projectTranslationSchema.nullable(),
});

export const serviceInputSchema = z.object({
  key: keySchema,
  icon: optionalText(80),
  sort_order: sortOrderSchema,
  is_active: z.boolean().default(true),
  translations_en: serviceTranslationSchema,
  translations_ar: serviceTranslationSchema.nullable(),
});

export const credentialInputSchema = z.object({
  kind: z.enum(["certificate", "award", "program"]),
  recipient_name: requiredText("Recipient name", 200),
  issued_at: dateOrNull,
  credential_id: optionalText(200),
  verification_url: urlOrNull,
  proof_url: z.string().trim().url("A proof URL is required").max(2048),
  asset_media_id: z.union([z.literal(""), z.string().uuid()]).transform((v) => (v === "" ? null : v)),
  asset_url: urlOrNull,
  sort_order: sortOrderSchema,
  en_only: z.boolean().default(false),
  translations_en: credentialTranslationSchema,
  translations_ar: credentialTranslationSchema.nullable(),
});

export const contributionInputSchema = z.object({
  repo: z
    .string()
    .trim()
    .min(1, "Repository is required")
    .max(200)
    .regex(/^[\w.-]+\/[\w.-]+$/, "Use owner/repo (e.g. nextjs/next.js)"),
  number: z.coerce.number().int().min(1).max(1_000_000),
  kind: z.enum(["pr", "issue"]),
  status: z.enum(["merged", "open", "acknowledged"]),
  your_role: requiredText("Your role", 200),
  related_number: z
    .union([z.literal(""), z.coerce.number().int().min(1)])
    .transform((v) => (v === "" ? null : v)),
  event_date: dateOrNull,
  verification_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Verification date is required (YYYY-MM-DD)"),
  proof_url: z.string().trim().url("A proof URL is required").max(2048),
  sort_order: sortOrderSchema,
  is_published: z.boolean().default(false),
  translations_en: contributionTranslationSchema,
  translations_ar: contributionTranslationSchema.nullable(),
});

export const settingsInputSchema = z.object({
  contact_email: z.string().trim().email("A valid email is required").max(254),
  availability_status: z.enum(["available", "unavailable"]),
  cv_url: urlOrNull,
  socials: z
    .array(
      z.object({
        platform: requiredText("Platform", 60),
        url: z.string().trim().url("Must be a valid URL").max(2048),
      }),
    )
    .max(10, "At most 10 social links")
    .default([]),
  translations_en: settingsTranslationSchema,
  translations_ar: settingsTranslationSchema,
});

export const mediaMetaSchema = z.object({
  alt_en: requiredText("Alt text (English)", 500),
  alt_ar: requiredText("Alt text (Arabic)", 500),
  is_private: z.boolean().default(false),
});

export const inquiryStatusSchema = z.enum(["unread", "read", "replied", "archived"]);

// ---------------------------------------------------------------------------
// Publish gate (R3, CONTENT-MODEL): publishing requires an AR translation
// unless the row is explicitly en_only. Returns a user-facing message or null.
// ---------------------------------------------------------------------------

export type PublishableInput = { en_only: boolean; translations_ar: unknown };

/**
 * Which AR translation fields are REQUIRED before publish, per entity.
 * Optional fields (e.g. project `results`) may stay empty — R3 only demands
 * a usable Arabic translation, not a complete mirror of the English copy.
 */
const REQUIRED_AR_FIELDS: Record<"project" | "credential", readonly string[]> = {
  project: ["title", "summary", "problem", "solution"],
  credential: ["title", "issuer_display", "summary"],
};

export type PublishGateKind = keyof typeof REQUIRED_AR_FIELDS;

export function validatePublish(
  kind: PublishGateKind,
  input: PublishableInput,
  isPublishing: boolean,
): string | null {
  if (!isPublishing || input.en_only) return null;
  const ar = input.translations_ar;
  const values =
    ar !== null && typeof ar === "object" ? (ar as Record<string, unknown>) : null;
  const present =
    values !== null &&
    REQUIRED_AR_FIELDS[kind].every((field) => {
      const value = values[field];
      return typeof value === "string" && value.trim().length > 0;
    });
  if (!present) {
    return "Publishing requires an Arabic translation — fill the AR tab or switch the row to English-only.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// slug util (filenames + fallback slugs) — R3 slug format compatible
// ---------------------------------------------------------------------------

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}
