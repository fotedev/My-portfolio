# Software Factory Protocol — `fotedev/My-portfolio`

This repository is built by a deterministic software-factory process: one owner (Ahmed) + AI agents, small vertical slices, CI-enforced gates, and a measured run log. Nothing ships on vibes.

## 1. Gate model

### Enforced gates (tooling — cannot be bypassed without altering CI or protection)
| Gate | Enforced by | Active since |
|---|---|---|
| Lint + typecheck + unit tests + build on every PR | `.github/workflows/ci.yml` | **M2** (created when the app scaffold exists) |
| Branch protection on `main`: PR required, no force-push, no deletion | GitHub branch ruleset | **M0** (status-check requirement attaches at M2 when CI exists) |
| Lighthouse mobile ≥ 90 (all four categories) | Lighthouse CI | **M6** |

### Process gates (convention — enforced by this protocol and the run log)
| Gate | Rule |
|---|---|
| **GATE 1** | After M0: Ahmed approves the spec suite + case-study lineup + backlog before any build work |
| **GATE 2** | After every milestone: green CI (or SQL/evidence output pre-CI) + preview/production evidence + RUN_LOG row before the next milestone starts |
| Builder ≠ verifier | Implementation and verification are separate agents; the verifier is read-only and tries to break the builder's output |

**Never** declare a milestone done with known launch-blocking defects. **Never** fake success: if revalidation, deploy, or a check fails, the failure is reported and logged — not hidden.

## 2. Issue → spec → PR flow

1. Every unit of work is a GitHub issue built from `.factory/templates/ISSUE_SPEC.md` (objective, acceptance criteria, out-of-scope, **`Skills used:`**, verification, rollback).
2. Work happens on a milestone branch (`m{N}-<slug>`), one active implementation issue at a time.
3. PRs use `.github/pull_request_template.md`, link the issue, and carry evidence (screenshots, test output, deploy URL) — not prose claims.
4. Merge to `main` only after gates pass and Ahmed approves (or CI + ruleset enforce, once attached).

## 3. Bounded review

Maximum **2 review rounds** per PR (independent reviewer, then fix). If it still fails after round 2, **escalate to Ahmed** with the diff summary and the failing evidence — no round 3, no silent acceptance.

## 4. Shadow mode (mandatory for new automations)

Any new automation that makes a decision by itself (auto-merge, auto-triage, auto-publish, notification rules) ships **observe-only first**: it logs what it *would* do for a defined observation period, and only acts after Ahmed reviews the log and says go.

## 5. Emergency bypass

Bypassing an enforced gate is allowed **only** with Ahmed's explicit approval, and must be logged in `.factory/BYPASS.md`: date, what was bypassed, why, risk accepted, follow-up task. An unlogged bypass is a protocol violation.

## 6. Run log

`.factory/RUN_LOG.md` stores **measured data only** (issue, milestone, skills used, CI failures, review rounds, duration, cost estimate, production verification). No narrative essays — evidence lives in PRs and `docs/CONTENT-EVIDENCE.md`.

## 7. Content integrity (non-negotiable)

- No invented claims. Every public-facing factual claim has a dated row in `docs/CONTENT-EVIDENCE.md`.
- Open PRs are labeled **open**; closed-unmerged PRs are never "merged"; vendor-acknowledged disclosures are **acknowledged**, never "fixed".
- Certificate facts come verbatim from the PDF; `TO VERIFY` fields stay unpublished until resolved.
- The certificate PDF is never edited, renamed, moved, or committed.
- Secrets never enter the repo (`.env.example` names only).

## 8. Scope guard

No blog UI, no testimonials, no store, no client accounts, no CRM, no booking integrations, no WhatsApp/Calendly, no drag-and-drop builder, no multi-admin. Changes to this list require a new ADR and Ahmed's approval.
