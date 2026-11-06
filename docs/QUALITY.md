# Quality & Acceptance Specification — fotedev.me

**Project:** `fotedev/My-portfolio` · Portfolio + admin CMS for Ahmed Aboalayoun (`fotedev`)
**Status:** M0 spec (approved at GATE 1, applied at every GATE 2) · **Companion docs:** `docs/SEO-I18N.md`, `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT-MODEL.md`, `docs/OPERATIONS.md`, `docs/ROADMAP.md`, `.factory/PROTOCOL.md`
**Language of this document:** English only (locked rule).

---

## 1. Purpose and scope

This document defines **what "done and shippable" means** for every milestone and for launch: acceptance criteria, who owns each check (CI vs manual), what blocks a milestone, the responsive/device coverage, state coverage, the limited-JS policy, and the bilingual pre-launch manual test checklist.

Operating principle (locked): **"Skills advise, CI enforces. Never declare done with known defects; never fake success."** A passing checklist in this document is evidence-backed, not asserted.

---

## 2. Acceptance criteria

These are the launch-level acceptance criteria (source: locked decision set). Every milestone's GATE 2 evaluates the subset that its scope touches; all of them are evaluated at M6 before launch.

| # | Criterion | Verifiable meaning |
|---|---|---|
| **AC-1** | No known launch-blocking defects | At sign-off, the known-defects list is empty of items matching §5's blocker definition. Known non-blocking issues are tracked as labeled backlog issues — never silently accepted, never hidden. |
| **AC-2** | Critical journeys tested in EN + AR | Every journey in §10.A passes end-to-end in both locales (EN and AR), with evidence (screenshots/recordings) attached at GATE 2. |
| **AC-3** | Keyboard navigation + contrast | All interactive controls are reachable and operable by keyboard with visible focus; text and UI contrast meets WCAG 2.1 AA in both themes and both locales. Verified per §10.B–C. |
| **AC-4** | Mobile navigation and forms usable | Mobile nav opens/closes reliably; all forms (contact, admin) are completable on a phone-sized viewport with correct input types, labels, and inline errors; Turnstile renders and functions on mobile. Verified per §10.E. |
| **AC-5** | Loading / empty / error / success states defined | Every surface in §7's matrix has designed and implemented states; no spinner-forever, no blank-on-error, no fake success (revalidation failure is surfaced, per locked rule). |
| **AC-6** | Localized metadata, sitemap, OG | Head metadata, canonical, hreflang, `sitemap.xml`, and OG/Twitter cards are correct per locale per `docs/SEO-I18N.md` §4–§8; verified via view-source + sitemap diff in the checklist §10.G. |
| **AC-7** | Admin noindexed | `/admin/*` sends `X-Robots-Tag: noindex` and carries the meta noindex; preview deployments noindex everything (`docs/SEO-I18N.md` §7). Verified with `curl -I` on production and a real preview URL. |
| **AC-8** | Optimized media | All content images use `next/image` with explicit dimensions, modern formats (AVIF/WebP), lazy loading below the fold, `priority` only on the LCP hero; every image has EN+AR alt text (content model rule); source uploads respect Storage size/type limits. |
| **AC-9** | Limited JS on public pages | Public pages are static/ISR server-rendered; client JS is restricted to the allowed islands (§8); measured first-load JS meets the soft budget; Lighthouse Performance ≥ 90 mobile is the hard gate. |
| **AC-10** | Accessibility = automated **and** manual | axe-core runs in CI with zero critical/serious violations, **and** the manual checks in §10.B (keyboard), §10.C (contrast), §10.D (reduced motion) pass. Automation alone never satisfies AC-10. |

---

## 3. Gate ownership: CI vs manual

| Check | Owner | When | Blocking? |
|---|---|---|---|
| Lint / format | **CI** (GitHub Actions) | Every PR | Yes, from M2 |
| Typecheck — TypeScript strict, zero `any` | **CI** | Every PR | Yes, from M2 |
| Unit tests | **CI** | Every PR | Yes, from M2 |
| Production build (both locales) | **CI** | Every PR | Yes, from M2 |
| axe-core automated accessibility (component/page checks) | **CI** | Every PR from M3 | Yes — critical/serious violations block; moderate/minor become labeled issues |
| Lighthouse CI (all categories ≥ 90, mobile, lab conditions per `docs/SEO-I18N.md` §9) | **CI** at M6; manual lab runs from M3 (advisory) | M6 gate | Yes at M6 |
| Sitemap/robots generation sanity (indexable set correctness) | **CI** (build check) + manual spot check | PR from M3 / M6 | CI: structural errors block; content correctness is manual |
| Critical journeys EN+AR (§10.A) | **Manual** (Ahmed) | Each GATE 2 covering that surface; full pass at M6 | Yes |
| Keyboard navigation, focus visibility, no traps (§10.B) | **Manual** | M3, M4, M5 slices + M6 | Yes |
| Contrast AA, both themes × both locales (§10.C) | **Manual** | M3 + M6 | Yes |
| Reduced-motion behavior (§10.D) | **Manual** | M3 + M6 | Yes |
| Mobile nav / forms usability (§10.E) | **Manual** | M4 (contact) / M5 (admin) + M6 | Yes |
| RTL & Arabic rendering pass (§10.F) | **Manual** | M2 (shell) onward | Yes |
| Head metadata / hreflang / OG view-source checks (§10.G) | **Manual** | M3 + M6 | Yes |
| Admin noindex (`curl -I`, meta) (§10.G) | **Manual** | M5 + M6 | Yes |
| Content integrity vs evidence (§10.H) | **Manual** | M3 + M6 | Yes |
| Responsive coverage (§9) | **Manual** | Each UI milestone + M6 | Yes |

