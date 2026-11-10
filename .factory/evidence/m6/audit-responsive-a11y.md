# M6 Responsive & Accessibility Audit — live https://fotedev.me (build `4a66233`)

Run: 2026-11-10 05:48–06:55 UTC. Data collection was scripted by a subagent that
failed mid-way; the agent session verified every script, executed the missing axes
(axe light + dark) and synthesized this report. Machine results are copied to
`.factory/evidence/m6/audit-artifacts/`; screenshots are under
`.factory/evidence/m6/responsive/` (a representative subset — 320 px and 1440 px per
route/locale, plus the a11y shots — is committed; the full 52-shot set stays local).

## 1. Responsive sweep — PASS (45/45 combinations)

Routes: home, about, projects, contact (EN + AR each) + `/admin/login`, at
320×568, 375×667, 768×1024, 1024×768, 1440×900 — 45 page/viewport combinations,
all HTTP 200, **0 horizontal overflow, 0 console errors**.
Data: `audit-artifacts/responsive-results.jsonl`; screenshots `responsive/*.png`.

## 2. Dark theme — PASS after a contrast fix

Tokens verified live: `html.dark`, body `#0A0E1A`, text `#F8FAFC`, no overflow, no
console errors, toggle flips light↔dark. Measured contrasts (dark):
body 18.4:1, body text 7.5:1.

**Found and fixed (blocking):** primary CTAs rendered white text on
`--accent-strong` `#3B82F6` = **3.68:1** (AA needs 4.5:1) and the active
locale-switcher token the same. Root cause: hardcoded `text-white` ignoring the
existing `--accent-foreground` token (dark = `#0A0E1A`). Fixed across the public
CTA, locale switcher, button variants and 12 admin controls:
`text-white` → `text-accent-foreground` (light renders identically white; dark now
**5.23:1** on `#3B82F6` and **10.6:1** on `#22D3EE`, where white had been 1.8:1).
Data: `audit-artifacts/dark-theme-results.json`.

## 3. axe-core — PASS (0 violations, 7 runs)

Viewport 1280×720; blocking = impact `critical`|`serious`.
Machine output: `.factory/evidence/m6/axe-results.json`.

| Page | Before fix | After fix |
|---|---|---|
| /en home (light) | 0 | 0 |
| /ar home (light) | 0 | 0 |
| /en/contact | 0 | 0 |
| /ar/contact | 0 | 0 |
| /admin/login | 2 moderate (no `<main>` landmark) | **0** (login wrapped in `<main>`) |
| /en home (dark) | **1 serious** color-contrast ×3 | 0 |
| /ar home (dark) | **1 serious** color-contrast ×1 | 0 |

## 4. Keyboard — PASS

- `/en` home: 46 tab stops, every focused control visible, focus order follows the
  DOM/visual order (skip link → nav → hero CTAs → cards → sections → footer),
  no trap, wrap reaches the browser UI (no `body` trap).
- `/en/contact`: 36 visible + 2 hidden controls, all reachable (hidden ones are the
  Turnstile container internals); Turnstile ready before submit.
- Mobile menu (375 px): opens with `aria-expanded="true"`, 12 stops inside, close
  returns focus to the toggle. Advisory: **Escape does not close the disclosure
  menu** (not a WCAG 2.2 failure for a disclosure pattern; noted for polish).
- **Certificate modal focus trap: N/A** — the build has no modal; the credential
  card links to the PDF in a new tab (audit found no dialogs on either page).
Data: `audit-artifacts/keyboard-results.json`.

## 5. 200 % zoom — PASS

640×800 @ deviceScaleFactor 2, EN + AR: no horizontal overflow, all controls
reachable, focus ring visible. Data: `audit-artifacts/zoom-results.json`.

## 6. Arabic / RTL — PASS with advisories

`html lang="ar" dir="rtl"`, body dir rtl, title localized. Reading order of the
ARIA snapshot: header → nav ("Main") → main → h1 → sections → footer → footer nav
— correct. Advisories (content-level, not code):
1. Two AR headings embed Latin terms ("RAG", "MCP") without `<bdi>` isolation —
   bidi rendering can reorder adjacent punctuation. Fix belongs in the CMS content
   editing convention, not this PR.
2. EN run flags on Latin headings are false positives of the checker.

Data: `audit-artifacts/arabic-sr-results.json`, snapshots
`.factory/evidence/m6/*-aria-snapshot.yaml`.

## Verdict

Responsive: PASS. Accessibility: PASS (axe 0 violations, keyboard/zoom/SR clean)
after fixing the dark-mode contrast token usage and the login landmark.
