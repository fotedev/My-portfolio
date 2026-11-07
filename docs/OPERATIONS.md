# OPERATIONS.md

Operational runbook for the `fotedev` portfolio (`fotedev/My-portfolio`, live at `https://fotedev.me`).
Owner/operator: Ahmed Aboalayoun (single admin, see `docs/decisions/ADR-0005-single-admin-no-page-builder.md`).

Status: **M1 complete (schema + RLS proven + seeded).** Supabase Free-plan limits were captured live from vendor pages on **2026-11-06** (§6).

## 0. Supabase project record

| Item | Value |
|---|---|
| Organization | `zhujtufyfpjmyftruahv` — **fotedev-portfolio** |
| Project ref | **`zfhfeiqdsugjqliufhke`** ("My-portfolio") |
| Region | `eu-central-1` (ADR-0006) |
| Postgres | 17.11 · status ACTIVE_HEALTHY (verified 2026-11-07) |
| Access in-session | `SUPABASE_ACCESS_TOKEN` in repo-local `.env.local` (gitignored) → Management API (`api.supabase.com`); **token is scoped to the fotedev-portfolio org only — khalat/Masar X projects are unreachable by it by design** |
| MCP wiring | `~/.zcode/cli/config.json` `mcp.servers.supabase` repointed to this ref + same token (takes effect on next session; the old `supabase-masarx` server stays untouched/off-limits) |
| RLS verification | `supabase/tests/rls_verification.sql` — **20/20 PASS** on 2026-11-07 (results pasted in the M1 PR); RLS enabled on **18/18** tables |
| Storage | bucket `public-assets` (public read, admin write; images ≤ 2 MB, PDFs ≤ 10 MB, MIME whitelist); certificate at `public-assets/certificates/omp-certificate.pdf` (285,463 bytes, public fetch verified 2026-11-07) |

---

## 1. Environment variables

All secrets live in `.env.local` (gitignored) locally and in Vercel project Environment Variables in production. The repo carries only `.env.example` with **names, never values**. No secret is ever committed, pasted into docs, or written into issue bodies.

| Variable | Scope | Used by | Purpose / notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public (client + server) | Supabase JS clients | Project URL for anon access. Safe to expose; access is governed by RLS. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public (client + server) | Supabase JS clients | Anon key. Safe to expose; every table must be RLS-protected so anon can only read `published` content. |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** | Edge Functions, server-side admin writes | Bypasses RLS. Must never reach the browser bundle, client components, or any `NEXT_PUBLIC_*` context. In code, import only from modules marked `server-only`. |
| `TURNSTILE_SECRET_KEY` | server-only (Edge Function) | Contact pipeline (M4) | Server-side `siteverify` secret from Cloudflare. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public (client) | Contact form widget (M4) | Turnstile widget site key. |
| `EMAIL_PROVIDER_API_KEY` | server-only (Edge Function) | Inquiry notification (M4+) | API key for the chosen email provider. Provider is selected in M4 after a current pricing check (see ADR-0008 when created). |
| `EMAIL_PROVIDER_NAME` | server-only (Edge Function) | Inquiry notification (M4+) | Which provider adapter to use (e.g. `resend`); set when the provider is chosen in M4. |
| `EMAIL_FROM` | server-only (Edge Function) | Inquiry notification (M4+) | Verified sender address for notification emails. |
| `CONTACT_EMAIL` | public display value (stored in `site_settings`, editable from `/admin`) | Contact UI | The public contact email shown on the site and used by the copy button / `mailto:` fallback. Initial value: `fote.engineer@gmail.com`. Editable in `/admin/settings`; the env/DB value is the source of truth, not hardcoded copy. |
| `IP_HASH_SALT` | server-only (Edge Function) | Rate limiting (M4) | Salt for salted SHA-256 of the submitter IP (`ip_hash`). Never store raw IPs. Rotate with the other secrets if compromise is suspected (see §7). |
| `ALLOWED_ORIGINS` | server-only (Edge Function) | Contact pipeline (M4) | Comma-separated CORS + siteverify hostname allowlist (e.g. `https://fotedev.me,https://fotedev-portfolio.vercel.app,http://localhost:3000`). No wildcards in production. |
| `OWNER_EMAIL` | server-only (Edge Function) | Inquiry notification (M4+) | Notification recipient; defaults to the `site_settings` contact email when unset. |
| `NEXT_PUBLIC_SITE_URL` | public (build) | Metadata, canonical URLs, sitemap | Canonical origin, e.g. `https://fotedev.me`. |

