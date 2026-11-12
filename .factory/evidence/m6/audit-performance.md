# M6 Performance Audit — https://fotedev.me (pre-launch baseline)

- **Date:** 2026-11-10 (UTC runs 05:41–05:46)
- **Build under test:** current production build, commit `4a66233` (pre-redeploy baseline, before real Turnstile keys)
- **Environment:** Windows host `C:\programming\github\My-Portfolio`, PowerShell 5.1, node 24 + npx
- **Browser:** Chrome stable `C:\Program Files\Google\Chrome\Application\chrome.exe` (first-choice path existed; no Playwright install needed)
- **Tool:** Lighthouse **13.6.0** via `npx --yes lighthouse`, `--chrome-flags="--headless=new"`, **default mobile emulation + Lighthouse default (simulated) mobile throttling**, categories: performance, accessibility, best-practices, seo
- **Evidence files (this dir):** `lighthouse-en-run1.json`, `lighthouse-en-run2.json`, `lighthouse-en-run3.json`, `lighthouse-ar-run1.json`, `en.html`, `en-fetch1.headers.txt`, `en-fetch2.headers.txt`, `pagespeed-en.json` (429 body), `analyze.py`

Exact commands used:

```
npx --yes lighthouse https://fotedev.me/en --output=json --output-path=".factory\evidence\m6\lighthouse-en-runN.json" --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo   (N = 1,2,3; fresh run each time)
npx --yes lighthouse https://fotedev.me/ar --output=json --output-path=".factory\evidence\m6\lighthouse-ar-run1.json" --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo
curl.exe -s -S -o .factory\evidence\m6\en.html -D .factory\evidence\m6\en-fetch1.headers.txt https://fotedev.me/en        (then identical second fetch, headers only kept)
curl.exe -s -o .factory\evidence\m6\pagespeed-en.json -w "%{http_code}" "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Ffotedev.me%2Fen&strategy=mobile"
python .factory\evidence\m6\analyze.py    (score/metric extraction, medians, script download)
```

---

## 1. Verdict vs launch bar

**Bar: median ≥ 90 in all four categories on /en → overall PASS.**

| Category (median of 3 /en runs) | Median | Verdict |
|---|---|---|
| Performance | **98** | PASS |
| Accessibility | **96** | PASS |
| Best Practices | **100** | PASS |
| SEO | **100** | PASS |

## 2. Per-run lab results

### /en — 3 fresh runs (mobile)

| Run | Perf | A11y | BP | SEO | FCP (ms) | LCP (ms) | TBT (ms) | CLS | SI (ms) |
|---|---|---|---|---|---|---|---|---|---|
| run1 | 96 | 96 | 100 | 100 | 1039 | 1039 | 213 | 0 | 1355 |
| run2 | 98 | 96 | 100 | 100 | 1233 | 1233 | 167 | 0 | 1649 |
| run3 | 98 | 96 | 100 | 100 | 1005 | 1005 | 170 | 0 | 1308 |
| **median** | **98** | **96** | **100** | **100** | **1039** | **1039** | **170** | **0** | **1355** |

### /ar — 1 run (mobile)

| Run | Perf | A11y | BP | SEO | FCP (ms) | LCP (ms) | TBT (ms) | CLS | SI (ms) |
|---|---|---|---|---|---|---|---|---|---|
| run1 | 99 | 96 | 100 | 100 | 1201 | 1201 | 106 | 0 | 1266 |

RTL/Arabic build performs at least as well as the English one on this single run; no regression signal, but it is one run only.

### LCP detail (from run2 `lcp-breakdown-insight`)

- LCP element: `main#content > section.hero-wash > div.container-site > h1.mt-6` — text "Web applications and AI tools built around your business."
- Subparts: TTFB ≈ 208 ms, element render delay ≈ 548 ms.
- FCP == LCP in every run, consistent with an above-the-fold text LCP element (inference supported by the element dump above — no image is the LCP candidate).

## 3. Cache behavior (GET https://fotedev.me/en, twice, ~1 s apart)

