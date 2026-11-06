# CONTENT-MODEL — Database Content Model (`fotedev.me`)

**Status:** Spec for Milestone 1 (Supabase schema, RLS, seed). This document is the contract that `supabase/migrations/0001_initial_schema.sql` and `supabase/seed.sql` implement.
**Sources of truth:** `prompt-0.md` §2 (locked decisions), `prompt-1.md` §5.4 (content requirements), `prompt-2.md` §4–§7 (M1 implementation context), `docs/CONTENT-EVIDENCE.md` (every seeded factual claim).
**Hard rule:** Nothing may be seeded or published unless it has a verified row in `docs/CONTENT-EVIDENCE.md`. Open PRs are labeled **open**; vendor-acknowledged disclosures are labeled **acknowledged** — never "merged", never "fixed".

---

## 1. Conventions

| Convention | Value |
|---|---|
| Primary keys | `uuid not null default gen_random_uuid()` unless stated otherwise |
| Timestamps | `timestamptz` (UTC). Calendar-only dates from evidence use `date`. |
| `created_at` | `timestamptz not null default now()` on every table |
| `updated_at` | `timestamptz not null default now()`, maintained by a shared `set_updated_at()` trigger |
| Locales | `locale text not null check (locale in ('en','ar'))` |
| Slugs | `text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')` — lowercase kebab-case |
| Enum types | `content_status ('draft','published')` · `availability ('available','unavailable')` · `contribution_status ('merged','open','acknowledged')` · `contribution_kind ('pr','issue')` · `inquiry_status ('unread','read','replied','archived')` · `media_kind ('image','document','other')` |
| Translations | Every localized table is `<base>_translations` with FK `<base>_id → <base>(id) on delete cascade` and `unique (base_id, locale)` |
| RLS | Enabled on every table (Section 8 states intent; M1 writes the SQL) |

**Publishing fields:** base tables that carry editorial status get `status content_status not null default 'draft'` and `published_at timestamptz null` — set once on the first transition to `published`, never reset by unpublish.

---

## 2. `site_settings` — singleton (language-independent)

One row only. Holds everything the public site renders globally that does not vary by language.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `smallint` | PK, `default 1`, `check (id = 1)` — singleton |
| `contact_email` | `text not null` | Public contact address. Seed: `fote.engineer@gmail.com` (evidence: profile README "Connect"). Admin-editable; no WhatsApp/Calendly/booking fields exist (locked decision). |
| `availability_status` | `availability not null default 'available'` | Drives the availability badge. Localized wording lives in `_translations.availability_text`. Seed: `available` (for-hire). |
| `cv_url` | `text null` | Delivery URL of the CV PDF in `public-assets`. Seed: `null` — **no verified CV exists yet; do not invent one.** |
| `socials` | `jsonb not null default '[]'` | `check (jsonb_typeof(socials) = 'array')`. Ordered array of `{ "platform": string, "url": string, "handle": string? }`. Platform keys validated admin-side against the allowlist `github, linkedin, x, telegram, youtube, facebook, instagram`. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

### 2.1 `site_settings_translations`

| Column | Type | Constraints / Notes |
|---|---|---|
| `site_settings_id` | `smallint not null` | FK `site_settings(id) on delete cascade` |
| `locale` | `text` | `'en' \| 'ar'`, `unique (site_settings_id, locale)` |
| `hero_name` | `text not null` | Displayed name. Seed: `Ahmed Aboalayoun` in both locales — the Arabic personal name is **not verified, do not invent** (flag for Ahmed at GATE 2). |
| `hero_role` | `text not null` | Role line. Seed (draft, marked `SEED — replace at GATE 2 review`): EN `Full-Stack AI Engineer`. |
| `hero_offer` | `text not null` | One-line offer. Seed (locked initial copy): EN `Web applications and AI tools built around your business.` / AR `تطبيقات ويب وأدوات ذكاء اصطناعي مبنية حول عملك.` |
| `availability_text` | `text not null` | Localized availability sentence rendered from `availability_status`. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

