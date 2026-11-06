# ADR-0005 — Admin: single admin (Ahmed), structured editing only — no page builder, no multi-role, no client accounts

**Status:** Accepted 2026-11-06
**Deciders:** Ahmed Aboalayoun (owner), spec-driven software factory (M0)
**Scope:** Locked decision (`prompt-0.md` §2) — do not re-litigate. This is also the scope guard for M5.

## Context

The site needs a CMS surface: Ahmed must edit settings, projects (bilingual case studies), services, credentials, contributions, media and the inquiries inbox, and publish with instant revalidation — without touching code. Options ranged from a generic headless CMS, to a drag-and-drop page builder, to a multi-role admin with client logins.

Against them: one builder + AI agents on a 3–4 week horizon; a single user (Ahmed) who is himself a developer; a small, fixed content model (see `docs/CONTENT-MODEL.md`); and a security posture that gets simpler with every removed role ("single admin" collapses the entire authorization question to one allowlisted `auth.uid()`).

## Decision

**One admin account — Ahmed only — with structured editing only:**

1. **Single admin.** Supabase Auth with exactly one allowlisted user (enforced by RLS via `auth.uid()` allowlist or an `admin_users` table — the chosen mechanism is recorded in ADR-0007 at M1). No signup route exists anywhere in the app. MFA required before launch.
2. **Structured editing, no page builder.** Every screen edits defined fields (forms, tabs EN/AR, selects, arrays) against the content model — no drag-and-drop layout editing, no free-form blocks, no rich-text HTML fields. Public layout changes are code changes, by design.
3. **No multi-role, no client accounts.** There is no second role, no editor/viewer split, no client login area, no per-client content. The public site has no accounts at all.
4. Admin UI is English-only backoffice (`/admin` noindexed, auth-gated); the bilingual requirement applies to *content*, not the admin chrome.
5. Publishing is structured too: draft → preview (auth-gated, watermarked) → publish → targeted `revalidatePath`/`revalidateTag`. Failures surface; success is never faked.

## Consequences

**Positive**

- Security shrinks to one identity: RLS policies are simple and auditable; no role matrix to test; session handling has one behavior.
- Build time and complexity drop sharply versus a builder or CMS integration; the M5 scope stays finishable.
- Structured fields keep content valid by construction (validation, required alt text, both-locale rule) — quality is enforced where a builder would allow anything.
- The content model stays the contract; adding a field is a migration + form field, not a schemaless free-for-all.

**Negative / accepted trade-offs**

- Non-technical editing flexibility is deliberately given up: a layout change requires a code change (fine — the only editor is a developer).
- If a second person ever needs access, RLS and the admin flow must be revisited (new ADR then); the single-user assumption is baked into policies now.
- No rich text: content is plain structured text, which limits formatting but eliminates an XSS class (all user text escaped; noted in the M5 security pass).
- A generic CMS (e.g. hosted headless) was rejected: it would add a vendor, its free-tier limits, and its own auth surface, to save work we are better doing once ourselves.