| | Fetch 1 | Fetch 2 |
|---|---|---|
| HTTP status | 200 | 200 |
| `X-Vercel-Cache` | **HIT** | **HIT** |
| `Content-Length` (HTML document) | **99,010 B** | **99,010 B** |
| `Age` | 16675 | 16675 |
| `X-Nextjs-Prerender` | 1 | 1 |
| `Etag` | `"7c24c048081ef8ee0762b5539b7e5e4b"` | identical |
| `X-Vercel-Id` | fra1::cnxhc-… | fra1::krbth-… |
| `Cache-Control` | `public, max-age=0, must-revalidate` | same |

**Verdict: PASS** — both fetches served from Vercel edge cache (fra1); the HTML is prerendered and stable. `NEXT_LOCALE=en` cookie is set by the response; the `Vary` list covers RSC/router-state variants.

## 4. First-load JS (self-hosted `<script src>` in the /en document)

Method: parsed the saved document (`en.html`, the 99,010 B fetch above) for `<script src=…>`, kept same-origin (relative `/_next/...`) URLs, deduplicated, downloaded each and counted raw (uncompressed) bytes. No external `<script src>` found in the document (e.g. no third-party analytics tags in HTML).

| # | Chunk (all `/_next/static/immutable/chunks/`) | Raw bytes |
|---|---|---|
| 1 | `2m54k-y01gip_.js` | **229,768** |
| 2 | `1lq0w00sl3r99.js` | **134,571** |
| 3 | `0o_zn79850vsj.js` | **132,364** |
| 4 | `0c0hxoamwjsbw.js` | **112,594** |
| 5 | `3n2edar5kl-fg.js` | 39,769 |
| 6 | `2tdzuwgj0pknm.js` | 34,667 |
| 7 | `3u8yvqqgcdcq6.js` | 31,782 |
| 8 | `3dr_wy4n0_f3v.js` | 23,426 |
| 9 | `31i4wtv01upnh.js` | 14,001 |
| 10 | `turbopack-3h_ctkfaeun7f.js` | 11,199 |
| 11 | `2ww7nfgxrdwfy.js` | 5,364 |

- **Count: 11 chunks · Total: 769,505 B raw ≈ 751.5 KiB** (uncompressed; urllib sent no `Accept-Encoding`).
- **Large offenders (> 100 KB raw): the 4 bolded chunks above**, largest 229,768 B. Wire cost is much lower: measured gzip transfer for the largest chunk is **72,603 B** (~69 KiB); all chunks served `cache-control: public,max-age=31536000,immutable` with gzip content-encoding.
- Scope note: this counts only `<script src>` tags in the initial HTML — i.e. the blocking/initial JS. RSC flight payload in the HTML body and later dynamic imports are **not** included (not measured in this audit).

## 5. Optional field data (PageSpeed Insights API)

- 1 attempt: `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Ffotedev.me%2Fen&strategy=mobile` → **HTTP 429**, body: *"Quota exceeded for quota metric 'Queries' and limit 'Queries per day' of service 'pagespeedonline.googleapis.com' for consumer 'project_number:583797351490'."* (response body kept as `pagespeed-en.json`)
- Not retried with attempt 2: the failure is a **per-day quota** on the shared anonymous consumer project, so an immediate second attempt cannot succeed.
- **No CrUX/field data in this audit.** Lab numbers above are the only basis for the verdict.

## 6. Verification status

**Verified by execution:** 4 Lighthouse runs (JSONs kept), 2 cache-header fetches, 11 chunk downloads with byte counts, PSI API attempt (429), gzip wire-size probe of largest chunk, LCP element dump.

**Not verified / out of scope:** real-user field data (CrUX) unavailable (429); measurements are from a single machine+network to the fra1 edge with simulated mobile throttling — other regions/devices will differ; RSC payload size and dynamically imported chunks not measured; /ar has a single run (no median); run-to-run Performance variance observed (96→98) is within normal lab noise.

**Baseline note:** these numbers are the pre-launch baseline on the current build (`4a66233`); re-run after the Turnstile-key redeploy to confirm no regression.
