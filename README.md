# fotedev.me — Portfolio & Admin CMS

Open-source, bilingual (English / Arabic) freelance portfolio with a structured admin dashboard, built for **Ahmed Aboalayoun (`fotedev`)** — Full-Stack AI Engineer.

**Stack (one line):** Next.js (App Router) + TypeScript + Tailwind CSS · Supabase (Postgres + RLS + Auth + Storage + Edge Functions) · Vercel · Cloudflare Turnstile.

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
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Milestones M1–M6 with exit conditions |
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

Copy `.env.example` → `.env.local` and fill the public Supabase values. CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build on every PR and push to `main`; the `CI` status check is required by the `protect-main` ruleset.

## Status

M0 (foundation) and M1 (Supabase schema/RLS/seed) are merged. **M2 — application shell: Next.js App Router + next-intl (EN/AR RTL) + zero-FOUC theme engine + CI — in review.** Milestones are tracked as GitHub issues (see the `M1`–`M6` issues). Public site target: `https://fotedev.me`.
