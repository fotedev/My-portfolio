# M6 Security & Adversarial Audit — live https://fotedev.me (build `4a66233`)

Run: 2026-11-10 06:18–06:22 UTC, from `C:\programming\github\My-Portfolio` (Windows,
PowerShell 5.1). Method: **passive probes only** — no valid inquiry submissions, no
rate-limit triggering, no secret changes, no deploys. Probe scripts are archived at
`.factory/evidence/m6/scripts/` (written by a subagent, reviewed and executed by the
agent session; the subagent itself failed before executing them).

Secrets hygiene: the anon and service-role keys were read from `.env.local` into
process variables and never printed; the secrets scan prints 10-char prefixes only.

## Verdict

| # | Check | Result |
|---|---|---|
| 1 | Security headers on public + admin routes | **FAIL (found) → FIXED this branch** |
| 2 | Unauthenticated admin surface | PASS |
| 3 | Supabase RLS + row-count stability | PASS |
| 4 | Edge Function passive adversarial probes (P1–P6) | PASS |
| 4b | Edge Function negative siteverify probe (P7) | **DEFERRED** — see note |
| 5 | Dependency audit (`pnpm audit --prod`) | PASS — 0 known vulnerabilities |
| 6 | Secrets scan over 176 tracked files | PASS — 0 pattern hits |

## 1. Security headers — the main finding

Before the fix, **no response carried CSP, `X-Content-Type-Options`,
`Referrer-Policy` or `Permissions-Policy`**, although ARCHITECTURE §8 locks them
("defined in `next.config` headers"). Evidence: archived response headers for the
pre-fix production build, `.factory/evidence/m6/html/en_home_headers.txt` (only
HSTS, Vercel headers, `Link`, cache and Next.js markers).

Fix (this branch, `next.config.ts` `headers()`):

- `Content-Security-Policy`: `default-src 'self'`; `script-src 'self'
  'unsafe-inline' https://challenges.cloudflare.com`; `style-src 'self'
  'unsafe-inline'`; `img-src 'self' data: https://*.supabase.co`; `font-src 'self'
  data:`; `connect-src 'self' https://*.supabase.co wss://*.supabase.co
  https://challenges.cloudflare.com`; `frame-src
  https://challenges.cloudflare.com`; `object-src 'none'`; `base-uri 'self'`;
  `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(),
  geolocation=(), interest-cohort=()`.

`script-src` keeps `'unsafe-inline'` deliberately: the prerendered ISR pages are
served from the CDN with one HTML for many requests, so per-request nonces are
impossible, and hash pinning breaks on every build. `frame-ancestors 'none'` +
`object-src 'none'` retain the important hardening. Documented inline in
`next.config.ts`.

Behavioral verification on the local production build (same code that will deploy):

- All four headers present on `/en`, `/ar`, `/en/contact`, `/admin/login`, `/admin`.
- Contact page in a real browser under the new CSP: Turnstile API script loaded,
  widget rendered, **token solved** (`form[data-turnstile-ready="true"]`), inline
  theme-init applied (`html.dark`) — no functional regression.
- Admin responses keep `Cache-Control: private, no-store` + `X-Robots-Tag:
  noindex, nofollow` (pre-existing, re-verified).

## 2. Unauthenticated admin surface — PASS

`/admin`, `/admin/inquiries`, `/admin/projects`, `/admin/settings` all →
`307` to `/admin/login`; response bodies are the 15-char "Redirecting..." stub;
0 hits for admin-data patterns (inquiries, tables, supabase, emails, etc.).

## 3. Supabase RLS — PASS

`GET /rest/v1/inquiries?select=*` with the **anon** key → HTTP 200, `[]`
(0 rows visible; RLS denies all selects). Row count via service role:
**before 67 → after 67** across all probes (no pollution).

## 4. Edge Function `submit-inquiry` — PASS (passive set)

| Probe | Expectation | Observed |
|---|---|---|
| OPTIONS, Origin `https://fotedev.me` | 204 + ACAO echo | 204 + ACAO echo |
| OPTIONS, Origin `https://evil.example` | 403 / no ACAO | 403 |
| POST, no Origin | 403 | 403 `forbidden` |
| POST multipart | 415 | 415 `unsupported_media_type` |
| POST invalid JSON | 400 | 400 `invalid_json` |
| POST honeypot-filled | 200 drop, no row | 200 `{"ok":true}`, rows 67→67 |

Notes: the honeypot probe increments the per-IP net counter by design (1 of 3 per
600 s) — no row is written and the counter window expired long before the smoke run.

**P7 (fabricated Turnstile token → expect 403) is deferred.** The production
function still holds Cloudflare's published **test** secret (always-pass), so a
fabricated token would pass siteverify, skip the action/hostname checks, burn rate
counters and **insert a real inquiry row**. It must be run only after the real
Turnstile secret is wired (M6 remaining step), together with the launch smoke.

## 5. Dependencies — PASS

`pnpm audit --prod` → "No known vulnerabilities found" (0 critical / 0 high).

## 6. Secrets hygiene — PASS

`git grep -iE "(re_[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|0x4AAAAAAA)"`
over 176 tracked files → no hits. `.env.local` is gitignored; `.env.example`
carries names only (verified empty values).

## Residual risks / follow-ups

1. Real Turnstile secret + Resend key still pending → P7 + email smoke blocked.
2. CSP allows `'unsafe-inline'` for scripts (rationale above); no nonce/hash
   migration planned for v1 — revisit only if the site becomes dynamic.
3. `/fr`-style unknown locales 307 to `/en/fr` then 404 (next-intl negotiation),
   not a direct 404 — harmless for SEO, verified chain.
4. Rate-limit 429 load path is exercised by the E2E suite (M4), deliberately not
   re-triggered in this passive pass.
