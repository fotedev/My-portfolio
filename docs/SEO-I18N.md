# SEO & I18N Specification — fotedev.me

**Project:** `fotedev/My-portfolio` · Portfolio + admin CMS for Ahmed Aboalayoun (`fotedev`)
**Status:** M0 spec (approved at GATE 1, refined per milestone) · **Applies from:** M2 (routing/shell), M3 (public SEO), M5 (admin noindex), M6 (audit + launch)
**Sources of truth:** `prompt-0.md` §2 (locked decisions), `prompt-1.md` §5.5, `docs/CONTENT-EVIDENCE.md` (claims), `docs/CONTENT-MODEL.md` (localized fields, fallback rules)
**Language of this document:** English only (locked rule).

---

## 1. Purpose and scope

This document defines how the site is structured, rendered, and described so that:

1. Search engines correctly index **both language versions** of every public page (`en`, `ar`), on the production domain `https://fotedev.me`.
2. Arabic is a first-class locale: full RTL rendering, localized metadata, localized social cards — not translated leftovers.
3. Nothing unintended is indexed: `/admin`, API routes, preview deployments, and draft previews are never indexable.
4. Performance is enforced, not hoped for: **Lighthouse ≥ 90 (mobile, lab conditions)** is a launch gate.

In scope: routing, language switching, canonical URLs, `hreflang`, localized `<head>` metadata, OpenGraph/Twitter cards, `sitemap.xml`, `robots.txt`, noindex rules, JSON-LD structured data, the Lighthouse gate, and the manual SEO process.

Out of scope: content writing itself (`docs/CONTENT-MODEL.md`, `Copywriter` subagent), analytics/Speed Insights setup (`docs/OPERATIONS.md`), admin UX.

---

## 2. Locked inputs (do not re-litigate)

| Input | Value |
|---|---|
| Production domain | `https://fotedev.me` (single canonical host; `www` 301-redirects to apex, or apex→`www` — pick one at M6 and never mix) |
| Locales | `en` (default, LTR) and `ar` (full RTL) via `next-intl` |
| Public identity | **Ahmed Aboalayoun**; brand `fotedev`. Never print "Father Of The Eyes". |
| Offer line (EN) | "Web applications and AI tools built around your business." |
| Offer line (AR) | "تطبيقات ويب وأدوات ذكاء اصطناعي مبنية حول عملك." (initial copy; refined at GATE 2) |
| Certificate | "One Million Prompters", proof `https://dub.ai/omp`. **Issuer, date, and wording must be read from the PDF itself — never from memory or filename.** |
| i18n content model | Shared base rows + per-language translation tables; **fallback EN with log** if AR missing; **publish requires both locales or an explicit EN-only flag** |
| Admin | Auth-gated, single admin, always non-indexable |

---

## 3. URL architecture and routing

### 3.1 Locale prefixes and default redirect

- Every public page exists under a locale prefix: `/en/...` and `/ar/...`. There is **no unprefixed content route**.
- Configuration: `next-intl` middleware with `localePrefix: 'always'`.
- **`/` → `/en`**: the root path issues a redirect to the default locale (307 from middleware; acceptable and standard). No page content is ever served at `/`.
- Unknown paths under a locale resolve to the locale-aware `not-found` page (404 status, noindex).
- No trailing slashes; lowercase paths; Vercel normalizes duplicates. Canonical URLs never carry query strings except where a filter is genuinely content (v1: none — filters are client-side, non-indexable).

### 3.2 Route map (v1)

| Route pattern | EN | AR | Notes |
|---|---|---|---|
| Home | `/en` | `/ar` | |
| Projects index | `/en/projects` | `/ar/projects` | |
| Project detail | `/en/projects/[slug]` | `/ar/projects/[slug]` | Published projects only; 404 otherwise |
| Services | `/en/services` | `/ar/services` | Standalone route (per `docs/ARCHITECTURE.md` §10 and `DESIGN.md` §10.6); included in sitemap |
| About (incl. certificate) | `/en/about` | `/ar/about` | |
| Contact | `/en/contact` | `/ar/contact` | |
| Privacy | `/en/privacy` | `/ar/privacy` | |
| Admin | `/admin` | n/a | Single-locale UI, auth-gated, noindex |
| Not found | `/en/not-found`, `/ar/not-found` | | 404 status + noindex |

### 3.3 Language switcher

