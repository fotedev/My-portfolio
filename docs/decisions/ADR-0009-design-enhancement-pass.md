# ADR-0009 — Design enhancement pass: working-document layout system, fluid display scale, ledger sections

**Status:** Accepted 2026-11-11
**Deciders:** Ahmed Aboalayoun (owner directive: "enhance the design, don't make it AI slop"); implemented in the M2.1 design pass
**Scope:** Public surfaces (`/en`, `/ar` and all routes under them). Amends DESIGN.md §6 (motion set), §7.2 (display scale), §10.5 (pill typography). Accent palette, theming, RTL rules, accessibility floor and all locked content decisions are unchanged.

## Context

The M2 implementation followed DESIGN.md faithfully and passed its gates, but a design audit against the current anti-template bar found the result **generic**: every section was the same card grid (`rounded-xl border bg-surface p-6`), decorative uppercase eyebrows appeared above repeated content ("CASE STUDY", "VERIFIED ON", "PAGES"), meta strings were joined with middle dots, the hero topped out at 48px, and every section faded up on scroll. Each of these is a recognizable "generated page" pattern; individually harmless, together they make the site read as a template rather than as fotedev. A separate robustness defect surfaced in the same audit: scroll-triggered reveals (`whileInView`) left whole sections at opacity 0 until JS observed them, which showed up as blank chapters in full-page captures and adds a JS dependency for base legibility.

The site's own story — specs, gates, evidence, verification dates — suggests its visual voice: **a meticulously kept working document**. Strong type, ruled section breaks, ledger-style records, mono only where the data is genuinely technical.

## Decision

1. **Fluid display scale.** Hero type becomes `clamp(2.5rem, 1.7rem + 3.2vw, 4.25rem)` (40px → 68px), line-height 1.08, tracking −0.025em. Section h2 and below are unchanged. Arabic keeps the §7.3 overrides (line-height 1.35, letter-spacing 0).
2. **Section header system.** Every major section opens with a full-width rule and a two-part header: the h2 on the inline-start, a mono meta line on the inline-end carrying **real data** (case-study count, engagement count, verified-entry count). Meta strings come from new `home.*Meta` messages with `{count}` interpolation — tabular-nums, Western digits in both locales.
3. **Ledger rows replace card grids where the content is a record, not an object.** Services (home + `/services`) and "How I work" become ruled index rows (title column / body column); the OSS & security record becomes a ledger list: status pill + `repo#number` + verification date on the meta line, the PR/issue title itself is the proof link. Cards remain where the affordance is genuinely card-shaped: case studies and the certificate.
4. **Anchor case study.** The first featured project renders as the anchor: full grid row on lg, larger type. Card grids use `lg:grid-cols-2` with the featured card spanning both columns.
5. **Typography details.** Status pills switch from uppercase `type-caption` to a sentence-case `type-pill` class (12–13px/500, letter-spacing 0.01em; 0 in AR). Decorative uppercase eyebrows are removed; footer column labels are sentence-case `text-sm font-medium`. The wordmark renders in the mono stack. Hero meta is a sentence ("Name. Role."), not a middle-dot join.
6. **Motion set reduced.** All scroll-triggered `Reveal` wrappers (component deleted) and stagger delays are removed. The only entrance is a CSS-only hero `rise-in` (200ms, transform-only, four 40ms stages, `animation-fill-mode: backwards`), disabled under `prefers-reduced-motion` (the global rule now also zeroes `animation-delay`). MotionConfig/reduced-motion wiring stays in place.
7. **Token completions.** `::selection` now uses the DESIGN §2.4 selection values (new `--selection-bg` token, both themes); `color-scheme: light/dark` is set per theme for native form controls and scrollbars. No new hues; the accent budget and the hero-wash gradient are untouched.
8. **Copy punctuation.** The footer rights line drops its middle-dot separators: "© {year} Ahmed Aboalayoun. Code AGPL-3.0-only; content and assets all rights reserved." (AR equivalent amended the same way).
9. **QA helper.** `scripts/shot.mjs` captures full-page screenshots of the public routes in both themes and locales for design review; it is a dev utility and ships in the repo.

## Consequences

**Positive**

- The page has one committed idea (a verifiable working document) instead of six identical card grids; hierarchy is carried by structure and type, not repeated chrome.
- All content renders without JavaScript and without scroll position; captures, crawlers, print and no-JS sessions see the full page.
- The hero carries the first impression at portfolio-grade scale while every locked rule (one accent family, ≤200ms motion, RTL parity, token-only colors) still holds.
- Section meta lines surface real counts, reinforcing the evidence-first positioning.

**Negative / accepted trade-offs**

- The ledger/row treatments share a visual language across sections; differentiation relies on band surfaces, numbers vs. pills, and column anatomy. Accepted: consistency of voice was the goal.
- `home.*Meta` / `oss.viewOnGithub` message keys changed usage; the `viewOnGithub` key is now unused by components (kept in the message files for future admin surfaces).
- Full-width "How I work" rows lengthen the section vertically versus the four-card grid. Accepted for rhythm; the ladder reads as process, which the four cards did not.
- DESIGN.md §7.2/§6/§10.5 and this ADR must travel together; future type-scale changes need a new ADR.