**CI owns anything machine-checkable; humans own judgment.** A green pipeline with no manual sign-off is not a passing gate.

---

## 4. What blocks a milestone (GATE 2 rules)

GATE 2 passes only when **all** of the following hold:

1. **CI is green** on the milestone branch and on `main` (lint, typecheck, unit, build, axe).
2. **Every acceptance criterion in §2 that the milestone touches** is met with recorded evidence (screenshots, test output, curl output, Lighthouse reports) in the PR/issue and the RUN_LOG row.
3. **Zero known launch-blocking defects** (definition in §5) in the shipped scope.
4. **Review rounds ≤ 2**; a third round escalates to Ahmed with the diff summary and failing evidence (per `.factory/PROTOCOL.md`).
5. **No fake success anywhere:** a failed revalidation, failed email notification, or failed write is reported as failed — success is only ever claimed from the actual result.

**Blockers (examples):** a critical journey broken in either locale; keyboard-dead controls on a core flow; AA contrast failure on primary text/controls; contact form failing silently or mis-reporting status; admin pages indexable; draft content leaking publicly; unverified claim published; RLS or secret-handling violation; revalidation faked; Lighthouse < 90 at M6.

**Non-blockers (become labeled backlog issues):** cosmetic polish with no functional impact; copy refinements already scheduled for GATE 2 (e.g., initial offer-line wording); perf above 90 but below stretch goals; nice-to-have enhancements (per-project OG images, extra viewport testing).

Waivers of a blocking criterion require **Ahmed's explicit approval**, logged in `.factory/BYPASS.md` with reason and risk. No silent waivers.

---

## 5. Definition: launch-blocking defect

A defect is **launch-blocking** if any of the following is true:

- A critical journey (§10.A) fails or misleads in **either** locale.
- Core content or controls are inaccessible (keyboard, contrast, screen-reader-annihilating markup on primary flows).
- The site shows a **wrong or unverifiable claim** (violates the no-invented-claims rule).
- Data, security, or privacy is compromised (RLS bypass, secret exposure, raw IP storage).
- The system **fakes success** (revalidation, form submission, publish).
- A write path fails **closed-but-silent** (user gets no clear outcome) or fails open.
- Unintended pages are indexable (`/admin`, previews, drafts).
- Public pages are unreadable/broken at any supported viewport ≥ 320px, in either theme, either locale.

Anything else is a tracked, labeled, prioritized issue — visible, never hidden.

---

## 6. Responsive breakpoint coverage

Breakpoints follow Tailwind defaults. The design must hold at the widths below, in **both locales (LTR and RTL)** and **both themes**, with no horizontal overflow at ≥ 320px.

| Band | Widths tested | Expectations |
|---|---|---|
| Small mobile | **320, 375, 414** | Single column; mobile nav drawer; stacked cards; forms full-width with correct keyboards (`type`, `autocomplete`); no clipped Arabic text; no overflow |
| Tablet portrait | **768** (`md`) | Mobile nav below `md`, desktop nav at `md`+; grids still stack or 2-up; contact form comfortable |
| Small laptop / tablet landscape | **1024** (`lg`) | Projects grid 2-up; content max-width containers engaged; footer columns |
| Desktop | **1280, 1440** (`xl`) | Full desktop nav; 2–3 column grids; hero metrics row |
| Wide | **1920** | Content capped by max-width container; no stretched full-bleed text lines |

Rules:

- Touch targets: recommended ≥ 44×44px on touch widths; never below the WCAG 2.2 minimum (24×24).
- `prefers-reduced-motion` respected at every width.
- RTL mirroring is checked at mobile **and** desktop widths — a mirrored layout can break in only one band.
- The testing matrix per milestone covers: {widths} × {EN, AR} × {dark, light} for the surfaces shipped in that milestone. Not every cross-product at every milestone — but **all journeys at M6** cross locale × theme at minimum on 375 and 1440.