Rules:

- `.env.example` lists names only; values go to `.env.local` and Vercel env vars.
- `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `EMAIL_PROVIDER_API_KEY`, `IP_HASH_SALT` are **server-only**: never prefixed `NEXT_PUBLIC_`, never imported in client components.
- Project ref / URL may be recorded in docs; **keys never are** (prompt-0 §3.9).

## 2. Deploy (Vercel)

Preferred path is Git-integrated deployment: push/merge to `main` → Vercel builds and promotes to production automatically. Nothing is deployed ad-hoc "to see if it works".

1. Ensure the PR is merged with **CI green** (lint, typecheck, unit, build — required status check per `.factory/PROTOCOL.md`) and GATE 2 evidence attached.
2. Confirm Vercel Environment Variables are set for the **Production** scope (names per §1; values in Vercel dashboard, not in repo).
3. Merge to `main`. Vercel deploys the production build.
4. Post-deploy smoke (2 minutes):
   - `https://fotedev.me` loads over HTTPS; `/en` and `/ar` render; theme has no flash on reload.
   - Spot-check one project page and `/contact` (direct email fallback visible even if the form is disabled).
   - `robots.txt` still disallows `/admin`; sitemap lists both locales.
5. Record the deployment SHA + URL in `.factory/RUN_LOG.md` (and in this file's §10 launch record at M6).

Preview deploys: every PR gets a Vercel preview URL. Preview env vars are set once per project; previews may keep Deployment Protection enabled (production must have it disabled at launch, M6).

## 3. Rollback (Vercel)

Bad publish or regression on production:

1. Identify the last known-good production deployment (Vercel dashboard → Deployments → last `READY` production deploy with passing smoke).
2. **Promote/rollback:** Vercel dashboard → that deployment → "Promote to Production" (or use the Instant Rollback option). This repoints traffic without a rebuild.
3. CLI equivalent: `vercel rollback <deployment-url> --prod` (or `vercel promote`, matching the current CLI — check `vercel --help` at the time of the incident).
4. Verify the site renders correctly again; check that `/en` and `/ar` both work.
5. **Content-cache check:** if the bad content was ISR-cached, run the targeted revalidation from `/admin` (publish an unchanged field on the affected record) or hit the revalidation path for the affected routes (`/[locale]`, `/[locale]/projects`, `/[locale]/projects/[slug]`). Revalidation failure must be **reported, never hidden** (prompt-0 §3.10).
6. Fix forward on a branch → PR → CI → merge. Do not hot-patch production by hand.
7. Log the incident in `.factory/RUN_LOG.md` (issue/SHA, what regressed, rollback time).

Supabase schema note: schema changes are forward-compatible (migrations only, no destructive rewrites). Rollback reverts the **app**, not the DB; if a migration must be reverted, that is a new forward migration with a documented reason.

## 4. Supabase backup & retention

- **Managed backups:** none on the Free plan (checked 2026-11-06). Supabase: "We automatically back up all Pro, Team, and Enterprise Plan projects on a daily basis" (https://supabase.com/docs/guides/platform/backups); the pricing page lists Free automatic backups as "Not included" (https://supabase.com/pricing); and "Database backups are not available for download for Free Plan projects" (https://supabase.com/docs/guides/platform/going-into-prod). Supabase's own recommendation for Free projects is regular `supabase db dump` exports — which is exactly the owner-run routine below. Do not assume daily backups exist.
- **Self-service exports (owner-run, monthly, ~5 minutes):**
  1. Supabase dashboard → Database → Backups: note latest available backup timestamp.
  2. Export content tables to a local timestamped folder (SQL dump or CSV of `site_settings`, `projects`, `services`, `credentials`, `contributions`, `media_assets` metadata): `supabase db dump --data-only -f backup-YYYYMMDD.sql` (or Table Editor CSV exports).
  3. Copy the certificate PDF and other irreplaceable media out of Storage to the same folder. The repo already contains the certificate at root; keep the M0 backup path known.
  4. Store outside the repo working tree. Note the backup date in the monthly checklist (§6).
- **Retention of operational data:**
  - `inquiries`: retained **24 months** from `created_at`, then purged (§8). Rate-limit counters are ephemeral windows, not records.
  - Backups that include inquiries inherit the same 24-month horizon — delete or age out inquiry-bearing dumps older than 24 months during the monthly checklist.

## 5. Quota monitoring checklist — monthly, 10 minutes

Run on the 1st of each month (calendar reminder). Record results as one line in `.factory/RUN_LOG.md`.

1. **Vercel:** dashboard → Usage — build minutes, bandwidth, function usage, analytics events. **Free-tier limits: TO CAPTURE IN M1 (record with source URL + date: Vercel pricing/limits docs).**
2. **Supabase:** dashboard → Usage/Reports — database size, storage used, egress, Edge Function invocations, Auth MAUs. **Free-tier limits: TO CAPTURE IN M1 (record with source URL + date: Supabase pricing page).**
3. **Turnstile / Cloudflare:** widget request volume; **limits: TO CAPTURE IN M1 (record with source URL + date: Cloudflare Turnstile docs).**
4. **Email provider (Resend, ADR-0008):** emails sent this month vs 3,000/mo free tier (100/day); until the M6 key is set this stays 0 (degraded mode — notify is log-only).
5. **Inquiries growth:** row count vs the daily global cap (50/day expected ceiling ≈ ~1,500/month worst case ≈ ~1.5 MB/inquiries table). If growth is anomalous, check rate-limit counters for abuse.
6. **Trend vs. thresholds:** any metric > 60% of its free-tier cap → open a GitHub issue titled `[OPS] Quota headroom <metric>` with the numbers and the source URL/date of the cap.
7. **Backups:** latest Supabase backup timestamp sane; monthly export (§4) done.
8. **Inquiry purge:** run `supabase/purge_inquiries.sql` (24-month retention, §8) — via the Supabase SQL editor or the Management API; note the deleted-row count (expected 0 for years).
8. **Domain & email expiries:** `fotedev.me` renewal date and professional-email expiry are recorded in §10 — flag anything inside 60 days.

Behavior when limits are reached (design contract, enforced in M4/M5): writes **fail closed** (contact form returns the generic error + direct-email fallback remains), while the public site stays cached and readable (ISR/edge cache does not depend on Supabase availability).

## 6. Free-tier limits table

Captured from the vendors' own pages — **source URL + capture date** written inline. Do not fill from memory; vendor limits change. Re-checked in M6.

| Resource | Provider | Limit | Source URL | Captured on |
|---|---|---|---|---|
| DB size | Supabase | 500 MB (shared CPU, 500 MB RAM) | https://supabase.com/pricing | 2026-11-06 |
| Storage (files) | Supabase | 1 GB | https://supabase.com/pricing | 2026-11-06 |
| Bandwidth/egress | Supabase | 5 GB egress + 5 GB cached egress | https://supabase.com/pricing | 2026-11-06 |
| Edge Function invocations | Supabase | 500,000 / month included | https://supabase.com/pricing | 2026-11-06 |
| Auth MAUs | Supabase | 50,000 / month | https://supabase.com/pricing | 2026-11-06 |
| Project pausing | Supabase | Free projects pause after **1 week of inactivity**; max **2 active projects** | https://supabase.com/pricing | 2026-11-06 |
| Max file upload | Supabase | 50 MB (platform max; our bucket caps at 10 MB — `0001_initial_schema.sql`) | https://supabase.com/pricing | 2026-11-06 |
| Deployments per day | Vercel Hobby | 100 / day (also 100 / hour build rate limit) | https://vercel.com/docs/limits | 2026-11-06 |
| Build time per deployment | Vercel Hobby | 45 minutes max; 1 concurrent build | https://vercel.com/docs/limits | 2026-11-06 |
| Function duration (Fluid) | Vercel Hobby | 300 s default and max; 2 GB RAM / 1 vCPU | https://vercel.com/docs/limits | 2026-11-06 |
| Billable-resource allotments | Vercel Hobby | monthly allotment per resource per fair-use guidelines (no single flat figure published on the limits page) | https://vercel.com/docs/limits/fair-use-guidelines | 2026-11-06 |
| Hobby plan use terms | Vercel | **TO CAPTURE IN M6 — ADR-0002 terms check** (Hobby = non-commercial) | — | — |
| Turnstile plan | Cloudflare Free | **Unlimited challenges (traffic or verification requests)**; up to 20 widgets; 10 hostnames/widget; 7-day analytics | https://developers.cloudflare.com/turnstile/plans/ | 2026-11-06 |
| Email sends | Resend (ADR-0008) | Free: **3,000 emails/month, 100/day** — currently in degraded mode (no key set; notify = log-only until M6) | https://resend.com/pricing | 2026-11-07 |

**Pausing mitigation (Supabase):** the free project pauses after 1 week of inactivity. Mitigations: (a) public pages are static/ISR-cached, so a paused DB never takes the site down; (b) a scheduled GitHub Action keep-alive ping (any read query, e.g. `select 1`) runs weekly — wired in M2/M5 CI tooling; (c) admin activity during content edits also counts as activity.

**Backup reality (Supabase Free):** no automatic backups — monthly owner-run `supabase db dump` exports per §4.

## 7. Secret rotation

Rotate when: a key may have leaked, an offboarding/change occurs, or at least **every 12 months** as hygiene. Steps:

1. **Supabase keys:** Supabase dashboard → Settings → API. The `anon` key and `service_role` key are re-issued/reset there (current Supabase UI supports legacy JWT secret rotation; capture the exact flow in M1 — record with source URL + date). Update `.env.local` and all Vercel env scopes, then redeploy (§2). Any change to `service_role` requires a redeploy of the Edge Function environment.
2. **Turnstile secret:** Cloudflare dashboard → Turnstile → widget → rotate secret key. Update `TURNSTILE_SECRET_KEY` in the Edge Function env + Vercel.
3. **Email provider key:** provider dashboard → revoke + create new key → update `EMAIL_PROVIDER_API_KEY`.
4. **`IP_HASH_SALT`:** rotating it invalidates historical `ip_hash` comparability (old hashes no longer match new ones — rate-limit windows simply reset per hash). Acceptable: `ip_hash` is anti-abuse, not identity. Update env, redeploy function.
5. **Supabase admin password / MFA:** change password from the account settings; re-enroll MFA if the authenticator is lost (see §9 — a second factor slot / recovery codes exist for this).
6. After each rotation: run the §2 smoke, submit one test inquiry (archived afterwards), confirm Edge Function 200.
7. Never rotate by editing committed files — env vars only.

## 8. Inquiry retention & delete-on-request

- **Retention:** inquiries live 24 months from `created_at`, then are purged. The retention policy is documented from M1; the purge script itself is delivered in M4 (when inquiries start flowing). Mechanism: `supabase/purge_inquiries.sql` deletes rows older than 24 months along with their rate-limit artifacts (the requester's `rate_limit_counters` keys: `net:<ip_hash>`, `email:<…>`). Run it monthly (add to §5 checklist) or schedule via the tooling available at that time — record the actual mechanism in M4.
- **Delete-on-request (GDPR-style, honored on email request):**
  1. Request arrives (any channel). Verify it plausibly identifies the requester (the inquiry email address; ask for confirmation from that address if unclear).
  2. In `/admin/inquiries`, locate rows by email and use the **Purge** action: it hard-deletes the row after the 8-character reference is retyped (RLS policy `inquiries_admin_delete`, migration `0003`). Bulk archive first if several rows belong to the requester. (Alternatively a parameterized SQL delete by email via the Supabase SQL editor.)
  3. Confirm removal (`SELECT count(*) WHERE email = ...` → 0), and purge the requester's `rate_limit_counters` keys (`net:<ip_hash>`, `email:<…>`).
  4. Reply to the requester confirming deletion. Note the action (date + row id) in the RUN_LOG, not the inquiry content.
  5. If the request also covers notification/backup copies: note that monthly backups age out within the 24-month horizon; delete the corresponding dump if it is current-month.
- No raw IPs are ever stored (salted `ip_hash` only). The salted `ip_hash` is retained up to 24 months for abuse control and is deletable on request: deleting it only weakens rate limiting for that client, which is acceptable and is stated in the reply.

## 9. Admin MFA enrollment (single admin: Ahmed)

The admin account is created once in M1. MFA-ready; enabling MFA before launch is recommended and documented in `docs/OPERATIONS.md` §9 (this section), but it is not a CI gate. Enrollment steps (Supabase Auth):

1. Log in at `/admin/login` (or Supabase dashboard → Authentication → Users for account-level settings).
2. From the account/session, enable a **TOTP factor** (authenticator app: Aegis, 1Password, Google Authenticator, etc.). Scan the QR / enter the secret; verify with the first 6-digit code.
3. **Store recovery codes** offline (password manager). Recovery codes are the fallback if the authenticator device is lost.
4. Log out → log in again → confirm the MFA challenge appears and succeeds.
5. Record the enrollment date in `.factory/RUN_LOG.md`. Do not store TOTP secrets or recovery codes in the repo.
6. If the authenticator is lost: use a recovery code to sign in, then re-enroll a new factor (§7.5). If both are lost, account recovery goes through Supabase Auth email flow — which requires the admin email inbox to be accessible; that is why recovery codes are mandatory.
7. No public signup route exists anywhere in the app (no registration page; signup disabled by convention — verified in M2/M5). Exactly one admin user exists.

## 10. Operational records

- **Launch record (filled at M6):** deployed SHA `—` · deployment URL `—` · domain `fotedev.me` · date/time `—` · Lighthouse medians (P/A/BP/SEO) `—` · smoke matrix `—` · rollback = previous production deployment (§3).
- **Expiries & calendar reminders:**
  - Domain `fotedev.me`: 1-year registration — expiry date **TO RECORD IN M6** (DNS engineer A). Reminder at −60 days.
  - Professional email: exists for 1 month at start — must NOT be a launch dependency (ADR-0004); if it lapses, `CONTACT_EMAIL` is switched from `/admin` to the fallback address within minutes.
  - Vercel plan terms check: re-verified at M6 (ADR-0002); re-check annually or when Vercel announces plan changes.
- **Incident log:** incidents are appended to `.factory/RUN_LOG.md` (issue/SHA, symptom, action, resolution time). This file holds the runbooks, not the history.

## 11. Incident runbooks

### 11.1 Contact form down (Edge Function erroring / Turnstile failing / rate limiter stuck)

Symptom: submissions fail, `/contact` shows the failure state.

1. **First, confirm the fallback is intact:** the direct email card (copy button + `mailto:`) is always rendered on `/contact` and on every failure state — visitors are never blocked from reaching Ahmed. This is the design contract (ADR-0004); no hotfix is needed to restore reachability.
2. Diagnose: check Supabase Edge Function logs (`supabase functions list` / dashboard logs) and whether Turnstile `siteverify` returns errors; check `rate_limit_counters` for a corrupted/global-capped window.
3. Fix forward: correct the function/env, redeploy the function (`supabase functions deploy submit-inquiry`), re-probe with test Turnstile keys (200/403/429 paths).
4. If the outage spans hours: consider temporarily raising visibility — e.g. make the direct email card more prominent via `/admin` settings copy — but do not deploy untested changes.
5. Log the incident (§10). Losses during the outage: inquiries not received — mitigated by the fallback; mention the outage window when replying to late emails if relevant.

### 11.2 Bad publish (wrong content is live / revalidation failed)

Symptom: a published edit shows wrong/broken content on the public site, or publish returned success but the page did not change (revalidation failure — which must surface as an error in `/admin`, never fake success).

1. **Fastest path:** §3 rollback — promote the previous production deployment (the site is static/ISR; rollback is instant and safe).
2. **Or fix content forward:** in `/admin`, revert the offending record to its prior values (draft → correct → publish again). The publish action re-runs targeted `revalidatePath`/`revalidateTag`.
3. If revalidation fails again: check server action logs (request id), verify env vars in production scope, and manually trigger revalidation by re-publishing an unchanged field on the affected record. **Do not declare it fixed until the live URL shows the correct content.**
4. If drafts leaked publicly (preview bug): immediately re-verify `/admin` noindex + auth gating, unpublish the affected record, and treat as a launch-blocking regression (security verifier scenarios, M5 §6).
5. Log the incident with SHA, symptom, action, and the measured recovery time.

### 11.3 Free-tier quota exhausted

Writes fail closed; the public site stays cached and readable by design. Actions: open `[OPS]` issue per §5.6, decide (cleanup / upgrade / migrate) with Ahmed; until decided, the direct email fallback carries contact traffic.

## 12. Admin & publish pipeline ops (M5)

### 12.1 Publish → visible latency (measured)

The publish gate (ROADMAP §M5): **p95 ≤ 60 s (gating), ≤ 5 s aspiration.** Mechanism: publish server action writes the row, then runs the targeted `revalidatePath` plan (ARCHITECTURE §5.2); the next request re-renders. Measured **publish-click → public URL reflects the change**:

| Run | Where | Publish→visible |
|---|---|---|
| 1 | local build (`pnpm start`, same-process revalidation) | 0.49 s |
| 2 | local build | 0.22 s |
| 3 | local build | 0.23 s |
| 4 | full-suite run | 0.31 s |
| Prod 1 | production `fotedev-portfolio.vercel.app` (scratch draft → publish → poll prod URL → unpublish → delete), 2026-11-07 | 3.76 s |
| Prod 2 | production, same probe | 3.81 s |
| Prod 3 | production, same probe | 2.66 s |

Local p50 ≈ 0.23 s; **production p50 ≈ 3.76 s, max 3.81 s** (includes client→edge round trips) — under the 5 s aspiration and far under the 60 s gate. Probe rows were fully removed (verified `count = 0`). Public pages run `revalidate = false` (on-demand only, ARCHITECTURE §5.1): nothing goes stale on a timer, and unpublished slugs 404 until publish revalidates their path.

### 12.2 Media uploads

- Limits: images (PNG/JPEG/WEBP/AVIF) ≤ 2 MB, PDF ≤ 10 MB — enforced client-side AND server-side; the server sniffs **magic bytes** (declared Content-Type is never trusted — a renamed HTML/executable is rejected). The bucket's own MIME whitelist + 10 MB cap are the coarse backstop.
- Both alt texts (EN + AR) are DB-required (`media_assets.alt_en/alt_ar NOT NULL`) — the upload form refuses without them.
- Path convention: `media/<yyyy-mm>/<uuid>-<slugified-name>.<ext>`. Deleting an asset that a project/credential still references is blocked with a typed error; detach it in the editor first.

### 12.3 Admin login rate limits & retry policy

- Supabase Auth enforces built-in rate limits on `signInWithPassword` (per-IP + per-account); the login form shows one generic "Sign-in failed" message (no user enumeration) and offers no signup.
- Manual retry policy: after 3 failed attempts, wait 15 minutes before retrying ( Supabase's limits will also throttle); persistent lockout → check Supabase Auth logs (dashboard → Authentication → Logs), reset the password from the dashboard if needed (§7.5 covers credential hygiene).
- Sessions are cookie-based; expiry mid-edit surfaces as a typed `{ok:false, error:"Your session expired…"}` toast on the next save attempt — reload, sign in again, re-apply the edit (the unsaved-changes guard warns before accidental navigation).

### 12.4 CI/E2E footprint on the live DB

The Playwright suite (CI + local) writes real rows to the production Supabase project: contact specs create test inquiries (subject pattern `CI E2E|RateLimit|Degraded Test|اختبار آلي`) and the admin specs archive/purge them; the publish spec creates a `ci-e2e-<runid>` draft project and unpublishes + deletes it. The global daily rate-limit counter burns ~5–8/day from CI runs (cap 50/day, resets 00:00 UTC) — acceptable; if CI frequency rises, raise the global cap or gate the suite behind a schedule.
