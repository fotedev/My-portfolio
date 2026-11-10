import json
from pathlib import Path
from lxml import html as lhtml

EV = Path(".factory/evidence/m6/html")
data = json.loads((EV / "parsed.json").read_text(encoding="utf-8"))

PAGES = [
    ("en", "", "home"), ("en", "about", "about"), ("en", "contact", "contact"),
    ("en", "privacy", "privacy"), ("en", "projects", "projects"), ("en", "services", "services"),
    ("en", "projects/masar-x", "projects_masar-x"), ("en", "projects/ghost", "projects_ghost"),
    ("en", "projects/khalat", "projects_khalat"),
    ("ar", "", "home"), ("ar", "about", "about"), ("ar", "contact", "contact"),
    ("ar", "privacy", "privacy"), ("ar", "projects", "projects"), ("ar", "services", "services"),
    ("ar", "projects/masar-x", "projects_masar-x"), ("ar", "projects/ghost", "projects_ghost"),
    ("ar", "projects/khalat", "projects_khalat"),
]

# all titles across pages for uniqueness check
all_titles = {}
for loc, path, slug in PAGES:
    key = f"{loc}_{slug}"
    all_titles[key] = data[key]["title"]

rows = []
counts = {"PASS": 0, "FAIL": 0}
checks = [
    "status", "title", "description", "canonical", "hreflang_html", "hreflang_http_header",
    "og_core", "og_image", "og_locale_alternate", "twitter_card", "twitter_image",
    "robots_meta", "json_ld", "h1_sanity",
]

for loc, path, slug in PAGES:
    key = f"{loc}_{slug}"
    d = data[key]
    self_url = f"https://fotedev.me/{loc}" + (f"/{path}" if path else "")
    en_url = f"https://fotedev.me/en" + (f"/{path}" if path else "")
    ar_url = f"https://fotedev.me/ar" + (f"/{path}" if path else "")
    other_loc_url = ar_url if loc == "en" else en_url
    r = {}

    # 1 status
    r["status"] = ("PASS", d["status"]) if d["status"].startswith("HTTP/1.1 200") else ("FAIL", d["status"])

    # 2 title
    t = d["title"] or ""
    unique = list(all_titles.values()).count(t) == 1
    ok = bool(t) and unique and len(t) <= 60
    ev = f"len={len(t)}, unique={'yes' if unique else 'NO'} — {t!r}"
    r["title"] = ("PASS", ev) if ok else ("FAIL", ev)

    # 3 description
    desc = (d["metas"].get("description") or "")
    r["description"] = ("PASS", f"len={len(desc)}") if desc else ("FAIL", "absent")

    # 4 canonical
    cans = d["canonical"]
    ok = len(cans) == 1 and cans[0] == self_url and "www." not in cans[0]
    r["canonical"] = ("PASS", cans[0] if cans else "absent") if ok else ("FAIL", f"{cans} (expected {self_url})")

    # 5 hreflang html
    h = d["hreflang"]
    ok = (h.get("en") == [en_url] and h.get("ar") == [ar_url] and h.get("x-default") == [en_url]
          and set(h.keys()) == {"en", "ar", "x-default"})
    ev = f"en={h.get('en')}, ar={h.get('ar')}, x-default={h.get('x-default')}"
    r["hreflang_html"] = ("PASS", "complete set, correct URLs") if ok else ("FAIL", ev)

    # 6 hreflang http header
    hl = d["http_link"]
    ok = (hl.get("en") == en_url and hl.get("ar") == ar_url and hl.get("x-default") == en_url)
    if ok:
        r["hreflang_http_header"] = ("PASS", "matches HTML incl. x-default")
    else:
        r["hreflang_http_header"] = ("FAIL", f"header x-default={hl.get('x-default')!r} ≠ HTML {en_url!r} (en/ar entries match)")

    # 7 og core
    m = d["metas"]
    need = ["og:title", "og:description", "og:url", "og:type", "og:locale"]
    missing = [k for k in need if not m.get(k)]
    loc_ok = m.get("og:locale") == ("en_US" if loc == "en" else "ar_EG")
    url_ok = m.get("og:url") == self_url
    if not missing and loc_ok and url_ok:
        r["og_core"] = ("PASS", f"all 5 present, og:locale={m['og:locale']}, og:url=self")
    else:
        r["og_core"] = ("FAIL", f"missing={missing}, locale={m.get('og:locale')}, url={m.get('og:url')}")

    # 8 og:image
    if m.get("og:image"):
        r["og_image"] = ("PASS", m["og:image"])
    else:
        r["og_image"] = ("FAIL", "no og:image on page")

    # 9 og:locale:alternate
    if m.get("og:locale:alternate"):
        r["og_locale_alternate"] = ("PASS", m["og:locale:alternate"])
    else:
        r["og_locale_alternate"] = ("FAIL", "absent (expected other locale, e.g. %s)" % ("ar_EG" if loc == "en" else "en_US"))

    # 10 twitter card
    need = ["twitter:card", "twitter:title", "twitter:description"]
    missing = [k for k in need if not m.get(k)]
    card = m.get("twitter:card")
    if not missing and card in ("summary", "summary_large_image"):
        r["twitter_card"] = ("PASS", f"card={card}")
    else:
        r["twitter_card"] = ("FAIL", f"missing={missing}, card={card}")

    # 11 twitter:image
    if m.get("twitter:image"):
        r["twitter_image"] = ("PASS", "present")
    else:
        r["twitter_image"] = ("FAIL", "no twitter:image (card=summary without image)")

    # 12 robots meta
    rb = m.get("robots")
    if rb is None:
        r["robots_meta"] = ("PASS", "no robots meta → default index,follow")
    elif "noindex" in rb.lower():
        r["robots_meta"] = ("FAIL", f"robots={rb!r}")
    else:
        r["robots_meta"] = ("PASS", f"robots={rb!r}")

    # 13 json-ld
    j = d["jsonld"]
    if not j:
        r["json_ld"] = ("FAIL", "no application/ld+json on page")
    else:
        bad = [x for x in j if not x.get("ok")]
        if bad:
            r["json_ld"] = ("FAIL", f"JSON parse error: {bad[0].get('err')}")
        else:
            types = []
            for x in j:
                dd = x["data"]
                types += [y.get("@type") for y in (dd if isinstance(dd, list) else [dd])]
            r["json_ld"] = ("PASS", f"valid JSON, @type={types}")

    # 14 h1
    if d["h1_count"] == 1:
        r["h1_sanity"] = ("PASS", f"1 h1: {d['h1_texts'][0]!r}")
    else:
        r["h1_sanity"] = ("FAIL", f"{d['h1_count']} h1: {d['h1_texts']}")

    rows.append((key, self_url, r))