---

## 7. State coverage matrix (loading / empty / error / success)

Every surface ships with all four states designed (`DESIGN.md` component states) before its milestone closes.

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Public pages (static/ISR) | Instant static render; Suspense skeleton for any dynamic section (e.g., featured projects) | n/a (static content) | Locale-aware 404 page; error boundary with retry hint | n/a |
| Images | Blur/dominant-color placeholder; explicit dimensions (no CLS) | Placeholder block with alt text | Broken-image fallback with alt text preserved | n/a |
| Contact form | Submitting: controls disabled + inline spinner | n/a | Inline field validation errors; server error with retry; rate-limit message; Turnstile failure message — all localized; after any failed attempt the Turnstile widget is reset and a fresh token obtained before retry (a consumed token cannot be reused) | Confirmation from **storage result** (never from email delivery), with the direct copyable email fallback visible |
| Admin tables (inquiries, projects, …) | Skeleton rows | "No X yet" with a create CTA | Error banner + retry | Toast on save/publish |
| Admin publish → revalidation | Publishing indicator | n/a | **Revalidation failure surfaced as an error — never fake success** (locked rule) | Success only when storage + revalidation both confirm |
| Admin auth | Login pending state | n/a | Wrong-credentials and expired-session messages; unsaved-changes guard on session expiry mid-edit | Redirect to dashboard |
| Availability/CV link (site settings) | n/a | Hidden or "not available" state when unset | n/a | Correct link when set |

---

## 8. Limited-JS policy for public pages

Public pages must stay fast and mostly-static. Concrete rules:

