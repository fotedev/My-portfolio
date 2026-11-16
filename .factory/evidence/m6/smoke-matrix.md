# M6 / GATE 6 — Production smoke matrix (fotedev.me)

Run 2026-11-14 against production `https://fotedev.me` (Playwright Chromium, viewport 1440×900,
themes forced via `localStorage["fotedev-theme"]`). Script: local-run evidence artifact
(`smoke-matrix.js` + `smoke-fixups.js` + `smoke-admin.js`); raw JSON alongside in the session
temp dir. The contact **real-inquiry** cell is executed in the Resend stage (Stage 3) and
recorded in the RUN_LOG launch row.

**Result: 43/43 cells green** (41 route/asset cells + Turnstile-ready ×2 locales + admin round trip).

## Public routes × 2 locales × 2 themes (36 cells)

Every cell: HTTP 200 + `<h1>` rendered + **zero console errors**. Route set enumerated from the
live `sitemap.xml` (18 URLs — home, projects index, 3 case studies ×2, services, about, contact,
privacy × en/ar).

| Route | /en | /ar |
|---|---|---|
| `/` | 200 dark+light ✓ | 200 dark+light ✓ |
| `/projects` | ✓ | ✓ |
| `/projects/masar-x` | ✓ | ✓ |
| `/projects/ghost` | ✓ | ✓ |
| `/projects/khalat` | ✓ | ✓ |
| `/services` | ✓ | ✓ |
| `/about` | ✓ | ✓ |
| `/contact` | ✓ | ✓ |
| `/privacy` | ✓ | ✓ |

## Localization + SEO surface

| Cell | Result |
|---|---|
| 404 `/en/nope` | 404 + "Page not found" h1 ✓ |
| 404 `/ar/nope` | 404 + "الصفحة غير موجودة" h1 ✓ |
| robots.txt | `Disallow: /admin` + `Sitemap:` ✓ |
| sitemap.xml | 18 URLs, both locales ✓ |
| Certificate PDF | Supabase public-assets URL → 200 `application/pdf` ✓ |

## Contact page (pre-Resend state)

| Cell | Result |
|---|---|
| Copyable email fallback visible (en/ar) | ✓ (`fote.engineer@gmail.com`) |
| Submit button (en "Send inquiry" / ar "أرسل الاستفسار") | ✓ |
| Turnstile widget ready (`form[data-turnstile-ready]`, token obtained) | ✓ both locales (test-key state at run time — the real-key swap is staged in PR #35 `5a48852`; production re-verified after merge) |

## Admin (read-only round trip)

| Cell | Result |
|---|---|
| `/admin/login` → Sign in | ✓ → dashboard (73 unread / 147 total inquiries, 3 published case studies) |
| `/admin/inquiries` renders | ✓ (100 loaded, newest first) |
| Sign out | ✓ → back at `/admin/login` |

Note: admin dashboard copy contained a stray planning reference ("prompt-6 §4") — **fixed in `5a48852`**
(dashboard copy cleaned; re-verify in the post-merge Stage 2 pass).

## Pending cells (owner-input gated)

| Cell | Status |
|---|---|
| Real Turnstile keys (widget + secret swap + siteverify-negative 403 probe) | Stage 2 — **code staged in PR #35 (`5a48852`)**: single-mount widget + 45 s token waits landed on branch; production swap + probe pending merge & env provisioning (Vercel sitekey env + Edge Function secret) |
| Real inquiry → Resend email → inbox → archive | Stage 3 — pending; the last cell before the RUN_LOG launch row |
