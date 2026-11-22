# fotedev.me — Portfolio & Admin CMS

![Code license](https://img.shields.io/badge/code%20license-AGPL--3.0--only-blue)
![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)
![Deploy](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel)

**Live: [fotedev.me](https://fotedev.me)** · English + العربية

Open-source, bilingual (English / Arabic) freelance portfolio with a structured admin dashboard, built for **Ahmed Aboalayoun (`fotedev`)** — Full-Stack AI Engineer.

**Stack (one line):** Next.js (App Router) + TypeScript + Tailwind CSS · Supabase (Postgres + RLS + Auth + Storage + Edge Functions) · Vercel · Cloudflare Turnstile · three.js + postprocessing (deferred hero layer, ADR-0010).

## License split

- **Source code:** [AGPL-3.0-only](./LICENSE) (GNU Affero General Public License v3.0).
- **Brand, prose, case studies, photos, certificate and other assets:** © Ahmed Aboalayoun — **All Rights Reserved**. The AGPL license applies to the code only; it does not grant any rights to the brand identity, written content, or media.

## Documentation

| Document | Purpose |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | Design system: tokens, typography, RTL rules, motion, accessibility floor |
| [`docs/PRODUCT.md`](./docs/PRODUCT.md) | Positioning, services, conversion funnel, KPIs, non-goals |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System architecture, ISR strategy, Supabase, free-tier quotas, security |
| [`docs/CONTENT-MODEL.md`](./docs/CONTENT-MODEL.md) | Database schema, translation rules, RLS intent |
| [`docs/SEO-I18N.md`](./docs/SEO-I18N.md) | Bilingual routing, hreflang, structured data, sitemap |
| [`docs/QUALITY.md`](./docs/QUALITY.md) | Acceptance criteria and quality gates |
| [`docs/OPERATIONS.md`](./docs/OPERATIONS.md) | Environment variables, deploy/rollback, quotas, runbooks |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Milestones M1–M6 + M7 addendum with exit conditions |
| [`docs/decisions/`](./docs/decisions/) | Architecture decision records (ADRs) |
| [`docs/CONTENT-EVIDENCE.md`](./docs/CONTENT-EVIDENCE.md) | Verification-backed content claims (what may be published) |
| [`docs/SKILLS-MAP.md`](./docs/SKILLS-MAP.md) | Software-factory subagent & skill map |
| [`.factory/PROTOCOL.md`](./.factory/PROTOCOL.md) | Deterministic software-factory protocol (gates, shadow mode, bypass log) |
| [`.factory/RUN_LOG.md`](./.factory/RUN_LOG.md) | Measured execution log (CI failures, review rounds, durations, verification) |

## Development

**Package manager: pnpm** (Node ≥ 20).

```bash
pnpm install        # install dependencies
pnpm dev            # dev server at http://localhost:3000
pnpm lint           # ESLint (flat config, eslint-config-next v16)
pnpm typecheck      # tsc --noEmit (strict, noUncheckedIndexedAccess)
pnpm test           # Vitest unit tests
pnpm build          # production build (Turbopack)
```

Copy `.env.example` → `.env.local` and fill the Supabase values plus the Turnstile keys (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) and Resend email vars (`EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`). Note: `ALLOWED_ORIGINS` and `OWNER_EMAIL` are **Supabase function secrets** (set on the Edge Function), not Vercel env vars. CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build on every PR and push to `main`; the `CI` status check is required by the `protect-main` ruleset.

## Status

M0–M5 are merged (each GATE 2-passed). **Production is live at `https://fotedev.me`** (domain cutover 2026-11-10; deployed from `5ec4c57`).

**GATE 6 closeout in flight.** Real Turnstile keys live on production with the single-mount widget in Non-Interactive mode (PR #35, `d046361`); production smoke matrix **43/43** (2026-11-14 — [`.factory/evidence/m6/smoke-matrix.md`](./.factory/evidence/m6/smoke-matrix.md)). Production Lighthouse ×3 mobile medians (2026-11-19): **Perf 76 / A11y 100 / BP 100 / SEO 100, LCP 3.26 s, CLS 0** — recorded as the ADR-0010-bounded cost of the hero layer (kill switch `NEXT_PUBLIC_HERO_HIVE=0`). Remaining: Resend Stage 3 (real-key app-path send → [RUN_LOG](./.factory/RUN_LOG.md) launch-row completion) → tag `v1.0.0`.

M7 (hero lattice, [ADR-0010](./docs/decisions/ADR-0010-webgl-hero-hive-lattice.md)) shipped in parallel (PR #34): deferred, page-wide three.js layer with three-act scroll choreography, production-verified across all three acts. Milestones are tracked as GitHub issues (see the `M1`–`M7` issues).