**Seed `socials` (verbatim from `CONTENT-EVIDENCE.md`, verified 2026-11-06):** GitHub `https://github.com/fotedev` · LinkedIn `https://www.linkedin.com/in/fotedev` · X `https://x.com/FoteTeam` · Telegram `https://t.me/ACYRO0016K` · YouTube `https://www.youtube.com/channel/UCmfp_B-hOFq4UW5g1T4LCvQ` (strip the `?sub_confirmation=1` badge parameter). Facebook and Instagram rows are optional footer-only entries (`facebook.com/profile.php?id=61558539080140`, `instagram.com/devtech.team/`).

---

## 3. `projects` — case studies (language-independent)

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `slug` | `text not null` | Unique + kebab check. **Immutable after publish** (Rule R6); changes require a `slug_redirects` row. |
| `status` | `content_status not null default 'draft'` | Seed: `draft` until content review passes (M1 §6.5). |
| `published_at` | `timestamptz null` | Set on first publish. |
| `is_featured` | `boolean not null default false` | Featured on Home "Selected Work". |
| `sort_order` | `integer not null default 0` | Display ordering (Rule R5). |
| `en_only` | `boolean not null default false` | Publish-gate bypass (Rule R3). |
| `tech_stack` | `text[] not null default '{}'` | Supporting detail only — never the lead of any card (PRODUCT §6 rule). |
| `repo_url` | `text null` | Verified repository URL. |
| `live_url` | `text null` | Verified demo URL (e.g. `https://masarx.vercel.app` for Masar X). |
| `cover_image_url` | `text null` | Denormalized delivery URL for static rendering. |
| `cover_asset_id` | `uuid null` | FK `media_assets(id)`. CHECK: `cover_image_url is not null ⇒ cover_asset_id is not null` — every cover must be an alt-governed media asset. |
| `gallery` | `jsonb null` | `check (gallery is null or jsonb_typeof(gallery) = 'array')`. Ordered array of `{ "media_asset_id": uuid, "url": string, "sort": int }`. Every `media_asset_id` must exist and satisfy the alt rule (admin-enforced; seed-verified). |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

### 3.1 `project_translations`

| Column | Type | Constraints / Notes |
|---|---|---|
| `project_id` | `uuid not null` | FK `projects(id) on delete cascade` |
| `locale` | `text` | `unique (project_id, locale)` |
| `title` | `text not null` | |
| `summary` | `text not null` | One-line card summary. |
| `problem` | `text not null` | **Verification-backed only** — every factual claim traces to a `CONTENT-EVIDENCE.md` row. Unverifiable numbers are omitted, never rounded up. |
| `solution` | `text not null` | Same rule. |
| `results` | `text null` | Same rule; may be empty if no honest results statement is supportable. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

