# ROADMAP.md

Milestone plan for `fotedev/My-portfolio` — the bilingual (EN/AR) portfolio + admin CMS for Ahmed Aboalayoun (`fotedev`), live at `https://fotedev.me`. Primary objective: **generate qualified freelance inquiries**.

Sequence is fixed (`prompt-0.md` §4): M0 → M1 → M2 → M3 → M4 → M5 → M6, stopping at every gate. Each milestone has a **closing gate**: GATE 2 (green CI + preview/production evidence, reviewed by Ahmed before the next milestone starts).

## Gate model

- **GATE 1 — M0 spec approval.** After Milestone 0 (repo hygiene + factory governance + spec suite), work **stops**: no application code is written until Ahmed explicitly approves the specs (and the proposed 3–4 case studies). Any change requests → edit docs → re-present.
- **GATE 2 — per-milestone verification.** After every milestone M1–M6: green CI (lint, typecheck, unit, build once M2 wires it) plus deployed preview/production evidence, presented for approval before the next milestone begins. Never declared done with known defects; never fake success.
- **⛔ M6 hard gate — Vercel plan terms.** Before any launch activity, current Vercel plan terms are verified and recorded in ADR-0002 (Hobby = non-commercial use). If the plan does not permit this intended use: STOP and present options (Pro / Netlify / Cloudflare Pages). Proceed only with Ahmed's written confirmation.

## Current status

> **Current gate: GATE 1 (M0 spec approval).** Milestone 0 deliverables (`.factory/`, `docs/*.md`, `DESIGN.md`, LICENSE, backlog issues) are being produced; **Milestone 1 must not start until Ahmed approves this spec suite.**

---

## M1 — Supabase: org/project, schema, RLS, buckets, seed

- **Objective:** provision and harden the backend defined in `docs/ARCHITECTURE.md` / `docs/CONTENT-MODEL.md`; prove RLS with SQL.
- **Deliverables:** new Supabase org + project (region recorded as ADR-0006, current free-tier limits copied into `docs/OPERATIONS.md` with source URL + date); `supabase/migrations/0001_initial_schema.sql` (all tables per CONTENT-MODEL, ENUMs, indexes, `updated_at` triggers, RLS on every table, rate-limit RPC, `public-assets` bucket with MIME/size limits); `supabase/seed.sql` (verified data only: settings, services ×3, OMP credential verbatim from the PDF, contributions with live re-verified statuses, approved case studies as drafts); certificate PDF uploaded to Storage (`public-assets/certificates/omp-certificate.pdf`); exactly one admin user; RLS verification SQL + results recorded; retention policy (inquiries 24 months, then purge) documented here — the purge script itself is delivered in M4, when inquiries start flowing.
- **Exit conditions:** migration applied to the remote project from the repo (not ad-hoc dashboard edits); RLS matrix passes (anon sees only published; anon INSERT into `inquiries` denied; admin full access; limiter allows-then-blocks with window reset); certificate public URL works; seed row counts verified; no secrets in docs/repo.
- **Closing gate:** **GATE 2** — PR with migration + SQL test output (CI not wired until M2), RUN_LOG row; approval to start M2.

## M2 — Next.js shell, i18n (EN/AR + RTL), theme engine, CI

- **Objective:** a green, deployable application skeleton — nothing content-related yet.
- **Deliverables:** Next.js App Router + TypeScript strict (zero `any`) + Tailwind + shadcn/ui scaffold; `next-intl` routing `/en` (default) + `/ar` (full RTL) with path-preserving locale switcher; zero-FOUC theme engine (system first visit + persistent override, both themes polished); base layouts (Navbar/Footer), placeholder routes (home, about, projects, contact, privacy, localized 404); Supabase clients (`client`/`server`/`middleware`), `/admin` auth guard + working login; `.env.example`; `.github/workflows/ci.yml` (install → lint → typecheck → unit → build); localized `robots.ts` (disallow `/admin`) + `sitemap.ts`.
- **Exit conditions:** CI green as a required status check; `/en` and `/ar` render with correct `dir` and mirrored layout; locale round-trip `/en/projects` ↔ `/ar/projects`; theme persists across reload with no flash; reduced-motion respected; `robots.txt` disallows `/admin`; sitemap lists both locales; `/admin` redirects unauthenticated visitors to `/admin/login`; **Vercel preview deployed and verified over HTTPS** (URL pasted in PR).
- **Closing gate:** **GATE 2** — PR `m2-shell` with pasted verification outputs, RUN_LOG row; approval to start M3.

## M3 — Public portfolio MVP

- **Objective:** the public, bilingual, content-complete, evidence-backed website.
- **Deliverables:** homepage funnel (Hero → Selected Work → Services ×3 → How I work → Engineering credibility → About preview → Contact strip); projects index + 2–4 case studies (target 3–4) (structure per prompt-4 §2); About with OMP certificate as supporting credential; privacy page (inquiry data, retention 24 months, delete-on-request, no ad trackers, analytics note); full SEO/i18n plumbing (localized metadata, canonical + hreflang + `x-default`, OG/Twitter cards, JSON-LD `Person` + `ProfessionalService`, sitemap/robots); native EN/AR copy traced to `docs/CONTENT-EVIDENCE.md`; restrained motion (≤200ms, reduced-motion respected).
- **Exit conditions:** all public routes static (`force-static`-eligible, zero runtime DB reads on cache hits — query-count evidence); every published claim has a dated source (Content Verifier blocks merge until clean); Lighthouse mobile lab medians: all four categories ≥ 90 (mobile, lab, documented conditions); axe zero critical/serious on `/en`, `/ar`, one case study; no draft content reachable; preview URL verified in both locales.
- **Closing gate:** **GATE 2** — PR `m3-public` with Lighthouse/axe/evidence outputs; copy sign-off and case-study order stay with Ahmed; approval to start M4.

