# ADR-0001 — Stack: Next.js App Router + TypeScript + Tailwind CSS + Supabase

**Status:** Accepted 2026-11-06
**Deciders:** Ahmed Aboalayoun (owner), spec-driven software factory (M0)
**Scope:** Locked decision (`prompt-0.md` §2) — do not re-litigate.

## Context

The product is a bilingual (EN/AR, full RTL) portfolio **plus** a single-admin CMS (structured editing, draft/preview/publish, on-demand ISR revalidation), deployed on Vercel, backed by a managed Postgres with auth, storage and serverless functions. Constraints: one builder (Ahmed) + AI agents, ~3–4 week horizon, free-tier budgets, near-zero Supabase reads for visitors, TypeScript strict with zero `any`, and one mental model for both the public site and the admin dashboard.

Candidate stacks considered:

1. **Astro** (excellent static/ISR content sites) + a separate admin solution.
2. **Next.js App Router** for both public site and admin.

Astro is superb for the public half, but the project is not only a content site: it needs an authenticated `/admin` with server actions, session middleware, typed API boundaries, and a single deployment unit. Splitting frameworks (Astro public + something else for admin) doubles tooling, auth plumbing and CI surface for a one-person project.

## Decision

Adopt one framework for everything: **Next.js (App Router) + TypeScript (strict, zero `any`) + Tailwind CSS + shadcn/ui + Framer Motion + next-intl**, on a **new Supabase** project (Postgres + RLS + Auth + Storage + Edge Functions).

- **Why Next.js over Astro:** the admin dashboard and auth live in the same framework as the public site — one router, one server-action model, one deployment. Next.js on Vercel gives native ISR with on-demand revalidation (`revalidatePath`/`revalidateTag`), which is the core of the publish pipeline; replicating that behavior elsewhere would be bespoke work.
- **Why Supabase:** managed Postgres with RLS (row-level security as the primary public-content gate), Auth with MFA for the single admin, Storage with bucket policies for the certificate/media, and Edge Functions (Deno) for the rate-limited contact pipeline — all on a free tier, all scriptable via migrations in the repo (no ad-hoc dashboard edits).
- **Supporting choices:** Tailwind + shadcn/ui for a small, token-driven design system; next-intl for `/en` + `/ar` with `[locale]` routing; Framer Motion only for restrained interaction islands.

## Consequences

**Positive**

- One skill set, one CI pipeline, one deploy target for public + admin.
- Vercel-native ISR: publish → targeted revalidation is a first-class platform feature, not custom cache logic.
- RLS-first security model: anon users can only read `published` content; anonymous inserts into `inquiries` are structurally impossible.
- Static-by-default public pages satisfy the near-zero-reads requirement.

**Negative / accepted trade-offs**

- Next.js is heavier than Astro for a pure content site; some public-page JS budget is spent on framework overhead (mitigated by Server Components by default and minimal client islands).
- Astro's content-collection ergonomics are lost; bilingual content lives in Postgres translation tables instead of local MDX (accepted — the admin must edit it anyway).
- Supabase free-tier quotas and vendor lock-in are accepted and tracked in `docs/OPERATIONS.md` (monthly quota checklist); schema is portable SQL if migration is ever needed.
- Sharp edges (App Router caching semantics, server/client boundaries) are handled by strict conventions in `docs/ARCHITECTURE.md` and CI enforcement.
