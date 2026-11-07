import type { Database } from "@/lib/supabase/database.types";

/** Shared admin editor types (server pages → client forms). */

export type MediaAssetSummary = {
  id: string;
  storage_path: string;
  mime_type: string;
  media_kind: Database["public"]["Enums"]["media_kind"];
  alt_en: string;
  alt_ar: string;
  is_private?: boolean;
};

export type TranslationValues = Record<string, string>;

export type ProjectEditorData = {
  id: string | null;
  status: "draft" | "published";
  slug: string;
  is_featured: boolean;
  en_only: boolean;
  sort_order: number;
  tech_stack: string[];
  repo_url: string | null;
  live_url: string | null;
  cover_asset_id: string | null;
  gallery: string[];
  translations_en: { title: string; summary: string; problem: string; solution: string; results: string };
  translations_ar: { title: string; summary: string; problem: string; solution: string; results: string } | null;
};

export type ServiceEditorData = {
  id: string | null;
  key: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  translations_en: { title: string; summary: string; deliverables: string[] };
  translations_ar: { title: string; summary: string; deliverables: string[] } | null;
};

export type CredentialEditorData = {
  id: string | null;
  status: "draft" | "published";
  kind: "certificate" | "award" | "program";
  recipient_name: string;
  issued_at: string;
  credential_id: string;
  verification_url: string;
  proof_url: string;
  asset_media_id: string | null;
  asset_url: string;
  sort_order: number;
  en_only: boolean;
  translations_en: { title: string; issuer_display: string; summary: string };
  translations_ar: { title: string; issuer_display: string; summary: string } | null;
};

export type ContributionEditorData = {
  id: string | null;
  is_published: boolean;
  repo: string;
  number: number | "";
  kind: "pr" | "issue";
  status: "merged" | "open" | "acknowledged";
  your_role: string;
  related_number: number | "";
  event_date: string;
  verification_date: string;
  proof_url: string;
  sort_order: number;
  translations_en: { title: string; summary: string };
  translations_ar: { title: string; summary: string } | null;
};

export type SettingsEditorData = {
  contact_email: string;
  availability_status: "available" | "unavailable";
  cv_url: string;
  socials: Array<{ platform: string; url: string }>;
  translations_en: { hero_name: string; hero_role: string; hero_offer: string; availability_text: string };
  translations_ar: { hero_name: string; hero_role: string; hero_offer: string; availability_text: string };
};

/** Public URL for an asset in the public-assets bucket. */
export function assetPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/public-assets/${storagePath}`;
}