**Indexes:** `projects (status)`, `projects (sort_order)`, unique on `slug`, `project_translations (project_id, locale)` unique.
**Seed:** only case studies approved at GATE 1 (candidates per evidence: `Masar-x-next` strong; `ghost` strong-with-framing-caveat — Ahmed's call; `context` weak; `khalat` blocked as-is). All seeded as `status='draft'`, EN+AR, honest wording, no invented latency/scale claims.

---

## 4. `services` — exactly 3 (language-independent)

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `key` | `text not null` | Unique, lowercase-kebab, **immutable after creation** (referenced by inquiries). Seed keys: `web-apps`, `ai-doc-tools`, `workflow-automation`. |
| `icon` | `text null` | Icon identifier from the design-system icon set (no emoji). |
| `sort_order` | `integer not null default 0` | Fixed order per PRODUCT §6: 1 web apps, 2 AI document tools, 3 workflow automation. |
| `is_active` | `boolean not null default true` | Publish gate: anon visibility requires `is_active = true` (see §8 reconciliation note). |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

### 4.1 `service_translations`

| Column | Type | Constraints / Notes |
|---|---|---|
| `service_id` | `uuid not null` | FK `services(id) on delete cascade` |
| `locale` | `text` | `unique (service_id, locale)` |
| `title` | `text not null` | Deliverables-first card title. |
| `summary` | `text not null` | Card body — leads with what the client receives, never a tech list. |
| `deliverables` | `text[] not null default '{}'` | Ordered list of included deliverables (arrays, not a tech-badge soup). |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

**Seed (all copy is draft, marked `SEED — replace at GATE 2 review`, EN+AR from PRODUCT §6):**
1. `web-apps` — Web applications & dashboards (production app, real data, roles, handover).
2. `ai-doc-tools` — AI knowledge & document tools (semantic search/Q&A with citations and access control).
3. `workflow-automation` — Workflow automation & integrations (sync, alerts, scheduled jobs, API integrations).

---

## 5. `credentials` — certificates & programs (language-independent)

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `kind` | `text not null default 'certificate'` | `check (kind in ('certificate','award','program'))` |
| `recipient_name` | `text not null` | Verbatim from the source document. Seed: `Ahmed Aboalyoun` (Latin script, exactly as printed on the PDF). |
| `issued_at` | `date null` | **`TO VERIFY` — no date is printed anywhere on the certificate PDF. Seed `null`. The site must not state an issue date until verified.** |
| `credential_id` | `text null` | **`TO VERIFY` — none printed on the PDF. Seed `null`.** |
| `verification_url` | `text null` | **`TO VERIFY` — a QR code is printed but its target is unresolved. Seed `null`.** |
| `proof_url` | `text not null` | External reference. Seed: `https://dub.ai/omp` — cited as the **program page** (provided by Ahmed; not printed on the PDF, never presented as a printed verification link). |
| `asset_media_id` | `uuid null` | FK `media_assets(id)` — the uploaded certificate PDF (`public-assets/certificates/omp-certificate.pdf`). |
| `asset_url` | `text null` | Delivery URL of the asset. |
| `sort_order` | `integer not null default 0` | |
| `status` | `content_status not null default 'draft'` | Seed `draft` until Ahmed confirms the entry at GATE 2. |
| `published_at` | `timestamptz null` | |
| `en_only` | `boolean not null default false` | Rule R3. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

### 5.1 `credential_translations`

| Column | Type | Constraints / Notes |
|---|---|---|
| `credential_id` | `uuid not null` | FK `credentials(id) on delete cascade` |
| `locale` | `text` | `unique (credential_id, locale)` |
| `title` | `text not null` | Seed: EN `1 MILLION PROMPTERS — Certificate of Completion` (program name and "شهادة إتمام" header are printed on the PDF; Arabic title written fresh). |
| `issuer_display` | `text not null` | **Verbatim-from-PDF wording, rendered as logo credits — never an "issued by" legal sentence** (the PDF prints only logo wordmarks, no issuer sentence). Seed EN: `Dubai Future Foundation · Dubai Centre for Artificial Intelligence`; seed AR: `مؤسسة دبي للمستقبل · مركز دبي للذكاء الاصطناعي` — fresh wording (Arabic DCAI text not verbatim in the PDF extract). |
| `summary` | `text not null` | Fresh-written localized summary. **Not auto-translated PDF text.** The Arabic qualification wording on the PDF is possibly OCR-imperfect («تتمكين», «وبالتالي مع المنظمة الشامل») — it is not quoted verbatim on the site until spot-checked against the PDF. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

---

## 6. `contributions` — OSS & security contributions (language-independent)

One row per **publishable artifact**. When a fix was salvaged, the merged PR is the canonical row and the superseded PR appears only in `related_number` / the note — the superseded PR is never published as its own row and never labeled "merged".

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `repo` | `text not null` | `owner/name`, e.g. `NousResearch/hermes-agent`, `MiniMax-AI/minimax-code`. |
| `number` | `integer not null` | PR or issue number. `unique (repo, number)`. |
| `kind` | `contribution_kind not null` | `pr` or `issue`. |
| `status` | `contribution_status not null` | `merged` \| `open` \| `acknowledged`. **Semantic lock:** open stays open; acknowledged never becomes "fixed"/"resolved" without a new evidence row; closed-unmerged is never "merged". |
| `your_role` | `text not null` | Language-independent role key, e.g. `author`, `salvage-credited-author`, `reporter-responsible-disclosure`. |
| `related_number` | `integer null` | Salvage lineage. Seed for the merged row: `109834` (closed as superseded; the fix was salvaged into merged PR #114809 with an attributed commit). |
| `event_date` | `date null` | Status-defining event: merge date for `merged`, vendor-acknowledgement date for `acknowledged`, `null` for `open`. |
| `verification_date` | `date not null` | Date the status was verified live (evidence log date: `2026-11-06` at seed authoring; M1 re-checks at seed time). |
| `proof_url` | `text not null` | Verified PR/issue/comment URL. |
| `sort_order` | `integer not null default 0` | |
| `is_published` | `boolean not null default false` | Publish gate. This table cannot use `content_status` — its `status` column already carries the claim status. Anon visibility requires `is_published = true`. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

### 6.1 `contribution_translations`

| Column | Type | Constraints / Notes |
|---|---|---|
| `contribution_id` | `uuid not null` | FK `contributions(id) on delete cascade` |
| `locale` | `text` | `unique (contribution_id, locale)` |
| `title` | `text not null` | Verbatim GitHub title, read live at seed time (M1 re-checks). |
| `summary` | `text not null` | Localized one-liner for the credibility section. For the merged row it must carry the honest lineage: *"closed as superseded; the fix was salvaged into merged PR #114809 with an attributed commit — authorship preserved"*. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

**Indexes:** `(status)`, `(verification_date)`, unique `(repo, number)`.
**Seed (all rows `is_published = true` — each carries a verified status and `verification_date`; M1 re-verifies live at seed time):**

| repo | number | kind | status | note |
|---|---|---|---|---|
| `NousResearch/hermes-agent` | 114809 | pr | `merged` | Salvage of #109834 (commit `74f75fe` authored by `fotedev`; #114809 body credits "Salvages #109834 (@fotedev) — source hunk, earliest filer"); merged 2026-09-18. `related_number = 109834`, `event_date = 2026-09-18`. |
| `NousResearch/hermes-agent` | 106626 | pr | `open` | `fix(gateway): prefer session model override in /usage billing route` (last updated 2026-10-17). |
| `NousResearch/hermes-agent` | 122144 | pr | `open` | `fix(windows): respawn gateway on the venv interpreter …` (last updated 2026-10-17). |
| `MiniMax-AI/minimax-code` | 141 | issue | `acknowledged` | Vendor acknowledgement 2026-09-21 by collaborator `hetaoBackend`; issue closed 2026-10-19 as `not_planned`, no fix PR referenced. **Never label "fixed" or "resolved".** |

---

## 7. `media_assets`, `inquiries`, `rate_limit_counters`

### 7.1 `media_assets`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `bucket` | `text not null` | Seed/only value: `public-assets`. |
| `storage_path` | `text not null` | Path inside the bucket, e.g. `certificates/omp-certificate.pdf`. `unique (bucket, storage_path)`. |
| `media_kind` | `media_kind not null default 'image'` | |
| `mime_type` | `text not null` | Must be in the Storage bucket whitelist (images ≤ 2 MB, PDFs ≤ 10 MB; executables/HTML rejected at upload). Declared Content-Type alone is insufficient — require content-based validation (magic-byte check) or restrictive serving headers (`X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` for PDFs); executables/HTML are never served inline. |
| `size_bytes` | `bigint not null` | `check (size_bytes > 0)` |
| `alt_en` | `text not null` | Rule R4: **all** assets require alt text in both locales (DB-enforced, superset of the image rule). |
| `alt_ar` | `text not null` | Arabic alt, written fresh — not machine-flipped English. |
| `is_private` | `boolean not null default false` | Anon SELECT excludes private rows (metadata only; object access is governed by Storage bucket policies). |
| `uploaded_by` | `uuid null` | FK `auth.users(id) on delete set null` — the admin who uploaded. |
| `created_at` / `updated_at` | `timestamptz` | per conventions |

**Seed:** one row for the certificate PDF (`certificates/omp-certificate.pdf`, `media_kind='document'`, public). If the Storage upload fails in M1, fall back to `public/certificates/` in the repo and say so explicitly at the gate (open decision).

### 7.2 `inquiries`

Contact-form submissions. Written **only** by the Edge Function using the service role (M4). Anonymous inserts are denied by RLS.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text not null` | `check (char_length(name) between 1 and 200)` |
| `email` | `text not null` | `check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and char_length(email) <= 254)` |
| `service_interest` | `text null` | FK `services(key) on delete set null` (services.key is unique + immutable). Holds one of the 3 service keys; null = no selection. |
| `message` | `text not null` | `check (char_length(message) between 1 and 5000)`. Treated as data, never executed (prompt-injection guard). |
| `budget` | `text null` | Optional free-text band, ≤ 200 chars. |
| `timeline` | `text null` | Optional free-text band, ≤ 200 chars. |
| `ip_hash` | `text not null` | Salted SHA-256 hex (`check (char_length(ip_hash) = 64)`). **Raw IPs are never stored** (locked decision). |
| `submission_token` | `text null unique` | Client-generated idempotency token (double-submit dedupe, M4 flow). |
| `status` | `inquiry_status not null default 'unread'` | Admin lifecycle: `unread → read → replied` (or `archived`). |
| `created_at` | `timestamptz not null default now()` | Indexed; drives the inbox ordering and retention. |
| `updated_at` | `timestamptz` | per conventions |

**No `ip`, `user_agent`, or attachment columns.** Attachments are rejected outright (oversized/attachment-bearing payloads fail validation).
**Concurrent duplicate POSTs:** a second POST with the same `submission_token` hits the unique constraint; the Edge Function catches the conflict and returns the same idempotent success (dedupe) — never a 500. `check_and_increment_rate_limit` must be atomic (a single SQL statement or transaction) under parallel calls.
**Retention:** 24 months, then purge (retention policy documented from M1; the purge script is delivered in M4, when inquiries start flowing); delete-on-request honored.

### 7.3 `rate_limit_counters`

Persistent fixed-window counters backing the contact rate limit. Service-role only.

| Column | Type | Constraints / Notes |
|---|---|---|
| `key` | `text not null` | Scope-prefixed identifier: `net:<ip_hash>`, `email:<lowercased email>`, `global:daily`. |
| `window_start` | `timestamptz not null` | UTC fixed-window boundary. |
| `count` | `integer not null default 0` | `check (count between 0 and 100000)`. |
| PK | — | `(key, window_start)` composite. |

**Function intent (M1 implements):** `check_and_increment_rate_limit(p_key text, p_window_seconds int, p_max int) returns boolean` — `SECURITY DEFINER`, fixed `search_path`, `execute` granted to `service_role` only. Starting limits (configurable via env/settings): **3 per 10 minutes per network-identifier hash**, **5 per email per day**, **50 global per day**. Counters older than ~2 days are purgeable. If the counter is corrupt or the window resets, the function fails closed (reject), never open.

---

## 8. RLS intent (per table)

> This section states **intent**. M1 (`prompt-2.md` §4–§5) implements it in SQL and proves it with `supabase/tests/rls_verification.sql` against anon and admin sessions.
>
> **Admin definition:** `authenticated` users restricted to Ahmed's allowlist — either a constant `auth.uid()` check or a small `admin_users (user_id uuid primary key)` table. Recommended: `admin_users` (no hard-coded UUID in policy SQL); the choice is recorded as ADR-0007. Anonymous users have **no** write access to any table.

| Table | anon (public) | Edge Function (service role) | Admin (allowlisted authenticated) |
|---|---|---|---|
| `site_settings` / `_translations` | `SELECT` the singleton (contains only public fields) | read | full |
| `projects` / `_translations` | `SELECT` where base `status = 'published'` (join-safe via base predicate) | read | full |
| `services` / `_translations` | `SELECT` where base `is_active = true` | read | full |
| `credentials` / `_translations` | `SELECT` where base `status = 'published'` | read | full |
| `contributions` / `_translations` | `SELECT` where base `is_published = true` | read | full |
| `media_assets` | `SELECT` where `is_private = false` | read | full |
| `inquiries` | **nothing** — `SELECT` denied/empty; `INSERT` **denied** (anonymous inserts are a locked-decision violation) | `INSERT` only (after Turnstile verify + rate limit) | `SELECT`, `UPDATE` (status transitions) |
| `rate_limit_counters` | **nothing** | read/execute via the `SECURITY DEFINER` function | no direct need (write access may be admin-only for debugging) |
| `slug_redirects` | `SELECT` (used server-side to resolve 301s) | read | full |
| `posts` / `_translations` (deferred) | RLS enabled, no anon policies | none | full (schema-only, zero usage) |

**Reconciliation notes for the Schema Architect (M1):**
1. `prompt-2.md` §4.4 groups services under "`status='published'`"; this model uses `is_active` as the services publish gate (per the locked requirement "icon, sort_order, is_active"). The anon predicate for services is `is_active = true`.
2. `contributions` uses `is_published` instead of `content_status` because its `status` column already means merged|open|acknowledged.
3. Translations inherit visibility from their base row (policies check the base `status`/`is_active`/`is_published`), so a translation can never leak a draft.
4. Verification matrix (M1 must produce SQL proof): anon SELECT published project → 1 row; anon SELECT draft → 0 rows; anon INSERT inquiry → denied; admin full access; rate-limit function allows up to limit then blocks and resets; anon cannot read `rate_limit_counters`.

---

## 9. Content rules

- **R1 — Base vs translations.** Language-independent fields (slugs, URLs, status, ordering, arrays of identifiers, dates, evidence fields) live on the base table. Everything a visitor reads in prose lives in `_translations`. Never duplicate a localized string on the base table.
- **R2 — Fallback.** If a translation for the active locale (`ar`) is missing, render the English (`en`) value and emit a server-side log event (`model=fallback, table, row_id, locale=ar`) — no user PII in logs. Fallback is a safety net, not a publishing state.
- **R3 — Publish gate.** `status = 'published'` requires an `ar` translation to exist, **or** `en_only = true` explicitly set on the base row. Enforced at admin save (and recommended as a validation trigger in M1). No silent partial publishes.
- **R4 — Alt text.** Every `media_assets` row requires `alt_en` and `alt_ar` (`NOT NULL`, DB-enforced). Project covers and gallery entries must reference a `media_assets` row, so no image can render without alt text in both locales.
- **R5 — Ordering.** Lists render ordered by `sort_order` ascending; ties break by `created_at` then `id`. `sort_order` is stable across locales (it is a base-table field).
- **R6 — Slug immutability.** `projects.slug` (and any future public slug) is immutable after publish. If a slug must change: unpublish → change → the old slug gets a row in `slug_redirects(from_slug unique, to_slug, created_at)` → publish. Middleware/route layer serves **301** from `from_slug` to `to_slug`. Orphaned redirects (target slug gone) are flagged in admin.
- **R7 — Verification-backed content only.** Every factual claim (projects, contributions, credentials) traces to a row in `docs/CONTENT-EVIDENCE.md` with a verification date and source URL. `TO VERIFY` fields are seeded `null` and the UI **omits** them — never renders a placeholder like "N/A" or an assumed date. Unverifiable numbers are omitted, never approximated.
- **R8 — Honest status labels.** `merged`, `open`, `acknowledged` are the only contribution statuses. Changing a status requires re-verification first (new evidence date), never the reverse.
- **R9 — Published lifecycle.** `published_at` is set on the first publish and survives unpublish/republish. Drafts are never cached publicly (ISR + auth-gated preview, per ARCHITECTURE).
- **R10 — Immutability of references.** `services.key` is immutable after creation (inquiries FK onto it). Contribution identity (`repo`, `number`, `kind`) is immutable after publish.
- **R11 — Retention & privacy.** Inquiries are purged after 24 months; delete-on-request is honored; only `ip_hash` (salted SHA-256) is ever stored — no raw IPs, no user agents.
- **R12 — Fail closed.** If a write path (inquiry insert, counter increment) cannot complete, it fails closed; the public site stays cached and readable (ARCHITECTURE quota behavior).

---

## 10. Deferred (explicit non-goals in v1)

| Item | v1 state |
|---|---|
| `posts` / `posts_translations` | **Schema may exist** (minimal: base `id, slug unique, status content_status, published_at, en_only` + translations `title, excerpt, body`) — but **zero seed rows, zero UI, zero routes**. If M1 creates it, RLS is enabled and anon policies grant nothing. |
| Testimonials | No tables. Revisit only when genuine client quotes exist (locked non-goal). |
| Client accounts / multiple roles | No tables. Single admin (Ahmed), structured editing only (locked decision). |
| `schema_migrations` | Housekeeping table created by the M1 migration tooling, not part of the content model. |

---

## 11. Open items carried to GATE 2

1. Arabic personal name for `hero_name` — not verified; seed uses the Latin "Ahmed Aboalayoun" in both locales until Ahmed supplies the Arabic.
2. Certificate `issued_at`, `credential_id`, `verification_url` — all `TO VERIFY` (QR target unresolved).
3. CV — no verified CV file exists; `cv_url` stays `null`.
4. Case-study selection (Masar X / ghost framing / context README pass / khalat disposition) — Ahmed's call at GATE 1 before project seeding.
5. Admin identity mechanism (`auth.uid()` constant vs `admin_users` table) — ADR-0007 in M1.