for _, _, r in rows:
    for c in checks:
        counts[r[c][0]] += 1

page_pass, page_fail = counts["PASS"], counts["FAIL"]

# site-level results (verified in this session)
site_rows = [
    ("robots.txt: public allowed, /admin+/api disallowed, Sitemap directive",
     "PASS", "GET /robots.txt → 200; body: User-Agent: * / Allow: / / Disallow: /admin / Disallow: /api / Sitemap: https://fotedev.me/sitemap.xml (html/robots.txt)"),
    ("sitemap.xml: valid XML",
     "PASS", "lxml etree.parse OK; root urlset with sitemap+XHTML namespaces; 18 <url> entries (html/sitemap.xml)"),
    ("sitemap.xml: all public routes × both locales",
     "PASS", "18/18 expected entries present: 6 static paths (home, projects, services, about, contact, privacy) × 2 + 3 case-study slugs (masar-x, ghost, khalat) × 2; no /admin or /api entries"),
    ("sitemap.xml: URLs correct (apex, per-locale) + hreflang alternates",
     "PASS", "every <loc> is https://fotedev.me/{en|ar}[...] (no www); each entry carries xhtml:link alternates en/ar/x-default, x-default→/en variant; lastmod 2026-11-10T00:53:04.377Z (static) / 2026-11-07 (case studies)"),
    ("favicon.ico presence",
     "FAIL", "GET /favicon.ico → HTTP 500 Internal Server Error (headers: X-Matched-Path: /[locale], X-Powered-By: Next.js) — middleware rewrites .ico into the locale route and it errors; html/favicon-headers captured via curl -D"),
    ("icon / link rel=icon presence",
     "PASS", "GET /icon.svg → 200 image/svg+xml; HTML head has <link rel=\"icon\" href=\"/icon.svg?icon.0d2pkwnfrm0e7.svg\" sizes=\"any\" type=\"image/svg+xml\"/>"),
    ("web app manifest presence",
     "FAIL", "no manifest route in src/app, no <link rel=\"manifest\"> in any fetched HTML; GET /manifest → 307 → /en/manifest → 404; GET /manifest.webmanifest → 307 → /en/manifest.webmanifest"),
    ("404 behavior /en/nonexistent-page-xyz",
     "PASS", "HTTP/1.1 404 Not Found; <meta name=\"robots\" content=\"noindex\">; <title> = home fallback 'Ahmed Aboalayoun — Full-Stack AI Engineer'; canonical=…/en (fallback); SSR body is EMPTY (1 hidden div + scripts) — not-found UI (h1 'Page not found') exists only in the client-side RSC payload; Link header carries alternates for the bogus URL"),
    ("404 behavior /ar/nonexistent-page-xyz",
     "PASS", "HTTP/1.1 404 Not Found; robots noindex; <title> = ar home fallback 'أحمد أبو العيون — مهندس ذكاء اصطناعي متكامل'; SSR body empty, payload h1 'الصفحة غير موجودة' (localized)"),
    ("/ redirect to default locale",
     "PASS", "GET / → 307 Location: /en, Set-Cookie: NEXT_LOCALE=en; Path=/; SameSite=lax"),
    ("www → apex redirect",
     "PASS", "GET https://www.fotedev.me/ → 308 Permanent Redirect Location: https://fotedev.me/"),
]
site_pass = sum(1 for _, v, _ in site_rows if v == "PASS")
site_fail = len(site_rows) - site_pass