## M4 — Contact slice

- **Objective:** a bulletproof contact funnel within free-tier limits, with a fallback that never depends on the machinery.
- **Deliverables:** Turnstile widget + server-side `siteverify`; `supabase/functions/submit-inquiry` (Zod validation → honeypot → Turnstile → persistent rate limit via M1 RPC: 3/10 min per network hash, 5/email/day, 50 global/day → service-role insert → separate fail-tolerant email notification; success reflects the **stored** inquiry, not email delivery); localized `/[locale]/contact` (accessible fields, inline errors, `aria-live`, double-submit prevention, direct email copy + `mailto:` always visible on success and every failure state); minimal auth-gated `/admin/inquiries` inbox; email provider chosen after a current pricing check → ADR-0008; E2E Playwright specs (happy path, validation, 429, honeypot, Turnstile failure, email copy, degraded mode); `supabase/purge_inquiries.sql` + retention/delete-on-request + monthly quota checklist written into `docs/OPERATIONS.md`.
- **Exit conditions:** function deployed and listed; RLS re-check: anon INSERT denied; probe transcript for 200/403/429 paths with **test** Turnstile keys; rate limits enforced persistently; email notification failure does not fail the form and is not shown to the user; one real test inquiry → visible in inbox → archived; axe zero critical on contact pages (EN+AR).
- **Closing gate:** **GATE 2** — PR `m4-contact` with probe/test evidence, RUN_LOG row; approval to start M5.

## M5 — Admin dashboard (`/admin`) + on-demand ISR publishing

- **Objective:** Ahmed edits everything without touching code and publishes with instant, targeted revalidation. Structured editing only; single admin; English-only backoffice.
- **Deliverables:** `/admin` screens — dashboard, settings, projects (bilingual editor, media picker, draft/preview/publish), services, credentials, contributions, media, full inquiries inbox (status workflow, bulk archive, delete-on-request action); publish pipeline (auth-checked server actions, publish validation both locales or explicit EN-only flag, `published_at`, targeted `revalidatePath`/`revalidateTag`, typed results, failures surfaced — never faked); auth-gated draft preview (`noindex,nofollow`, watermarked, never publicly cached); uploads with client+server MIME/size validation.
- **Exit conditions:** RLS re-verified by SQL (zero draft leakage to anon; non-admin authenticated blocked); security pass clean (anon → `/admin/*` redirects, publish without session fails, MIME spoofing rejected, forged revalidate fails, inquiry text rendered inert); Playwright round trip (login → edit hero AR → draft → preview → publish → `/ar` reflects change, EN unaffected, logout gating); **publish→visible latency measured and recorded in `docs/OPERATIONS.md` — gate: p95 ≤ 60 s measured in M5 (gating); ≤ 5 s is a non-gating aspiration**; CI green; screenshots/recording attached for Ahmed's review.
- **Closing gate:** **GATE 2** — PR `m5-admin` with latency numbers, security findings + fixes, screenshots; production untouched until M6; approval to start M6.

## M6 — Launch on `fotedev.me`

- **Objective:** production launch, fully verified, with the terms gate passed first.
- **Deliverables:** ⛔ plan-terms verification recorded in ADR-0002 **before anything else** (STOP + options if Hobby does not permit this use; written confirmation from Ahmed required); domain wired (`fotedev.me`, canonical + one redirect policy, HTTPS/HSTS, production env vars, rollback = previous deployment documented, domain expiry recorded); SEO/i18n audit with per-item evidence (titles, canonical, hreflang, OG validated, sitemap/robots, JSON-LD Rich Results pass, social share previews); responsiveness audit (320–1440 px, RTL specifics); production Lighthouse ×3 median (all four categories ≥ 90, mobile, lab, documented conditions) + CWV + `x-vercel-cache: HIT` + near-zero Supabase queries on public hits; manual a11y pass (keyboard, contrast, reduced motion, Arabic screen-reader spot check); exhaustive production smoke matrix (all routes ×2 locales ×2 themes, certificate PDF, real test inquiry → archived, admin login/logout, 404, sitemap/robots); adversarial review (abuse paths, privacy, claims, licensing clarity — AGPL notice + rights-reserved assets, dependency audit); RUN_LOG final row (SHA, URLs, medians, rollback plan); repo finishing (description/topics, social preview, README final, tag `v1.0.0`, ROADMAP closed out, old `fotedev/My_portfolio` still archived, `fotedev/fotedev` untouched).
- **Exit conditions:** ⛔ passed with recorded decision; production live on `https://fotedev.me` over HTTPS; all smoke matrix cells green; Lighthouse/axe within gates; every red fixed before launch declaration; RUN_LOG has the deployed SHA; Ahmed receives the launch report (Speed Insights baseline after 7 days, first inquiry, uptime check).
- **Closing gate:** **GATE 2 / DONE** — any red gate → launch is **not** declared; blockers reported plainly.