- The switcher always targets the **equivalent path** in the other locale: `/en/projects/acme` ⇄ `/ar/projects/acme`. It never navigates to the other locale's home when the equivalent route exists.
- Dynamic segments (project slugs) are shared between locales (same `slug` column) unless the content model later introduces per-locale slugs; if it does, the switcher uses the per-locale slug from the translation row.
- **Graceful fallback:** if the AR version of a page is not published (EN-only flag), the `ar` switcher option links to the AR **projects index** (`/ar/projects`) rather than a 404. The EN-only page also omits the `ar` hreflang alternate (§5) and is listed in the sitemap with EN only (§8).
- The switcher is a real `<a>` (crawlable link), keyboard-operable, with `hreflang` attribute on the anchor and accessible name in the current UI language (e.g., "العربية" / "English").

### 3.4 Slugs and redirects

- Slugs are lowercase, hyphenated, ASCII, stable, and **immutable after publish** (locked content rule). A slug change after publish requires a 301 redirect entry (redirect map maintained in `docs/OPERATIONS.md` operations; implemented via middleware or Vercel redirects) and an updated sitemap.
- Case variants of a slug 301-redirect to the canonical lowercase slug.

### 3.5 Rendering and direction

- `lang` and `dir` are set per route: `<html lang="en" dir="ltr">` / `<html lang="ar" dir="rtl">`. Never a mismatch between content language and `lang` attribute.
- RTL layout uses logical CSS properties (`inline-start`/`inline-end`, logical margins); directional icons are mirrored; Arabic renders in the Arabic font stack (`IBM Plex Sans Arabic`) per `DESIGN.md`.
- Public pages are static or ISR (locked caching decision). No client-side fetching of page content on public routes.

---

## 4. Canonical URLs

- Every indexable page emits a self-referencing canonical URL: **absolute**, `https`, production host, no trailing slash, correct locale prefix. Example: the canonical of `/ar/projects/acme` is `https://fotedev.me/ar/projects/acme`.
- A canonical **never points across locales**; cross-language relationships are expressed only via `hreflang` (§5).
- Canonicals are emitted via App Router `generateMetadata` → `alternates.canonical` per locale and per route.
- Non-indexable routes (`/admin`, `/api`, previews, 404s) emit **no canonical** (they emit noindex instead, §7).
- No page may contain more than one canonical; canonical and OG `og:url` must match.

---

## 5. hreflang implementation