md = []
A = md.append
A("# M6 — SEO & i18n audit of live https://fotedev.me")
A("")
A("Audited: 2026-11-10 (build 4a66233, Vercel project fotedev-portfolio). Pre-launch baseline on the current build.")
A("")
A("## Scope discovered from src/app")
A("")
A("Public routes = everything under `src/app/(public)/[locale]` (admin tree `(admin)/admin/**` excluded):")
A("")
A("- `/[locale]` (home), `/about`, `/contact`, `/privacy`, `/projects`, `/projects/[slug]`, `/services`")
A("- Case-study slugs on the live build (from sitemap.xml): `masar-x`, `ghost`, `khalat`")
A("- Audited URLs: 9 paths × 2 locales = **18 pages**, all fetched live (HTTP 200).")
A("")
A("## Method & exact commands (Windows PowerShell 5.1)")
A("")
A("```powershell")
A("# page fetches (18x, one per URL):")
A("curl.exe -sS -D .factory/evidence/m6/html/en_<page>_headers.txt -o .factory/evidence/m6/html/en_<page>.html https://fotedev.me/en/<page>")
A("# same for /ar; pages: '', about, contact, privacy, projects, services, projects/masar-x, projects/ghost, projects/khalat")
A("curl.exe -sS -D - -o NUL https://fotedev.me/            # root redirect")
A("curl.exe -sS -D - -o NUL https://www.fotedev.me/        # www redirect")
A("curl.exe -sS -D <f> -o <f> https://fotedev.me/robots.txt /sitemap.xml /favicon.ico /icon.svg /manifest*")
A("curl.exe -sS -D .factory/evidence/m6/html/404_en_headers.txt -o .factory/evidence/m6/html/404_en.html https://fotedev.me/en/nonexistent-page-xyz")
A("curl.exe -sS -D .factory/evidence/m6/html/404_ar_headers.txt -o .factory/evidence/m6/html/404_ar.html https://fotedev.me/ar/nonexistent-page-xyz")
A("# parsing: python 3.13 + lxml — .factory/evidence/m6/parse_pages.py (head/meta/link/JSON-LD/h1 extraction → parsed.json),")
A("#           .factory/evidence/m6/deep_parse.py (JSON-LD validation, 404 detail, icon links); this table was generated from parsed.json")
A("```")
A("")
A("## Summary")
A("")
A(f"- Page-level checks: 14 checks × 18 pages = **252** → **{page_pass} PASS / {page_fail} FAIL**")
A(f"- Site-level checks: **11** → **{site_pass} PASS / {site_fail} FAIL**")
A(f"- **Total: {page_pass + site_pass} PASS / {page_fail + site_fail} FAIL** across {page_pass + page_fail + site_pass + site_fail} recorded checks")
A("")
A("Distinct FAIL root causes (6):")
A("")
A("1. **HTTP `Link` header x-default lacks the locale prefix** (18/18 pages) — header says `hreflang=\"x-default\" href=\"https://fotedev.me/about\"` while HTML hreflang and sitemap say `https://fotedev.me/en/about`. The header URL only 307-redirects to the /en variant instead of returning 200. en/ar entries in the header are correct.")
A("2. **`og:locale:alternate` absent on all 18 pages** (required by the audit spec).")
A("3. **`og:image` present only on the 2 home pages** — `opengraph-image.tsx` exists only at `(public)/[locale]/` root, so the other 16 pages have no og:image (and no twitter:image).")
A("4. **`twitter:image` present only on the 2 home pages** (same root cause as #3; non-home pages use card=`summary` without image).")
A("5. **JSON-LD missing on 12/18 pages** — present & valid only on home (Person + ProfessionalService), about (Person), contact (ProfessionalService) in both locales; privacy, projects, services and all 3 case studies have none.")
A("6. **`/favicon.ico` returns HTTP 500** (X-Matched-Path: /[locale] — rewritten into the locale route and erroring) and **no web app manifest exists**.")
A("")
A("## Page-level verification table")
A("")
A("Values are observed on the live HTML (evidence file per row: `.factory/evidence/m6/html/<key>.html` + `<key>_headers.txt`).")
A("")
header = "| # | page (key = locale_slug) | " + " | ".join(c.replace("_", " ") for c in checks) + " |"
sep = "|---|---|" + "---|" * len(checks)
A(header)
A(sep)
for i, (key, self_url, r) in enumerate(rows, 1):
    cells = []
    for c in checks:
        verdict, ev = r[c]
        mark = "PASS" if verdict == "PASS" else "**FAIL**"
        ev_short = ev if len(ev) <= 70 else ev[:67] + "…"
        ev_short = ev_short.replace("|", "\\|").replace("\n", " ")
        cells.append(f"{mark} ({ev_short})")
    A(f"| {i} | {key} | " + " | ".join(cells) + " |")
