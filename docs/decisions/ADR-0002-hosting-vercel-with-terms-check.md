# ADR-0002 — Hosting: Vercel, with a mandatory M6 plan-terms check

**Status:** Accepted 2026-11-06 · M6 terms check executed **2026-11-08** (§Verification): Hobby verdict = **FAIL** · **Final decision 2026-11-10: Netlify Free** — spike passed (§Verification), migration in progress. Vercel Pro remains documented as the evaluated alternative.
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

## Verification (M6 gate — executed 2026-11-08)

**Vercel Hobby verdict: FAILS the gate — Hobby does not permit this intended use.**

- **Source:** Vercel Fair Use Guidelines, https://vercel.com/docs/limits/fair-use-guidelines (page last updated 2026-09-14; checked 2026-11-08): *"Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan. Commercial usage is defined as any Deployment that is used for the purpose of financial gain of anyone involved in any part of the production of the project… Examples of this include, but are not limited to, the following: … Advertising the sale of a product or service."*
- **Corroborating sources (checked 2026-11-08):** Vercel Terms of Service — *"You shall only use the Services under a Hobby plan for your personal or non-commercial use"* (https://vercel.com/legal/terms); pricing page — *"Our Hobby plan is for personal, non-commercial use. Pro is designed for professional developers, freelancers, and teams"* (https://vercel.com/pricing). Pro cost: **$20/month per developer seat**.
- **Why this site is commercial:** `docs/PRODUCT.md` states the primary objective is *freelance client acquisition* — case studies, services, and a contact funnel advertising paid services fall under "advertising the sale of a product or service". No liberal interpretation is applied (the repo is open-source and carries the owner's name).

**Decision (Ahmed Aboalayoun, 2026-11-08 — in-session written confirmation + two independent advisor reviews):**

- Option (a) **Vercel Pro ($20/mo)** was evaluated and kept as the fallback: zero migration, everything verified in M5 stays as-is.
- **Chosen: option (b) Netlify Free — pending a spike.** Budget is earmarked for the domain + email, so a migration is attempted first under a strict spike protocol: a trial deploy on a `*.netlify.app` URL verifies on-demand ISR (`revalidatePath`/`updateTag` on Next 16), admin CRUD, the contact funnel, and deploy mechanics **before any DNS change**; Vercel production stays untouched the whole time. If the spike fails → fall back to Vercel Pro. Launch declaration is blocked until Ahmed reviews the spike report and gives final written approval.
- **Netlify terms evidence (checked 2026-11-08):** commercial use on Free is explicitly permitted — *"On the Free plan, you can deploy commercial projects, no credit card required and no fees. Ever."* (https://www.netlify.com/pricing); the Website Terms of Use (https://www.netlify.com/legal/terms-of-use) + Acceptable Use Policy restrict unlawful use and reselling, not commercial projects. Free-tier economics moved to a credit system: **300 credits/month; production deploy 15 credits; bandwidth 20 credits/GB** (≈ 15 GB/month if bandwidth-only) — recorded in `docs/OPERATIONS.md` §6.
- **Known constraint (measured 2026-11-08):** `*.netlify.app` hostnames are TCP-blocked on Ahmed's local network (SNI-based filtering: blocked hosts resolve to the *same* CDN IPs that serve `netlify.com` successfully, `netlify.com` itself connects fine). Consequences: the spike URL is verified from **GitHub Actions CI** (runners reach it), Ahmed views the trial via VPN/hotspot, and a **custom domain on Netlify's CDN is unaffected** by this block (filtering is by hostname, not IP).
- **Netlify Next.js support evidence:** Netlify officially supports Next.js 16 with App Router, server actions, and the enhanced caching APIs (`revalidateTag`/on-demand ISR) — https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview (updated 2026-02-04) and the "Next.js 16 is ready to deploy on Netlify" changelog (2025-10-21). Known risk class (build succeeds, deploy fails) is exactly what the spike exists to catch.
- **No DNS was changed for the spike.** `fotedev.me` wiring happens only in the post-approval migration phase.

**Final decision (2026-11-10) — Netlify Free:**

- **Spike result (2026-11-09): PASS.** CI run [42696417212](https://github.com/fotedev/My-portfolio/actions/runs/42696417212) against `https://my-portfolio-fotedev.netlify.app` (branch `m6-netlify-spike`, commit `8cc907d`): 6 tests green in 1m50s — admin login → draft → save → publish → **public page reflected in 1.0 s** (sample 0.959 s; Vercel production samples were 2.66–3.81 s), contact EN/AR happy paths, axe, trial-host noindex asserted, `leftover_ci_rows = 0`. On-demand ISR (`revalidatePath`/`updateTag` on Next 16) works via Netlify's runtime.
- **Ahmed's confirmation (2026-11-10):** in response to the spike report, Ahmed replied *"you have netlify-mcp now"* — equipping the session with Netlify MCP, which is only meaningful on the Netlify path; recorded here as the written migration decision per the protocol.
- **Why Netlify over Pro:** spike-proven behavior with better observed latency, $0/mo (budget stays with domain + email), commercial use explicitly permitted. Accepted trade-offs: tighter free-tier ceilings (300 credits/mo; production deploy 15 credits; bandwidth 20 credits/GB ≈ 15 GB/mo bandwidth-only — monthly quota check in `docs/OPERATIONS.md` §5 guards this), loss of Vercel Speed Insights (launch baseline becomes Netlify observability request metrics + first inquiry + uptime), and the local-network SNI block of `*.netlify.app` (custom domains unaffected; verified 2026-11-08/09).
- **Transition state:** Vercel keeps mirroring `main` as a noindexed fallback mirror (`fotedev-portfolio.vercel.app`) until Ahmed decides to remove it; DNS cutover to Netlify happens only after Ahmed confirms the exact record list at Namecheap.

## Consequences

**Positive**

- First-class ISR/revalidation, previews per PR, and one platform for build + edge + analytics.
- The terms risk is converted into an explicit, dated gate instead of an unexamined assumption.

**Negative / accepted trade-offs**

- Launch timing depends on the M6 terms check; if it fails, migration work (DNS, env, ISR re-verification) is added late. Accepted because deploying on terms we have not verified is a worse outcome.
- Vendor lock-in to Vercel's caching primitives is partial; the fallback platforms require re-verifying behavior, not a rewrite.
- Hobby plan limits (bandwidth, build minutes, function usage) are tracked in the monthly quota checklist (`docs/OPERATIONS.md` — numbers captured in M1 with source URL + date).