Requirements (Google's reciprocal-set rule):

1. **Every** URL in a language set must list **all** members of the set **including itself**.
2. Values: `en` and `ar` (language-only, since no regional variants are served), plus **`x-default` → the EN URL** (EN is the default locale for users with unmatched languages).
3. `x-default` is emitted on every page that has a full pair.

### 5.1 In the `<head>` (per page)

Emitted via `generateMetadata` → `alternates.languages`:

```html
<link rel="alternate" hreflang="en" href="https://fotedev.me/en/projects/acme" />
<link rel="alternate" hreflang="ar" href="https://fotedev.me/ar/projects/acme" />
<link rel="alternate" hreflang="x-default" href="https://fotedev.me/en/projects/acme" />
```

### 5.2 In `sitemap.xml`

The same alternates are emitted inside the sitemap as `xhtml:link` entries (Next.js `sitemap.ts` supports `alternates.languages` natively):

```xml
<url>
  <loc>https://fotedev.me/en/projects/acme</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://fotedev.me/en/projects/acme"/>
  <xhtml:link rel="alternate" hreflang="ar" href="https://fotedev.me/ar/projects/acme"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://fotedev.me/en/projects/acme"/>
</url>
```

Head tags and sitemap alternates **must match exactly** for every URL — verified in the pre-launch checklist (§13).

### 5.3 EN-only pages

A page published with the explicit EN-only flag: no `ar` alternate anywhere (head or sitemap), no `x-default` cross-pointing issue (x-default still points to the EN self URL), and the language switcher falls back per §3.3.

---

## 6. Localized metadata and social cards

### 6.1 Rules

- All `<head>` text (title, description, OG, Twitter) is **generated per locale** from the localized content rows — never English-only strings rendered on `/ar`.
- Title template: EN `%s | Ahmed Aboalayoun`; AR `%s | أحمد أبو العيون` (initial copy — confirm at GATE 2; the Arabic personal name is not PDF-verified, per `docs/CONTENT-MODEL.md` §2.1). Home uses `title.absolute` (no template suffix).
- Meta description: per-locale, human-written, ≤ ~160 characters, derived from the page's localized content (hero copy, project summary). Descriptions are never machine-flipped between locales.
- `og:site_name`: `fotedev`. `og:type`: `website` for all v1 pages. `og:url`: same as canonical. `og:locale`: `en_US` / `ar_EG`.
- OG images: two static brand images, `1200×630`, one per locale with correctly rendered text: `/og/og-default-en.png` and `/og/og-default-ar.png`. Referenced by **absolute URL**. Per-project OG images are a backlog enhancement, not a launch requirement.
- Twitter cards: `twitter:card = summary_large_image` on home, projects index, and project detail; `summary` is acceptable on about/contact/privacy. `twitter:site`/`twitter:creator` are set **only** if a verified handle exists in site settings — do not invent handles.
- No metadata on noindex routes (§7).

### 6.2 Per-page metadata table

| Page | EN path | AR path | Title (EN) | Title (AR, initial) | Description source | Canonical | OG image | JSON-LD | Indexable |
|---|---|---|---|---|---|---|---|---|---|
| Home | `/en` | `/ar` | `Ahmed Aboalayoun — Full-Stack AI Engineer` (absolute) | AR equivalent (absolute) | Hero/offer copy (`site_settings` hero per locale) | self | `og-default-{en,ar}.png` | `Person` + `ProfessionalService` | Yes |
| Projects index | `/en/projects` | `/ar/projects` | `Projects — Ahmed Aboalayoun` | `المشاريع — ...` (initial) | Static per-locale string in the locale files | self | `og-default-{en,ar}.png` | — | Yes |
| Project detail | `/en/projects/[slug]` | `/ar/projects/[slug]` | `{Project title} — Ahmed Aboalayoun` | Localized project title | `project_translations.summary` per locale | self | `og-default-{en,ar}.png` (per-project OG = backlog) | — | Yes (published only) |
| Services | `/en/services` | `/ar/services` | `Services — Ahmed Aboalayoun` | `الخدمات — ...` (initial) | Static per-locale string in the locale files | self | `og-default-{en,ar}.png` | — | Yes |
| About | `/en/about` | `/ar/about` | `About — Ahmed Aboalayoun` | `نبذة عني — ...` (initial) | About intro copy per locale | self | `og-default-{en,ar}.png` | `Person` (with credential) | Yes |
| Contact | `/en/contact` | `/ar/contact` | `Contact — Ahmed Aboalayoun` | `تواصل — ...` (initial) | Contact intro copy per locale | self | `og-default-{en,ar}.png` | `ProfessionalService` | Yes |
| Privacy | `/en/privacy` | `/ar/privacy` | `Privacy Policy — Ahmed Aboalayoun` | `سياسة الخصوصية — ...` (initial) | Legal copy per locale | self | `og-default-{en,ar}.png` | — | Yes |

Excluded from all of the above (see §7): `/admin/*`, `/api/*`, preview deployments, draft previews, 404 pages.

---

## 7. Sitemap, robots.txt, and noindex rules

### 7.1 `sitemap.xml` (generated: `app/sitemap.ts`)

- Lists **only** production, published, indexable URLs — both locales, with `xhtml:link` hreflang alternates (§5.2) and `lastmod` from each row's update timestamp.
- Never lists: `/`, `/admin/*`, `/api/*`, draft or unpublished projects, 404s, or any preview/alternative host.
- Includes the standalone `services` route (`/en/services`, `/ar/services`) with its full hreflang pair (§5.2).
- Regenerated on deploy; content changes trigger revalidation so `lastmod` stays truthful.

### 7.2 `robots.txt` (generated: `app/robots.ts`)

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://fotedev.me/sitemap.xml
```

Important nuance (stated so nobody "simplifies" it later): `Disallow` in robots.txt **prevents crawling, not indexing**. A disallowed URL that is linked from elsewhere can still appear in results. That is why each sensitive route **also** sends an explicit noindex signal as below.

### 7.3 Noindex rules

| Target | Mechanism |
|---|---|
| `/admin/*` | `X-Robots-Tag: noindex, nofollow` response header (middleware matcher) **and** `<meta name="robots" content="noindex">` in the admin layout. Belt and braces. Applied in every environment. |
| Preview deployments (any non-production Vercel environment) | Middleware sets `X-Robots-Tag: noindex, nofollow` on **all** responses when `process.env.VERCEL_ENV !== 'production'`. Verified on a real preview URL at M2. |
| Draft previews of unpublished content | Auth-gated **and** covered by the preview noindex above; additionally excluded from sitemap by definition. |
| `/api/*` | Not HTML; covered by robots disallow + no non-HTML URLs in the sitemap. |
| 404 / not-found pages | Returned with 404 status; locale-aware custom page; noindex meta. |

Verification method: `curl -I https://<host>/admin` (and a preview URL) must show `x-robots-tag: noindex`; production public URLs must **not** show it.

---

## 8. Structured data (JSON-LD)

Emitted as `<script type="application/ld+json">` from server components. Only **verified facts** are serialized (locked rule: no invented claims — cross-check `docs/CONTENT-EVIDENCE.md`).

### 8.1 `Person` — pages: Home, About

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Ahmed Aboalayoun",
  "alternateName": "fotedev",
  "url": "https://fotedev.me/en",
  "jobTitle": "Full-Stack AI Engineer",
  "knowsLanguage": ["en", "ar"],
  "sameAs": ["<only URLs verified in site_settings.socials>"],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "name": "<verbatim program name from the PDF>",
    "url": "https://dub.ai/omp",
    "credentialCategory": "certification"
  }
}
```

**Certificate validity rules (locked):**
- `name`, and any issuer/date fields, are copied **verbatim from `ahmed-aboalyoun-certificate.pdf`** (read by the M1 `Certificate Reader`; recorded in `docs/CONTENT-EVIDENCE.md`). Never from memory, never from the filename.
- If the PDF does not state a field (e.g., issuer organization), that field is **omitted**, not guessed. No `issuedBy` unless the PDF names it.
- `url` is the proof reference `https://dub.ai/omp`; it must resolve (checked at each pre-launch audit).

### 8.2 `ProfessionalService` — pages: Home, Contact

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "fotedev",
  "url": "https://fotedev.me/en",
  "description": "<localized one-line offer>",
  "email": "<CONTACT_EMAIL from site settings>",
  "areaServed": ["Egypt", "Gulf states", "International"],
  "knowsLanguage": ["en", "ar"],
  "founder": { "@type": "Person", "name": "Ahmed Aboalayoun" }
}
```

**Never include:** address or phone (none published), `aggregateRating`, review markup, awards, or client logos — nothing unverified. The `email` is read from admin-editable site settings (starts as `fote.engineer@gmail.com`).

### 8.3 Rich-result validity notes

- Google's supported rich-result types do **not** include a "certificate" result; `hasCredential` on `Person` is valid schema.org and will not produce a special Google rich result. That is expected and fine — the requirement is **valid, error-free markup**, not guaranteed snippets.
- Validation: run every JSON-LD-bearing page through the **Google Rich Results Test** and/or `validator.schema.org` — zero errors; investigate every warning. Re-validate after any content change that touches these pages (Home, About, Contact, both locales).
- Markup must match visible on-page content (no invisible-facts markup).

---

## 9. Lighthouse ≥ 90 mobile gate (lab conditions, documented)

The locked decision is **Lighthouse ≥ 90 on mobile**. It is measured, recorded, and enforced — not estimated.

### 9.1 Gate definition

| Item | Requirement |
|---|---|
| Categories gated | **Performance, Accessibility, Best Practices, SEO — each ≥ 90** (median of runs) |
| Device | Lighthouse default mobile emulation (Moto G-class), 4× CPU slowdown, Slow 4G |
| Pages audited | Home, projects index, one published project detail, about, contact — **in both EN and AR** (Arabic fonts/RTL can shift scores; both directions are gated) |
| Runs | 3 per page per locale; report the median, record all runs |
| Threshold failure | Any category < 90 on any gated page = gate failure → fix or escalate; **never silently lower the bar** |

### 9.2 Documented lab conditions (record with every measurement)

1. **Build type:** production build only (`next build` + `next start`, or the deployed Vercel build). `next dev` results are meaningless and never recorded.
2. **Browser:** Chrome stable, headless CLI (or Incognito window), extensions disabled, fresh profile.
3. **Cache:** cold cache per run.
4. **Environment:** same machine/network class each time; note it.
5. **Recorded in `.factory/RUN_LOG.md`:** date, commit SHA, deploy/URL, per-page per-locale scores, all three runs.

### 9.3 Enforcement timeline

- **M3 onward:** manual Lighthouse runs as an advisory signal on new public pages.
- **M6:** Lighthouse CI configured in the pipeline (per `docs/ROADMAP.md`); the ≥ 90 gate is blocking for launch. Final production-host scores are recorded in the RUN_LOG and shown at GATE 2.

---

## 10. Explicit note: no SEO skill exists

**There is no SEO skill in the local catalog (`C:\Users\FOTE\.agents\skills`).** Per the locked decision ("There is no SEO skill — do it manually") and the factory rules (skills advise, CI enforces):

- SEO work is executed **manually against this document**; the checklist in §13 is the process control.
- The **Lighthouse CI gate in M6** is the automated enforcement.
- Do not wait for, search for, or invent an SEO skill. If a relevant skill appears in the catalog later, it is advisory only and never replaces this spec or the gate.

---

## 11. Next.js implementation map

| Requirement | Mechanism |
|---|---|
| `/en` `/ar` routing, `/` → `/en` | `next-intl` middleware, `localePrefix: 'always'`, root redirect |
| Localized metadata + alternates | `generateMetadata({ params: { locale } })` per route; `alternates: { canonical, languages: { en, ar, 'x-default' } }` |
| OG / Twitter cards | Metadata `openGraph` / `twitter` objects; static OG images in `/public/og/` |
| `sitemap.xml` with hreflang | `app/sitemap.ts` with `alternates.languages` + `lastModified` |
| `robots.txt` | `app/robots.ts` |
| Admin noindex | Middleware header + admin layout meta |
| Preview noindex | Middleware conditional on `VERCEL_ENV` |
| JSON-LD | Server-component `<script type="application/ld+json">` |
| `lang`/`dir` | Root layout per locale segment |

---

## 12. Validation tooling (manual, free)

- **View-source checks** for head tags (title/description/canonical/hreflang/OG) per locale.
- `curl -I` for `X-Robots-Tag` headers (admin, previews, public pages).
- **Google Rich Results Test** / `validator.schema.org` for JSON-LD.
- **Google Search Console** (and Bing Webmaster Tools): verify `fotedev.me`, submit `sitemap.xml`, monitor coverage after launch.
- OG card preview (e.g., a card debugger) to confirm images render.

---

## 13. Manual pre-launch SEO checklist (executed in M6; any failure blocks launch)

**Domain & routing**
- [ ] `https://fotedev.me` serves the site over valid TLS; single canonical host (apex vs `www`) decided and 301-enforced.
- [ ] `/` redirects to `/en`; no page content at `/`; no redirect chains (max 1 hop to final URL).
- [ ] All internal links are locale-aware absolute-or-root-relative links; no bare `/` content links inside pages.

**Head tags (check both locales on all seven page types)**
- [ ] Unique, localized `<title>` per page (template correct; home uses absolute title).
- [ ] Unique, localized meta description ≤ ~160 chars; correct language on `/ar` pages.
- [ ] `lang`/`dir` attributes match page language (`en/ltr`, `ar/rtl`).

**hreflang**
- [ ] Every indexable page emits the full reciprocal set: `en`, `ar`, self-included, plus `x-default` → EN URL.
- [ ] EN-only pages omit the `ar` alternate (head and sitemap) consistently.
- [ ] Head alternates match sitemap alternates exactly (no orphans, no stale slugs).

**Canonicals**
- [ ] Self-referencing absolute canonical on every indexable page; matches `og:url`; no cross-locale canonicals; no duplicates.

**Social cards**
- [ ] OG/Twitter tags present and localized per page; `og:image` absolute URL, 1200×630, renders correctly in a card debugger for EN and AR.
- [ ] `twitter:card` correct per page type; no invented handles.

**Structured data**
- [ ] JSON-LD validates with zero errors (Rich Results Test / schema.org validator) on Home, About, Contact — both locales.
- [ ] Certificate facts in `hasCredential` match the PDF **verbatim**; proof URL `https://dub.ai/omp` resolves; unverifiable fields omitted.
- [ ] No unverified claims in any markup (cross-checked against `docs/CONTENT-EVIDENCE.md`).

**Sitemap & robots**
- [ ] `sitemap.xml` reachable, contains exactly the published indexable URLs of both locales, with `lastmod`; nothing extraneous.
- [ ] `robots.txt` reachable, correct disallows, correct `Sitemap:` line.
- [ ] `sitemap.xml` submitted in Search Console; no coverage errors on the seven page types.

**Noindex**
- [ ] `curl -I` on `/admin` shows `x-robots-tag: noindex` in production.
- [ ] A real preview deployment shows noindex on all routes.
- [ ] No public page accidentally carries noindex.

**Slugs & redirects**
- [ ] All published slugs lowercase/hyphenated/stable; no post-publish slug changes; redirect map empty or entries verified as 301.

**Performance gate**
- [ ] Lighthouse ≥ 90 (all four categories, mobile, documented lab conditions §9) on all gated pages in EN and AR; scores recorded in RUN_LOG.

**Post-launch (first week)**
- [ ] Search Console coverage: both locales indexed; hreflang errors = 0.
- [ ] Spot-check a real SERP entry for title/description correctness.