A("")
A("### Legend / thresholds used")
A("")
A("- title PASS = present, unique across all 18 pages, ≤60 chars. description PASS = present (length recorded; see advisories).")
A("- canonical PASS = exactly one `<link rel=\"canonical\">` equal to the page's own apex URL `https://fotedev.me/{en|ar}/…` (no www).")
A("- hreflang (HTML) PASS = complete set {en, ar, x-default}, en→/en…, ar→/ar…, x-default→/en variant. hreflang (HTTP header) PASS additionally requires header x-default == /en URL.")
A("- og core PASS = og:title, og:description, og:url (=canonical), og:type=website, og:locale (en_US / ar_EG) all present.")
A("- robots meta PASS = tag absent (default index,follow) or present without noindex.")
A("- JSON-LD PASS = ≥1 `application/ld+json` script that parses as valid JSON; types listed.")
A("- h1 PASS = exactly one h1 with meaningful text.")
A("")
A("## Observed per-page values (compact, for cross-checking)")
A("")
A("| page | title (len) | description (len) | canonical | og:locale | h1 |")
A("|---|---|---|---|---|---|")
for loc, path, slug in PAGES:
    key = f"{loc}_{slug}"
    d = data[key]
    t = (d["title"] or "").replace("|", "\\|")
    desc = (d["metas"].get("description") or "").replace("|", "\\|")
    ds = desc if len(desc) <= 50 else desc[:47] + "…"
    h1 = (d["h1_texts"][0] if d["h1_texts"] else "").replace("|", "\\|")
    A(f"| {key} | {t} ({d['title_len']}) | {ds} ({d['desc_len']}) | {d['canonical'][0] if d['canonical'] else '—'} | {d['metas'].get('og:locale')} | {h1} |")
