# ADR-0003 — License: AGPL-3.0-only for code + All Rights Reserved for brand/content/assets

**Status:** Accepted 2026-11-06
**Deciders:** Ahmed Aboalayoun (owner), spec-driven software factory (M0)
**Scope:** Locked decision (`prompt-0.md` §2) — do not re-litigate.

## Context

The repository contains two very different kinds of material:

1. **Code** (Next.js app, Supabase migrations/functions, CI, tooling) — the owner wants it open source, both as philosophy and as a credibility signal for an engineering portfolio.
2. **Brand, prose, photos, the certificate and case-study assets** (identity, copy, images, PDFs, evidence documents) — these are personal and commercial property; uncontrolled reuse of the *persona and content* is not wanted.

The repo is public on GitHub; visitors, recruiters, clients and other developers will read both the code and the content. The license must state clearly, in one place, what may be reused and what may not.

## Decision

Split licensing, stated in the root `LICENSE`/`LICENSES` notice and the site footer:

- **Code: AGPL-3.0-only** (GNU Affero General Public License v3.0, "or later" explicitly *not* chosen — `-only`). Applies to source code, configuration, and build tooling.
- **Brand, prose, images, certificate, and case-study assets: All Rights Reserved.** Applies to copy (EN/AR), photography, logos/wordmark `fotedev`, the certificate PDF (© its issuer), evidence documents, and any non-code asset, unless a file states otherwise.
- The footer/notice makes the split explicit so there is no ambiguity about which regime a given artifact falls under.

**Honest limitation, stated on purpose:** AGPL-3.0 **permits commercial use** of the code. It is a copyleft license, **not a copying prohibition**: anyone may run, study, modify and even commercially deploy this code, provided (under AGPL §13) that users interacting with it over a network are offered the corresponding source, and derivative works are licensed alike. If stronger protection of the code itself were ever wanted (e.g. forbidding commercial reuse outright), that would require a **source-available / proprietary license — a different decision**, not a reinterpretation of AGPL. This note is recorded so nobody later mistakes the open-source license for a usage ban.

## Consequences

**Positive**

- Code is genuinely open source; the openness itself supports the portfolio's engineering-credibility narrative.
- AGPL's network-copyleft clause closes the "SaaS loophole": a hosted fork must ship its source.
- Personal/brand content is unambiguously protected; third parties cannot freely republish the copy, photos or certificate.
- `-only` pins the license, so future GPLv4/AGPLv4 changes cannot silently alter terms.

**Negative / accepted trade-offs**

- Anyone may legally fork the *code* and run a competing site from it (complying with AGPL) — accepted; the differentiator is the person, evidence and content, not the code.
- Dual regimes in one repo require the notice to be maintained (new files land in the correct regime by directory convention; `docs/CONTENT-EVIDENCE.md` artifacts are All Rights Reserved).
- The certificate PDF remains © its issuer regardless of this ADR; it is hosted/linked as a credential, not licensed for reuse.
- If Ahmed later wants non-copyleft protection (e.g. for a commercial pivot), re-licensing code contributed only by himself is feasible; third-party AGPL contributions, if any ever arrive, would complicate it.