1. **No client-side data fetching on public routes.** All page content is server-rendered static/ISR (locked caching decision). Supabase reads happen at build/revalidate time only.
2. **Allowed client islands** (and effectively only these on public routes): theme init/toggle, mobile navigation toggle, contact form + Turnstile widget, language switcher (server-rendered links preferred), light Framer Motion entrances. The theme init is a tiny blocking inline script (zero-FOUC, per `DESIGN.md`).
3. No animation library wrapping whole route trees; motion is per-element and disabled under `prefers-reduced-motion`.
4. **Soft budget:** first-load JS ≤ ~200 KB gzip on Home / Projects / Project detail (measured from `next build`'s first-load report). Soft target reviewed at GATE 2 — the **hard gate is Lighthouse Performance ≥ 90 mobile** (`docs/SEO-I18N.md` §9).
5. No third-party scripts on public pages beyond what is functionally required (Turnstile on contact only; Vercel Analytics/Speed Insights as configured).

---

## 9. Media optimization policy

- All content imagery renders via `next/image` with explicit `width`/`height` (or `fill` in a sized container) — zero layout shift.
- Modern formats (AVIF/WebP) via Next's optimizer; source uploads sized sensibly (covers ~1600×900 class; keep source files well under the Storage upload limits defined in `docs/ARCHITECTURE.md`).
- LCP hero image: `priority`. Everything below the fold: lazy.
- **Alt text mandatory in EN and AR** for every published image (content model rule); purely decorative images use `alt=""` with presentation role.
- SVG restricted to UI icons/graphics; uploaded raster covers/photos for content imagery.
- OG images are fixed 1200×630 brand assets (see `docs/SEO-I18N.md` §6).

---

## 10. Pre-launch manual test checklist (bilingual — run every marked item in **EN and AR** unless noted)

Carried out by Ahmed (manual gate owner) at M6; milestone-sized subsets run at each GATE 2. Evidence (screenshots/notes) recorded in the milestone PR and the RUN_LOG.

### A. Critical journeys (each in EN and AR)

1. [ ] First visit → hero communicates the offer → primary CTA reaches Contact.
2. [ ] Projects index → featured/ordered list → open a case study → navigate back.
3. [ ] Language switch from an arbitrary deep page → equivalent path in the other locale (not the other home).
4. [ ] Theme toggle: dark↔light switches instantly, persists across reload, **no flash of wrong theme** on a hard refresh.
5. [ ] Contact form: valid submission → success state from storage result; invalid fields → localized inline errors; rate-limited → clear localized message; Turnstile failure → clear message; a failed attempt (rate limit, server error, Turnstile failure) resets the Turnstile widget and obtains a fresh token before retry; **direct copyable email fallback visible in all cases**.
6. [ ] Admin: log in (MFA-ready; enabled per `docs/OPERATIONS.md` §9) → create draft → preview (auth-gated) → publish → public page reflects the change within the documented revalidation target; failed revalidation is visibly reported, never faked.
7. [ ] 404: visit a bogus URL under `/en` and `/ar` → locale-aware not-found page.
8. [ ] Availability status and CV/social links render as configured in admin settings.

### B. Keyboard navigation

- [ ] Skip link is first focusable and works.
- [ ] Tab order is logical on every page type; focus is always visible (focus-visible ring per `DESIGN.md`).
- [ ] Mobile nav, language switcher, dialogs/modals are fully keyboard-operable; **no keyboard traps**; Escape closes overlays; focus returns to the trigger.
- [ ] Forms submit via keyboard; error focus management moves focus sensibly.
- [ ] Admin tables and actions keyboard-operable (arrow/Enter where designed).

### C. Contrast (both themes × both locales)

- [ ] Body text, muted text, and text-on-accent meet WCAG 2.1 AA (4.5:1 normal, 3:1 large) in dark **and** light themes.
- [ ] Focus rings meet 3:1 against adjacent colors in both themes.
- [ ] Icon-only buttons have accessible names (axe + manual spot check).
- [ ] Arabic text at its rendered weights/sizes passes the same thresholds (font can change effective legibility).

### D. Reduced motion

- [ ] With OS `prefers-reduced-motion: reduce`: entrances/transitions collapse to instant or opacity-only; no parallax/autoplay movement; page remains fully usable.

### E. Mobile UX (375px-class device or emulation)

- [ ] Mobile nav: opens/closes reliably, scroll-locks appropriately, links all reachable one-handed.
- [ ] Contact form: correct `input` types and `autocomplete` attributes; labels visible; inline errors localized; Turnstile renders and passes; no zoom-jump on focus (font-size ≥ 16px inputs).
- [ ] No horizontal scroll at 320px; sticky elements never cover form controls.
- [ ] Spot check on real iOS Safari and Android Chrome (not only emulation).

### F. RTL & Arabic rendering

- [ ] `<html lang="ar" dir="rtl">` on all `/ar` routes; layout mirrored via logical properties (checklists, cards, icons where directional).
- [ ] Arabic font stack applied (`IBM Plex Sans Arabic`); Latin tech terms inside Arabic text read correctly (bidi handled, no reversed strings).
- [ ] Numbers, metrics, and code snippets render legibly inside AR content.
- [ ] No clipped/truncated Arabic strings in buttons, cards, or metadata.

### G. Metadata, sitemap, noindex (see `docs/SEO-I18N.md` for the full SEO checklist)

- [ ] View-source on all seven page types × both locales: localized title/description, canonical, hreflang set (en/ar/x-default), OG/Twitter tags.
- [ ] `sitemap.xml` lists exactly the published indexable URLs with hreflang alternates; `robots.txt` correct.
- [ ] `curl -I https://fotedev.me/admin` → `x-robots-tag: noindex`; a real **preview deployment** URL → noindex on every route; no public page carries noindex.
- [ ] JSON-LD validates (zero errors) on Home, About, Contact in both locales; certificate fields match the PDF verbatim.

### H. Content integrity

- [ ] Every published claim traces to `docs/CONTENT-EVIDENCE.md` with a verified date/link; open PRs/issues labeled **open**; cert facts verbatim from the PDF.
- [ ] No "Father Of The Eyes" anywhere; brand is `fotedev`, identity is Ahmed Aboalayoun.
- [ ] Alt text present (EN+AR) for all published images; no placeholder/lorem content live.

### I. Performance & media spot checks

- [ ] `next build` first-load JS report reviewed against the §8 soft budget; no surprise client bundles on content routes.
- [ ] Hero image is `priority`/LCP-optimized; below-fold images lazy; no CLS from images or fonts (font subsets loaded with fallbacks).
- [ ] Final Lighthouse reports (per `docs/SEO-I18N.md` §9 lab conditions) attached: all four categories ≥ 90, mobile, both locales, all gated pages, recorded in RUN_LOG.

### J. Failure-path checks

- [ ] Simulate form backend failure (e.g., block the Edge Function): user gets a clear localized error; direct email fallback still usable.
- [ ] Simulate revalidation failure during publish: error is surfaced to the admin; public page behavior matches the documented fail-safe (cached page stays readable).
- [ ] Quota/limit behavior matches `docs/ARCHITECTURE.md`: writes fail closed with messages; public pages remain cached and readable.

---

## 11. Evidence and recording

- Every GATE 2 summary lists: CI run links, manual checklist status (sections covered), defects found (with blocker/non-blocker classification), and evidence paths.
- Milestone and launch rows are appended to `.factory/RUN_LOG.md` with measured data (dates, SHAs, scores, review rounds) — measured facts only, per the factory protocol.
- Screenshots/recordings for manual passes are attached to the milestone PR (or linked from it); nothing is "verified" without an artifact or an explicit command output.
