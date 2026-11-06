# ADR-0002 — Hosting: Vercel, with a mandatory M6 plan-terms check

**Status:** Accepted 2026-11-06 *(terms check itself re-verified and finalized at M6 — see §Verification)*
**Deciders:** Ahmed Aboalayoun (owner), spec-driven software factory (M0)
**Scope:** Locked decision (`prompt-0.md` §2, §3.12) — the hosting *platform preference* is locked; the plan *permitting this use* is verified at M6 before launch.

## Context

The site is a **freelance client-acquisition asset** (primary objective: qualified inquiries). Vercel is the natural host for the Next.js stack (ADR-0001): native ISR + on-demand revalidation, preview deployments per PR, Edge network, integrated Analytics/Speed Insights, and a free **Hobby** plan.

However, Vercel's **Hobby plan is restricted to non-commercial use**. A portfolio whose purpose is to sell freelance services may cross into commercial use, which Hobby's terms may not permit. Terms change over time, so the check must be performed against the *current* terms, close to launch — not assumed now and not re-litigated ad hoc.

## Decision

1. **Vercel is the preferred host**, with Vercel Analytics + Speed Insights, because ISR/revalidation is central to the architecture.
2. **Milestone 6 runs a hard pre-launch gate (⛔):** fetch Vercel's current plan terms from the official source, record findings in this ADR — which plan permits this intended use, cost, source URL, **date checked**.
3. **If Hobby does not permit the intended use:** STOP. Present options to Ahmed — (a) upgrade to Pro, (b) migrate to **Netlify** or **Cloudflare Pages** free tiers (which have permitted commercial use; re-verify their terms at that moment, they also change), (c) keep Hobby and strip commercial conversion elements (not recommended). **Never deploy "to see if it works."** Proceed only with Ahmed's explicit written confirmation, recorded in this ADR.
4. The migration fallback is kept real: the app stays portable (standard Next.js, no Vercel-proprietary runtime dependencies beyond ISR/revalidation, which both fallback platforms support in some form — re-verified at migration time if it happens).

## Verification (M6 records here)

- Which plan permits this use: **TO RE-VERIFY AT M6** — source URL: — · date checked: — · decision: — · Ahmed's written confirmation: —
- *(This section is intentionally empty at M0; filling it is the M6 gate itself, not a pre-fillable assumption.)*

## Consequences

**Positive**

- First-class ISR/revalidation, previews per PR, and one platform for build + edge + analytics.
- The terms risk is converted into an explicit, dated gate instead of an unexamined assumption.

**Negative / accepted trade-offs**

- Launch timing depends on the M6 terms check; if it fails, migration work (DNS, env, ISR re-verification) is added late. Accepted because deploying on terms we have not verified is a worse outcome.
- Vendor lock-in to Vercel's caching primitives is partial; the fallback platforms require re-verifying behavior, not a rewrite.
- Hobby plan limits (bandwidth, build minutes, function usage) are tracked in the monthly quota checklist (`docs/OPERATIONS.md` — numbers captured in M1 with source URL + date).