A("")
A("## JSON-LD detail (the 6 pages that have it)")
A("")
A("| page | @type | url field inside JSON-LD | note |")
A("|---|---|---|---|")
A("| en_home | Person + ProfessionalService | both `https://fotedev.me/en` | valid JSON |")
A("| ar_home | Person + ProfessionalService | both `https://fotedev.me/en` | valid JSON; url not localized (advisory) |")
A("| en_about | Person | `https://fotedev.me/en` | valid JSON |")
A("| ar_about | Person | `https://fotedev.me/en` | valid JSON; url not localized (advisory) |")
A("| en_contact | ProfessionalService | `https://fotedev.me/en` | valid JSON |")
A("| ar_contact | ProfessionalService | `https://fotedev.me/en` | valid JSON; url not localized (advisory) |")
A("")
A("All 10 JSON-LD scripts parse as valid JSON (`deep_parse.py` output in evidence). Schema types found: `Person`, `ProfessionalService` (+ nested `EducationalOccupationalCredential`, `Person`). No `BreadcrumbList`, `WebSite`, `WebPage`, `Article`/`CreativeWork` on any page.")
A("")
A("## Site-level verification table")
A("")
A("| # | check | verdict | observed evidence |")
A("|---|---|---|---|")
for i, (name, verdict, ev) in enumerate(site_rows, 1):
    mark = "PASS" if verdict == "PASS" else "**FAIL**"
    ev = ev.replace("|", "\\|")
    A(f"| {i} | {name} | {mark} | {ev} |")
