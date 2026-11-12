# M6 — SEO & i18n audit of live https://fotedev.me

Audited: 2026-11-10 (build 4a66233, Vercel project fotedev-portfolio). Pre-launch baseline on the current build.

## Scope discovered from src/app

Public routes = everything under `src/app/(public)/[locale]` (admin tree `(admin)/admin/**` excluded):

- `/[locale]` (home), `/about`, `/contact`, `/privacy`, `/projects`, `/projects/[slug]`, `/services`
- Case-study slugs on the live build (from sitemap.xml): `masar-x`, `ghost`, `khalat`
- Audited URLs: 9 paths × 2 locales = **18 pages**, all fetched live (HTTP 200).

## Method & exact commands (Windows PowerShell 5.1)

```powershell
# page fetches (18x, one per URL):
curl.exe -sS -D .factory/evidence/m6/html/en_<page>_headers.txt -o .factory/evidence/m6/html/en_<page>.html https://fotedev.me/en/<page>
# same for /ar; pages: '', about, contact, privacy, projects, services, projects/masar-x, projects/ghost, projects/khalat
curl.exe -sS -D - -o NUL https://fotedev.me/            # root redirect
curl.exe -sS -D - -o NUL https://www.fotedev.me/        # www redirect
curl.exe -sS -D <f> -o <f> https://fotedev.me/robots.txt /sitemap.xml /favicon.ico /icon.svg /manifest*
curl.exe -sS -D .factory/evidence/m6/html/404_en_headers.txt -o .factory/evidence/m6/html/404_en.html https://fotedev.me/en/nonexistent-page-xyz
curl.exe -sS -D .factory/evidence/m6/html/404_ar_headers.txt -o .factory/evidence/m6/html/404_ar.html https://fotedev.me/ar/nonexistent-page-xyz
# parsing: python 3.13 + lxml — .factory/evidence/m6/parse_pages.py (head/meta/link/JSON-LD/h1 extraction → parsed.json),
#           .factory/evidence/m6/deep_parse.py (JSON-LD validation, 404 detail, icon links); this table was generated from parsed.json
```

## Summary

- Page-level checks: 14 checks × 18 pages = **252** → **172 PASS / 80 FAIL**
- Site-level checks: **11** → **9 PASS / 2 FAIL**
- **Total: 181 PASS / 82 FAIL** across 263 recorded checks

Distinct FAIL root causes (6):