A("")
A("## FAIL evidence (exact observed strings)")
A("")
A("**F1. HTTP Link header x-default without locale prefix (all 18 pages).**")
A("Raw header lines (en_about_headers.txt / en_home_headers.txt):")
A("")
A("```")
A("Link: <https://fotedev.me/en/about>; rel=\"alternate\"; hreflang=\"en\", <https://fotedev.me/ar/about>; rel=\"alternate\"; hreflang=\"ar\", <https://fotedev.me/about>; rel=\"alternate\"; hreflang=\"x-default\"")
A("Link: <https://fotedev.me/en>; rel=\"alternate\"; hreflang=\"en\", <https://fotedev.me/ar>; rel=\"alternate\"; hreflang=\"ar\", <https://fotedev.me/>; rel=\"alternate\"; hreflang=\"x-default\"")
A("```")
A("")
A("HTML on the same page has `<link rel=\"alternate\" hreflang=\"x-default\" href=\"https://fotedev.me/en/about\">` — mismatch. The header URL does resolve via redirect: `GET https://fotedev.me/about` → 307 → `/en/about` (Set-Cookie NEXT_LOCALE=en), i.e. x-default points at a redirecting URL rather than the 200 /en variant. Home x-default is the bare origin `https://fotedev.me/` (307→/en).")
A("")
A("**F2. og:locale:alternate absent everywhere.** `og:locale:alternate` has 0 occurrences in all 20 saved HTML files (18 pages + 2×404), while `og:locale` is en_US / ar_EG. Expected: en pages carry `og:locale:alternate=ar_EG` and vice versa.")
A("")
A("**F3+F4. og:image / twitter:image only on home.** Home (en/ar): `og:image = https://fotedev.me/{en|ar}/opengraph-image-o1kegr?aeef8d68977f1871` with og:image:type/width/height/alt, twitter:card=summary_large_image, twitter:image present; both image URLs verified live → 200 image/png (~46 KB / ~44 KB). All 16 other pages: no og:image, no twitter:image, twitter:card=summary. Repo confirms `opengraph-image.tsx` exists only at `src/app/(public)/[locale]/opengraph-image.tsx`, none inside about/contact/privacy/projects/services.")
A("")
A("**F5. JSON-LD missing on 10 of 9 paths × 2 locales (12 pages).** Zero `application/ld+json` scripts in privacy, projects, services, projects/masar-x, projects/ghost, projects/khalat — in both locales. The 6 pages that do have it are listed above and parse as valid JSON.")
A("")
A("**F6a. /favicon.ico → HTTP 500.** Response headers captured:")
A("")
A("```")
A("HTTP/1.1 500 Internal Server Error")
A("X-Matched-Path: /[locale]")
A("X-Powered-By: Next.js")
A("Server: Vercel")
A("```")
A("")
A("The middleware/locale rewrite is catching `favicon.ico` (X-Matched-Path `/[locale]`) and the route errors out. Browsers requesting `/favicon.ico` get a 500; only `/icon.svg` (200) exists and is referenced via `<link rel=\"icon\">`. Repo has `src/app/icon.svg` but no `src/app/favicon.ico`.")
A("")
A("**F6b. No web app manifest.** No `manifest.ts`/`manifest.json` under src/app, no `<link rel=\"manifest\">` tag in any fetched HTML, `GET /manifest` → 307 → `/en/manifest` → **404** (`/manifest.webmanifest` behaves the same).")
A("")
A("## Advisories (not counted as FAIL)")
A("")
A("- Meta descriptions >160 chars on 4 EN pages: en_home (185), en_about (194), en_projects_ghost (283), en_projects_khalat (297). All AR pages ≤156. Titles all ≤43 chars.")
A("- JSON-LD `url` fields are not localized: ar_home/ar_about/ar_contact emit `\"url\": \"https://fotedev.me/en\"` (AR pages should point at /ar URLs).")
A("- 404 pages inherit the home <title>, canonical (…/en or …/ar) and og:* from the locale root metadata instead of 404-specific values; they are correctly `noindex`, so impact is minimal. The not-found UI (localized h1 \"Page not found\" / \"الصفحة غير موجودة\") is only in the client-side payload — server-rendered body is empty, so JS-less crawlers see no content.")
A("- The 404 response's `Link` header advertises hreflang alternates for the nonexistent URL (incl. locale-less x-default) — harmless for a noindex page but noisy.")
A("- sitemap lastmod for static pages = exact build time (2026-11-10T00:53:04.377Z), i.e. rebuilt each deploy rather than content-derived; case studies use truthful DB updatedAt (2026-11-07).")
A("")
A("## What is correct (headline positives)")
A("")
A("- All 18 public pages: HTTP 200, unique ≤60-char titles, present meta descriptions, self-referencing apex canonicals, complete correct hreflang **in HTML** (en/ar/x-default→/en), og:title/description/url/type/locale correct per locale, twitter:card set, no `noindex`, exactly one meaningful h1 each.")
A("- `<html lang dir>` correct: en → `lang=\"en\" dir=\"ltr\"`, ar → `lang=\"ar\" dir=\"rtl\"` (verified in raw HTML).")
A("- robots.txt correct incl. `Disallow: /admin`, `/api` + sitemap directive; sitemap.xml valid, complete (18 entries = all public routes × 2 locales, incl. the 3 case-study slugs) with full per-entry hreflang alternates and apex URLs.")
A("- Redirects as designed: `/` → 307 `/en` + NEXT_LOCALE cookie; www → 308 apex.")
A("- 404 probes return real HTTP 404 with `noindex` and localized payloads.")
A("")
A("## Evidence inventory (.factory/evidence/m6/)")
A("")
A("- `html/<locale>_<page>.html` + `html/<locale>_<page>_headers.txt` — 18 live pages (home, about, contact, privacy, projects, services, projects/masar-x, projects/ghost, projects/khalat)")
A("- `html/404_en.html`, `html/404_ar.html` + headers; `html/robots.txt`, `html/robots-headers.txt`, `html/sitemap.xml`, `html/sitemap-headers.txt`, `html/favicon.ico` (500 body)")
A("- `parse_pages.py` → `parsed.json`; `deep_parse.py`; this file: `audit-seo-i18n.md`")
A("")
A("## Suggested next steps (out of audit scope, for the fix wave)")
A("")
A("1. Make the middleware/`_actions` skip `favicon.ico` (add a real `src/app/favicon.ico` or exempt it in the matcher) — kills the 500.")
A("2. Fix x-default generation in the HTTP Link header to emit the /en-prefixed URL (align with HTML + sitemap).")
A("3. Add `og:locale:alternate`; extend `opengraph-image.tsx` (or per-page metadata images) beyond home.")
A("4. Add JSON-LD to projects/services/privacy (e.g. WebPage/BreadcrumbList, CreativeWork for case studies); localize JSON-LD url per locale.")
A("5. Add a web manifest (route + `<link rel=\"manifest\">`).")

out = Path(".factory/evidence/m6/audit-seo-i18n.md")
out.write_text("\n".join(md) + "\n", encoding="utf-8")
print(f"written {out} — page-level {page_pass} PASS / {page_fail} FAIL, site-level {site_pass} PASS / {site_fail} FAIL, total {page_pass + site_pass} PASS / {page_fail + site_fail} FAIL")