1. **HTTP `Link` header x-default lacks the locale prefix** (18/18 pages) — header says `hreflang="x-default" href="https://fotedev.me/about"` while HTML hreflang and sitemap say `https://fotedev.me/en/about`. The header URL only 307-redirects to the /en variant instead of returning 200. en/ar entries in the header are correct.
2. **`og:locale:alternate` absent on all 18 pages** (required by the audit spec).
3. **`og:image` present only on the 2 home pages** — `opengraph-image.tsx` exists only at `(public)/[locale]/` root, so the other 16 pages have no og:image (and no twitter:image).
4. **`twitter:image` present only on the 2 home pages** (same root cause as #3; non-home pages use card=`summary` without image).
5. **JSON-LD missing on 12/18 pages** — present & valid only on home (Person + ProfessionalService), about (Person), contact (ProfessionalService) in both locales; privacy, projects, services and all 3 case studies have none.
6. **`/favicon.ico` returns HTTP 500** (X-Matched-Path: /[locale] — rewritten into the locale route and erroring) and **no web app manifest exists**.

## Page-level verification table

Values are observed on the live HTML (evidence file per row: `.factory/evidence/m6/html/<key>.html` + `<key>_headers.txt`).

| # | page (key = locale_slug) | status | title | description | canonical | hreflang html | hreflang http header | og core | og image | og locale alternate | twitter card | twitter image | robots meta | json ld | h1 sanity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | en_home | PASS (HTTP/1.1 200 OK) | PASS (len=41, unique=yes — 'Ahmed Aboalayoun — Full-Stack AI Engineer') | PASS (len=185) | PASS (https://fotedev.me/en) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/' ≠ HTML 'https://fotedev.me/e…) | PASS (all 5 present, og:locale=en_US, og:url=self) | PASS (https://fotedev.me/en/opengraph-image-o1kegr?aeef8d68977f1871) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary_large_image) | PASS (present) | PASS (no robots meta → default index,follow) | PASS (valid JSON, @type=['Person', 'ProfessionalService']) | PASS (1 h1: 'Web applications and AI tools built around your business.') |
| 2 | en_about | PASS (HTTP/1.1 200 OK) | PASS (len=24, unique=yes — 'About \| Ahmed Aboalayoun') | PASS (len=194) | PASS (https://fotedev.me/en/about) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/about' ≠ HTML 'https://fotedev…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | PASS (valid JSON, @type=['Person']) | PASS (1 h1: 'About') |
| 3 | en_contact | PASS (HTTP/1.1 200 OK) | PASS (len=26, unique=yes — 'Contact \| Ahmed Aboalayoun') | PASS (len=110) | PASS (https://fotedev.me/en/contact) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/contact' ≠ HTML 'https://foted…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | PASS (valid JSON, @type=['ProfessionalService']) | PASS (1 h1: 'Contact') |
| 4 | en_privacy | PASS (HTTP/1.1 200 OK) | PASS (len=33, unique=yes — 'Privacy policy \| Ahmed Aboalayoun') | PASS (len=102) | PASS (https://fotedev.me/en/privacy) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/privacy' ≠ HTML 'https://foted…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'Privacy policy') |
| 5 | en_projects | PASS (HTTP/1.1 200 OK) | PASS (len=27, unique=yes — 'Projects \| Ahmed Aboalayoun') | PASS (len=89) | PASS (https://fotedev.me/en/projects) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects' ≠ HTML 'https://fote…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'Projects') |
| 6 | en_services | PASS (HTTP/1.1 200 OK) | PASS (len=27, unique=yes — 'Services \| Ahmed Aboalayoun') | PASS (len=101) | PASS (https://fotedev.me/en/services) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/services' ≠ HTML 'https://fote…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'Services') |
| 7 | en_projects_masar-x | PASS (HTTP/1.1 200 OK) | PASS (len=26, unique=yes — 'Masar X \| Ahmed Aboalayoun') | PASS (len=147) | PASS (https://fotedev.me/en/projects/masar-x) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects/masar-x' ≠ HTML 'http…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'Masar X') |
| 8 | en_projects_ghost | PASS (HTTP/1.1 200 OK) | PASS (len=24, unique=yes — 'ghost \| Ahmed Aboalayoun') | PASS (len=283) | PASS (https://fotedev.me/en/projects/ghost) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects/ghost' ≠ HTML 'https:…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'ghost') |
| 9 | en_projects_khalat | PASS (HTTP/1.1 200 OK) | PASS (len=25, unique=yes — 'Khalat \| Ahmed Aboalayoun') | PASS (len=297) | PASS (https://fotedev.me/en/projects/khalat) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects/khalat' ≠ HTML 'https…) | PASS (all 5 present, og:locale=en_US, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. ar_EG)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'Khalat') |
| 10 | ar_home | PASS (HTTP/1.1 200 OK) | PASS (len=43, unique=yes — 'أحمد أبو العيون — مهندس ذكاء اصطناعي متكامل') | PASS (len=151) | PASS (https://fotedev.me/ar) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/' ≠ HTML 'https://fotedev.me/e…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | PASS (https://fotedev.me/ar/opengraph-image-o1kegr?aeef8d68977f1871) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary_large_image) | PASS (present) | PASS (no robots meta → default index,follow) | PASS (valid JSON, @type=['Person', 'ProfessionalService']) | PASS (1 h1: 'تطبيقات ويب وأدوات ذكاء اصطناعي مبنية حول عملك.') |
| 11 | ar_about | PASS (HTTP/1.1 200 OK) | PASS (len=22, unique=yes — 'نبذة \| أحمد أبو العيون') | PASS (len=156) | PASS (https://fotedev.me/ar/about) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/about' ≠ HTML 'https://fotedev…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | PASS (valid JSON, @type=['Person']) | PASS (1 h1: 'نبذة') |
| 12 | ar_contact | PASS (HTTP/1.1 200 OK) | PASS (len=23, unique=yes — 'تواصل \| أحمد أبو العيون') | PASS (len=104) | PASS (https://fotedev.me/ar/contact) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/contact' ≠ HTML 'https://foted…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | PASS (valid JSON, @type=['ProfessionalService']) | PASS (1 h1: 'تواصل') |
| 13 | ar_privacy | PASS (HTTP/1.1 200 OK) | PASS (len=32, unique=yes — 'سياسة الخصوصية \| أحمد أبو العيون') | PASS (len=86) | PASS (https://fotedev.me/ar/privacy) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/privacy' ≠ HTML 'https://foted…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'سياسة الخصوصية') |
| 14 | ar_projects | PASS (HTTP/1.1 200 OK) | PASS (len=26, unique=yes — 'المشاريع \| أحمد أبو العيون') | PASS (len=74) | PASS (https://fotedev.me/ar/projects) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects' ≠ HTML 'https://fote…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'المشاريع') |
| 15 | ar_services | PASS (HTTP/1.1 200 OK) | PASS (len=25, unique=yes — 'الخدمات \| أحمد أبو العيون') | PASS (len=78) | PASS (https://fotedev.me/ar/services) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/services' ≠ HTML 'https://fote…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'الخدمات') |
| 16 | ar_projects_masar-x | PASS (HTTP/1.1 200 OK) | PASS (len=25, unique=yes — 'Masar X \| أحمد أبو العيون') | PASS (len=142) | PASS (https://fotedev.me/ar/projects/masar-x) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects/masar-x' ≠ HTML 'http…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'Masar X') |
| 17 | ar_projects_ghost | PASS (HTTP/1.1 200 OK) | PASS (len=23, unique=yes — 'ghost \| أحمد أبو العيون') | PASS (len=283) | PASS (https://fotedev.me/ar/projects/ghost) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects/ghost' ≠ HTML 'https:…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'ghost') |
| 18 | ar_projects_khalat | PASS (HTTP/1.1 200 OK) | PASS (len=24, unique=yes — 'Khalat \| أحمد أبو العيون') | PASS (len=229) | PASS (https://fotedev.me/ar/projects/khalat) | PASS (complete set, correct URLs) | **FAIL** (header x-default='https://fotedev.me/projects/khalat' ≠ HTML 'https…) | PASS (all 5 present, og:locale=ar_EG, og:url=self) | **FAIL** (no og:image on page) | **FAIL** (absent (expected other locale, e.g. en_US)) | PASS (card=summary) | **FAIL** (no twitter:image (card=summary without image)) | PASS (no robots meta → default index,follow) | **FAIL** (no application/ld+json on page) | PASS (1 h1: 'Khalat') |

### Legend / thresholds used

- title PASS = present, unique across all 18 pages, ≤60 chars. description PASS = present (length recorded; see advisories).
- canonical PASS = exactly one `<link rel="canonical">` equal to the page's own apex URL `https://fotedev.me/{en|ar}/…` (no www).
- hreflang (HTML) PASS = complete set {en, ar, x-default}, en→/en…, ar→/ar…, x-default→/en variant. hreflang (HTTP header) PASS additionally requires header x-default == /en URL.
- og core PASS = og:title, og:description, og:url (=canonical), og:type=website, og:locale (en_US / ar_EG) all present.
- robots meta PASS = tag absent (default index,follow) or present without noindex.
- JSON-LD PASS = ≥1 `application/ld+json` script that parses as valid JSON; types listed.
- h1 PASS = exactly one h1 with meaningful text.

## Observed per-page values (compact, for cross-checking)

| page | title (len) | description (len) | canonical | og:locale | h1 |
|---|---|---|---|---|---|
| en_home | Ahmed Aboalayoun — Full-Stack AI Engineer (41) | Full-Stack AI Engineer building production web … (185) | https://fotedev.me/en | en_US | Web applications and AI tools built around your business. |
| en_about | About \| Ahmed Aboalayoun (24) | I'm Ahmed Aboalayoun (fotedev), a Full-Stack AI… (194) | https://fotedev.me/en/about | en_US | About |
| en_contact | Contact \| Ahmed Aboalayoun (26) | Use the form below or email me directly — both … (110) | https://fotedev.me/en/contact | en_US | Contact |
| en_privacy | Privacy policy \| Ahmed Aboalayoun (33) | This policy explains what happens to data on fo… (102) | https://fotedev.me/en/privacy | en_US | Privacy policy |
| en_projects | Projects \| Ahmed Aboalayoun (27) | Selected case studies. Every claim on these pag… (89) | https://fotedev.me/en/projects | en_US | Projects |
| en_services | Services \| Ahmed Aboalayoun (27) | Three engagements, each ending in something you… (101) | https://fotedev.me/en/services | en_US | Services |
| en_projects_masar-x | Masar X \| Ahmed Aboalayoun (26) | Bilingual AI study platform: semantic PDF searc… (147) | https://fotedev.me/en/projects/masar-x | en_US | Masar X |
| en_projects_ghost | ghost \| Ahmed Aboalayoun (24) | Open-source CLI (28 stars) that resets device a… (283) | https://fotedev.me/en/projects/ghost | en_US | ghost |
| en_projects_khalat | Khalat \| Ahmed Aboalayoun (25) | Production commerce and ordering web applicatio… (297) | https://fotedev.me/en/projects/khalat | en_US | Khalat |
| ar_home | أحمد أبو العيون — مهندس ذكاء اصطناعي متكامل (43) | مهندس ذكاء اصطناعي متكامل يبني تطبيقات ويب إنتا… (151) | https://fotedev.me/ar | ar_EG | تطبيقات ويب وأدوات ذكاء اصطناعي مبنية حول عملك. |
| ar_about | نبذة \| أحمد أبو العيون (22) | أنا أحمد أبو العيون (fotedev)، مهندس ذكاء اصطنا… (156) | https://fotedev.me/ar/about | ar_EG | نبذة |
| ar_contact | تواصل \| أحمد أبو العيون (23) | استخدم النموذج أدناه أو راسلني مباشرة — كلاهما … (104) | https://fotedev.me/ar/contact | ar_EG | تواصل |
| ar_privacy | سياسة الخصوصية \| أحمد أبو العيون (32) | تشرح هذه السياسة ما يحدث للبيانات على fotedev.m… (86) | https://fotedev.me/ar/privacy | ar_EG | سياسة الخصوصية |
| ar_projects | المشاريع \| أحمد أبو العيون (26) | دراسات حالة مختارة. كل جملة على هذه الصفحات لها… (74) | https://fotedev.me/ar/projects | ar_EG | المشاريع |
| ar_services | الخدمات \| أحمد أبو العيون (25) | ثلاثة أنواع تعاقد، كلٌّ منها ينتهي بشيء تملكه: … (78) | https://fotedev.me/ar/services | ar_EG | الخدمات |
| ar_projects_masar-x | Masar X \| أحمد أبو العيون (25) | منصة دراسية ذكية ثنائية اللغة: بحث دلالي في ملف… (142) | https://fotedev.me/ar/projects/masar-x | ar_EG | Masar X |
| ar_projects_ghost | ghost \| أحمد أبو العيون (23) | أداة سطر أوامر مفتوحة المصدر (28 نجمة) تعيد ضبط… (283) | https://fotedev.me/ar/projects/ghost | ar_EG | ghost |
| ar_projects_khalat | Khalat \| أحمد أبو العيون (24) | تطبيق ويب إنتاجي للتجارة والطلبات، بُني ويُشغَّ… (229) | https://fotedev.me/ar/projects/khalat | ar_EG | Khalat |

## JSON-LD detail (the 6 pages that have it)

| page | @type | url field inside JSON-LD | note |
|---|---|---|---|
| en_home | Person + ProfessionalService | both `https://fotedev.me/en` | valid JSON |
| ar_home | Person + ProfessionalService | both `https://fotedev.me/en` | valid JSON; url not localized (advisory) |
| en_about | Person | `https://fotedev.me/en` | valid JSON |
| ar_about | Person | `https://fotedev.me/en` | valid JSON; url not localized (advisory) |
| en_contact | ProfessionalService | `https://fotedev.me/en` | valid JSON |
| ar_contact | ProfessionalService | `https://fotedev.me/en` | valid JSON; url not localized (advisory) |

All 10 JSON-LD scripts parse as valid JSON (`deep_parse.py` output in evidence). Schema types found: `Person`, `ProfessionalService` (+ nested `EducationalOccupationalCredential`, `Person`). No `BreadcrumbList`, `WebSite`, `WebPage`, `Article`/`CreativeWork` on any page.

## Site-level verification table

| # | check | verdict | observed evidence |
|---|---|---|---|
| 1 | robots.txt: public allowed, /admin+/api disallowed, Sitemap directive | PASS | GET /robots.txt → 200; body: User-Agent: * / Allow: / / Disallow: /admin / Disallow: /api / Sitemap: https://fotedev.me/sitemap.xml (html/robots.txt) |
| 2 | sitemap.xml: valid XML | PASS | lxml etree.parse OK; root urlset with sitemap+XHTML namespaces; 18 <url> entries (html/sitemap.xml) |
| 3 | sitemap.xml: all public routes × both locales | PASS | 18/18 expected entries present: 6 static paths (home, projects, services, about, contact, privacy) × 2 + 3 case-study slugs (masar-x, ghost, khalat) × 2; no /admin or /api entries |
| 4 | sitemap.xml: URLs correct (apex, per-locale) + hreflang alternates | PASS | every <loc> is https://fotedev.me/{en\|ar}[...] (no www); each entry carries xhtml:link alternates en/ar/x-default, x-default→/en variant; lastmod 2026-11-10T00:53:04.377Z (static) / 2026-11-07 (case studies) |
| 5 | favicon.ico presence | **FAIL** | GET /favicon.ico → HTTP 500 Internal Server Error (headers: X-Matched-Path: /[locale], X-Powered-By: Next.js) — middleware rewrites .ico into the locale route and it errors; headers observed live via curl -D -, 500 error-page body saved as html/favicon.ico |
| 6 | icon / link rel=icon presence | PASS | GET /icon.svg → 200 image/svg+xml; HTML head has <link rel="icon" href="/icon.svg?icon.0d2pkwnfrm0e7.svg" sizes="any" type="image/svg+xml"/> |
| 7 | web app manifest presence | **FAIL** | no manifest route in src/app, no <link rel="manifest"> in any fetched HTML; GET /manifest → 307 → /en/manifest → 404; GET /manifest.webmanifest → 307 → /en/manifest.webmanifest |
| 8 | 404 behavior /en/nonexistent-page-xyz | PASS | HTTP/1.1 404 Not Found; <meta name="robots" content="noindex">; <title> = home fallback 'Ahmed Aboalayoun — Full-Stack AI Engineer'; canonical=…/en (fallback); SSR body is EMPTY (1 hidden div + scripts) — not-found UI (h1 'Page not found') exists only in the client-side RSC payload; Link header carries alternates for the bogus URL |
| 9 | 404 behavior /ar/nonexistent-page-xyz | PASS | HTTP/1.1 404 Not Found; robots noindex; <title> = ar home fallback 'أحمد أبو العيون — مهندس ذكاء اصطناعي متكامل'; SSR body empty, payload h1 'الصفحة غير موجودة' (localized) |
| 10 | / redirect to default locale | PASS | GET / → 307 Location: /en, Set-Cookie: NEXT_LOCALE=en; Path=/; SameSite=lax |
| 11 | www → apex redirect | PASS | GET https://www.fotedev.me/ → 308 Permanent Redirect Location: https://fotedev.me/ |

## FAIL evidence (exact observed strings)

**F1. HTTP Link header x-default without locale prefix (all 18 pages).**
Raw header lines (en_about_headers.txt / en_home_headers.txt):

```
Link: <https://fotedev.me/en/about>; rel="alternate"; hreflang="en", <https://fotedev.me/ar/about>; rel="alternate"; hreflang="ar", <https://fotedev.me/about>; rel="alternate"; hreflang="x-default"
Link: <https://fotedev.me/en>; rel="alternate"; hreflang="en", <https://fotedev.me/ar>; rel="alternate"; hreflang="ar", <https://fotedev.me/>; rel="alternate"; hreflang="x-default"
```

HTML on the same page has `<link rel="alternate" hreflang="x-default" href="https://fotedev.me/en/about">` — mismatch. The header URL does resolve via redirect: `GET https://fotedev.me/about` → 307 → `/en/about` (Set-Cookie NEXT_LOCALE=en), i.e. x-default points at a redirecting URL rather than the 200 /en variant. Home x-default is the bare origin `https://fotedev.me/` (307→/en).

**F2. og:locale:alternate absent everywhere.** `og:locale:alternate` has 0 occurrences in all 20 saved HTML files (18 pages + 2×404), while `og:locale` is en_US / ar_EG. Expected: en pages carry `og:locale:alternate=ar_EG` and vice versa.

**F3+F4. og:image / twitter:image only on home.** Home (en/ar): `og:image = https://fotedev.me/{en|ar}/opengraph-image-o1kegr?aeef8d68977f1871` with og:image:type/width/height/alt, twitter:card=summary_large_image, twitter:image present; both image URLs verified live → 200 image/png (~46 KB / ~44 KB). All 16 other pages: no og:image, no twitter:image, twitter:card=summary. Repo confirms `opengraph-image.tsx` exists only at `src/app/(public)/[locale]/opengraph-image.tsx`, none inside about/contact/privacy/projects/services.

**F5. JSON-LD missing on 6 of 9 paths × both locales (12 pages).** Zero `application/ld+json` scripts in privacy, projects, services, projects/masar-x, projects/ghost, projects/khalat — in both locales. The 6 pages that do have it are listed above and parse as valid JSON.

**F6a. /favicon.ico → HTTP 500.** Response headers captured:

```
HTTP/1.1 500 Internal Server Error
X-Matched-Path: /[locale]
X-Powered-By: Next.js
Server: Vercel
```

The middleware/locale rewrite is catching `favicon.ico` (X-Matched-Path `/[locale]`) and the route errors out. Browsers requesting `/favicon.ico` get a 500; only `/icon.svg` (200) exists and is referenced via `<link rel="icon">`. Repo has `src/app/icon.svg` but no `src/app/favicon.ico`.

**F6b. No web app manifest.** No `manifest.ts`/`manifest.json` under src/app, no `<link rel="manifest">` tag in any fetched HTML, `GET /manifest` → 307 → `/en/manifest` → **404** (`/manifest.webmanifest` behaves the same).

## Advisories (not counted as FAIL)

- Meta descriptions >160 chars on 4 EN pages: en_home (185), en_about (194), en_projects_ghost (283), en_projects_khalat (297). All AR pages ≤156. Titles all ≤43 chars.
- JSON-LD `url` fields are not localized: ar_home/ar_about/ar_contact emit `"url": "https://fotedev.me/en"` (AR pages should point at /ar URLs).
- 404 pages inherit the home <title>, canonical (…/en or …/ar) and og:* from the locale root metadata instead of 404-specific values; they are correctly `noindex`, so impact is minimal. The not-found UI (localized h1 "Page not found" / "الصفحة غير موجودة") is only in the client-side payload — server-rendered body is empty, so JS-less crawlers see no content.
- The 404 response's `Link` header advertises hreflang alternates for the nonexistent URL (incl. locale-less x-default) — harmless for a noindex page but noisy.
- sitemap lastmod for static pages = exact build time (2026-11-10T00:53:04.377Z), i.e. rebuilt each deploy rather than content-derived; case studies use truthful DB updatedAt (2026-11-07).

## What is correct (headline positives)

- All 18 public pages: HTTP 200, unique ≤60-char titles, present meta descriptions, self-referencing apex canonicals, complete correct hreflang **in HTML** (en/ar/x-default→/en), og:title/description/url/type/locale correct per locale, twitter:card set, no `noindex`, exactly one meaningful h1 each.
- `<html lang dir>` correct: en → `lang="en" dir="ltr"`, ar → `lang="ar" dir="rtl"` (verified in raw HTML).
- robots.txt correct incl. `Disallow: /admin`, `/api` + sitemap directive; sitemap.xml valid, complete (18 entries = all public routes × 2 locales, incl. the 3 case-study slugs) with full per-entry hreflang alternates and apex URLs.
- Redirects as designed: `/` → 307 `/en` + NEXT_LOCALE cookie; www → 308 apex.
- 404 probes return real HTTP 404 with `noindex` and localized payloads.

## Evidence inventory (.factory/evidence/m6/)

- `html/<locale>_<page>.html` + `html/<locale>_<page>_headers.txt` — 18 live pages (home, about, contact, privacy, projects, services, projects/masar-x, projects/ghost, projects/khalat)
- `html/404_en.html`, `html/404_ar.html` + headers; `html/robots.txt`, `html/robots-headers.txt`, `html/sitemap.xml`, `html/sitemap-headers.txt`, `html/favicon.ico` (500 body)
- `parse_pages.py` → `parsed.json`; `deep_parse.py`; this file: `audit-seo-i18n.md`

## Suggested next steps (out of audit scope, for the fix wave)

1. Make the middleware/`_actions` skip `favicon.ico` (add a real `src/app/favicon.ico` or exempt it in the matcher) — kills the 500.
2. Fix x-default generation in the HTTP Link header to emit the /en-prefixed URL (align with HTML + sitemap).
3. Add `og:locale:alternate`; extend `opengraph-image.tsx` (or per-page metadata images) beyond home.
4. Add JSON-LD to projects/services/privacy (e.g. WebPage/BreadcrumbList, CreativeWork for case studies); localize JSON-LD url per locale.
5. Add a web manifest (route + `<link rel="manifest">`).
