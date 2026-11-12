# DESIGN.md — fotedev Design System Specification

| | |
|---|---|
| **Product** | fotedev portfolio (`fotedev.me`) — public identity: **Ahmed Aboalayoun** |
| **Status** | **Binding design contract for Milestone 2 (M2) implementation.** All visual, motion, typography, RTL and accessibility decisions below are locked. Changes require an ADR or explicit owner approval at a gate. **Amendment:** ADR-0009 (2026-11-11, M2.1 design enhancement pass) adjusts the display scale, pill typography, motion set and section layouts; the affected entries below reflect it. |
| **Applies to** | `/en` and `/ar` public routes, admin surface styling, all shared components |
| **Direction** | Calm, technical, credible. Neutral surfaces, one blue/cyan accent family. **Not** a neon terminal. No streak counters, no badge walls. |
| **Authority** | `prompt-0.md` §2 (locked decisions), `prompt-1.md` §5.1 |
| **Language of this document** | English (repo rule) |

M2 MUST implement every token and rule in this file. Where a third-party library (shadcn/ui, next-themes) is used, it MUST be configured to match this spec, not the library defaults.

---

## 1. Design principles

1. **Credibility over decoration.** The site is a sales asset for freelance work. Every pixel signals competence: neutral surfaces, precise alignment, restrained accent use.
2. **One accent family.** Blue/cyan only. Success/warning/danger are functional colors, never decoration. No second decorative hue anywhere.
3. **Dark-first, light-equal.** Dark is the default theme pair (designed first, fallback theme); light is equally polished, never a degraded afterthought.
4. **Accent budget.** Accent color covers ≤ 10% of any viewport at rest (text links, one primary CTA per view, focus rings, active indicators). Never used for full-page backgrounds, large filled sections, or glowing text.
5. **Motion is a cue, not a show.** Animation confirms user action or reveals content once. No ambient loops, no parallax, no autoplay. **Exception (ADR-0010):** the hero's WebGL lattice is a bounded, decorative layer allowed to drift, tilt with the pointer, and run continuously. It is `aria-hidden`, carries no text, and is the only such exception.
6. **Bilingual by construction.** Every component is designed LTR and RTL simultaneously. Logical CSS properties are mandatory; directional assumptions are defects.
7. **Accessibility is a floor, not a goal.** WCAG 2.1 AA is the minimum shipped state (see §11).

---

## 2. Color tokens

Tokens are CSS custom properties on `:root` (light values) overridden by `.dark` on `<html>`. Every token below defines BOTH themes. Tailwind maps to these variables; raw hex values MUST NOT appear in component code.

### 2.1 Core surfaces, borders, text

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg` | `#0A0E1A` | `#F8FAFC` | Page background |
| `--bg-surface` | `#111827` | `#FFFFFF` | Cards, panels, inputs, mobile nav sheet |
| `--bg-elevated` | `#172033` | `#FFFFFF` | Dropdowns, tooltips, sticky header on scroll (light: + `shadow-md`) |
| `--bg-muted` | `#1B2436` | `#F1F5F9` | Table headers, hover fills, secondary button fill, inline-code background |
| `--bg-overlay` | `rgba(2, 6, 23, 0.70)` | `rgba(15, 23, 42, 0.45)` | Modal / mobile-nav scrim |
| `--border-default` | `#1E293B` | `#E2E8F0` | Card borders, dividers, table row rules (decorative separators) |
| `--border-strong` | `#334155` | `#CBD5E1` | Emphasized dividers, table header rule |
| `--border-interactive` | `#64748B` | `#64748B` | Input and interactive-control resting borders — ≥ 3:1 non-text contrast in both themes (WCAG 1.4.11) |
| `--text-primary` | `#F8FAFC` | `#0F172A` | Headings, body text |
| `--text-secondary` | `#CBD5E1` | `#334155` | Nav links, card descriptions |
| `--text-muted` | `#94A3B8` | `#64748B` | Meta text, captions, placeholders, helper text |

### 2.2 Accent (single blue/cyan family)

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--accent` | `#22D3EE` (cyan-500) | `#2563EB` (blue-600) | Primary CTA fill, links, active nav indicator |
| `--accent-hover` | `#67E8F9` (cyan-300) | `#1D4ED8` (blue-700) | Primary CTA hover |
| `--accent-active` | `#A5F3FC` (cyan-200) | `#1E40AF` (blue-800) | Primary CTA pressed |
| `--accent-foreground` | `#0A0E1A` | `#FFFFFF` | Text/icons on `--accent` fill |
| `--accent-secondary` | `#3B82F6` (blue-500) | `#3B82F6` (blue-500) | Gradient partner on hero surface decoration only — never text |
| `--accent-text` | `#22D3EE` | `#2563EB` | Accent used as text (links, icons); dark cyan 10.7:1, light blue 5.2:1 on `--bg` |
| `--accent-subtle` | `rgba(34, 211, 238, 0.10)` | `rgba(37, 99, 235, 0.08)` | Active nav pill, selected row, tag chips |
| `--accent-border` | `rgba(34, 211, 238, 0.45)` | `rgba(37, 99, 235, 0.45)` | Hover border of interactive cards |

The accent hue pair is fixed. Do not introduce violet, pink, green-as-accent, or gradient text on body copy. The only permitted gradient is the hero decorative wash: `linear-gradient(135deg, rgba(34,211,238,0.06), rgba(59,130,246,0.06))` dark / `linear-gradient(135deg, rgba(37,99,235,0.04), rgba(14,116,144,0.04))` light - flat wash, no animated shimmer.

**Exception (ADR-0010 §3) — the hero lattice's own material.** The WebGL layer behind the hero may use one amber hue (`--hive-node` / `--hive-link`, defined per theme). The exception is bounded: amber appears **only inside the canvas** - never on a DOM element, text, icon, border or focus ring - the canvas paints no background, and the layer is decorative and `aria-hidden`, so it is excluded from contrast requirements. All UI and content stay strictly on the blue/cyan accent family.

### 2.3 Functional colors (success / warning / danger)

Each has: text-on-surface value, fill value, subtle background for status pills, and (for inputs) a border value.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--success` | `#10B981` (7.6:1 on dark bg) | `#059669` | Success fills (icons) |
| `--success-text` | `#34D399` | `#047857` | Success text, status pill text |
| `--success-bg` | `rgba(16, 185, 129, 0.14)` | `rgba(5, 150, 105, 0.10)` | Status pill / success panel background |
| `--warning` | `#F59E0B` | `#D97706` | Warning fills |
| `--warning-text` | `#FBBF24` | `#B45309` | Warning text, pill text |
| `--warning-bg` | `rgba(245, 158, 11, 0.14)` | `rgba(245, 158, 11, 0.12)` | Pill background |
| `--danger` | `#EF4444` | `#DC2626` | Danger fills, destructive CTA fill |
| `--danger-text` | `#F87171` (7.0:1) | `#B91C1C` (6.5:1) | Error messages, destructive text |
| `--danger-bg` | `rgba(239, 68, 68, 0.14)` | `rgba(220, 38, 38, 0.10)` | Error panel / pill background |
| `--danger-border` | `#F87171` | `#DC2626` | Invalid input border (≥ 3:1 in both themes) |

Warning is reserved for availability status ("limited availability") and non-blocking admin notices. It never appears on the public site except status pills.

### 2.4 Focus ring, selection, code

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--ring` | `#67E8F9` | `#2563EB` | `:focus-visible` outline color (2px, offset 2px) |
| `--ring-input` | `rgba(34, 211, 238, 0.22)` | `rgba(37, 99, 235, 0.16)` | 3px input focus halo (shadow), border carries contrast |
| `--selection-bg` | `rgba(34, 211, 238, 0.25)` | `rgba(37, 99, 235, 0.18)` | `::selection` |
| `--code-bg` | `#0D1322` | `#F1F5F9` | Code block background |
| `--code-inline-bg` | `#1B2436` | `#F1F5F9` | Inline code background |
| `--scrollbar` | `#334155` | `#CBD5E1` | Scrollbar thumb (hover: `--border-interactive`) |

### 2.5 Verified contrast table (WCAG 2.1)

Ratios computed per WCAG relative-luminance formula against the stated background; `≈` marks rounded values.

| Foreground | Background | Ratio | Requirement | Verdict |
|---|---|---|---|---|
| `--text-primary` dark `#F8FAFC` | `#0A0E1A` | ≈ 16.6:1 | AA normal ≥ 4.5 | Pass |
| `--text-secondary` dark `#CBD5E1` | `#0A0E1A` | ≈ 13.0:1 | ≥ 4.5 | Pass |
| `--text-muted` dark `#94A3B8` | `#0A0E1A` | ≈ 8.2:1 | ≥ 4.5 | Pass |
| `--accent-text` dark `#22D3EE` | `#0A0E1A` | ≈ 10.7:1 | ≥ 4.5 | Pass |
| `--success-text` dark `#34D399` | dark pill bg | ≈ 5.2:1 | ≥ 4.5 | Pass |
| `--warning-text` dark `#FBBF24` | `#0A0E1A` | ≈ 11.9:1 | ≥ 4.5 | Pass |
| `--danger-text` dark `#F87171` | `#0A0E1A` | ≈ 7.0:1 | ≥ 4.5 | Pass |
| `--accent-foreground` dark `#0A0E1A` | `--accent` `#22D3EE` | ≈ 10.7:1 | ≥ 4.5 | Pass |
| `--text-primary` light `#0F172A` | `#F8FAFC` | ≈ 16.9:1 | ≥ 4.5 | Pass |
| `--text-muted` light `#64748B` | `#FFFFFF` | ≈ 4.76:1 | ≥ 4.5 | Pass |
| `--text-secondary` light `#334155` | `#FFFFFF` | ≈ 10.4:1 | ≥ 4.5 | Pass |
| `--accent-text` light `#2563EB` | `#F8FAFC` | ≈ 5.1:1 | ≥ 4.5 | Pass |
| `--success-text` light `#047857` | light pill bg | ≈ 5.0:1 | ≥ 4.5 | Pass |
| `--warning-text` light `#B45309` | light pill bg | ≈ 4.6:1 | ≥ 4.5 | Pass |
| `--danger-text` light `#B91C1C` | `#F8FAFC` | ≈ 6.4:1 | ≥ 4.5 | Pass |
| `--accent-foreground` light `#FFFFFF` | `--accent` `#2563EB` | ≈ 5.1:1 | ≥ 4.5 | Pass |
| `--border-interactive` (both) | page bg | ≈ 4.1:1 dark / 4.8:1 light | non-text ≥ 3:1 | Pass |
| `--ring` both | page bg | ≥ 5.1:1 | non-text ≥ 3:1 | Pass |

Muted text is never used below 14px. Disabled controls are exempt from contrast (WCAG), but disabled text still uses `--text-muted` for legibility.

---

## 3. Spacing & layout scale

Base unit 4px; coarse steps on the 8px grid. Tailwind spacing utilities map 1:1 to these steps.

| Step | px | rem | Primary use |
|---|---|---|---|
| `0` | 0 | 0 | — |
| `1` | 4 | 0.25 | Icon–label gap, tight inline gaps |
| `2` | 8 | 0.5 | Chip padding-inline, inline gaps |
| `3` | 12 | 0.75 | Input padding, button padding-inline (sm/md), label–input gap |
| `4` | 16 | 1 | Card padding (mobile), stacked section gap, page gutter (mobile) |
| `5` | 20 | 1.25 | Button padding-inline (lg) |
| `6` | 24 | 1.5 | Card padding (desktop), grid gap |
| `8` | 32 | 2 | Between related sections, form field vertical rhythm |
| `10` | 40 | 2.5 | Mobile section spacing |
| `12` | 48 | 3 | Desktop section spacing |
| `16` | 64 | 4 | Major section spacing (mobile) |
| `20` | 80 | 5 | Major section spacing (desktop) |
| `24` | 96 | 6 | Hero vertical padding (desktop) |

Layout containers:

| Token | Value |
|---|---|
| `--container-max` | 1152px (72rem) |
| `--container-reading` | 720px (45rem) — prose, About, case-study body, forms |
| `--gutter-mobile` | 16px |
| `--gutter-desktop` | 24px |
| Breakpoints | `sm 640px` · `md 768px` · `lg 1024px` (Tailwind defaults; nav collapses below `md`) |

Vertical rhythm rule: section spacing ≥ 64px between major sections; adjacent headings and their content use 8px–24px, never 0. No horizontal overflow at any viewport from 320px up.

---

## 4. Radius

| Token | px | Usage |
|---|---|---|
| `--radius-sm` | 6 | Inline-code, small tags, table cell pills |
| `--radius-md` | 8 | Buttons, inputs, selects, dropdown menu items |
| `--radius-lg` | 12 | Cards, panels, mobile nav sheet, modals |
| `--radius-xl` | 16 | Hero media frames, featured project media |
| `--radius-full` | 9999px | Chips, status pills, avatar, icon-only buttons |

Radius is consistent per component class — a button never mixes 8px and full within one surface. Corners on media keep `--radius-xl` with `overflow: hidden`.

---

## 5. Elevation & shadows

On dark themes elevation is expressed by **lighter surface color + border**; shadows are supportive only. On light themes shadows carry elevation.

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(2,6,23,0.60)` | `0 1px 2px rgba(15,23,42,0.06)` | Inputs, chips at rest |
| `--shadow-sm` | `0 2px 6px rgba(2,6,23,0.55)` | `0 2px 8px rgba(15,23,42,0.08)` | Cards at rest (light), dropdowns |
| `--shadow-md` | `0 8px 24px rgba(2,6,23,0.55)` | `0 8px 24px rgba(15,23,42,0.10)` | Hovered interactive cards, popovers, sticky header |
| `--shadow-lg` | `0 16px 40px rgba(2,6,23,0.65)` | `0 16px 40px rgba(15,23,42,0.14)` | Modal, mobile nav sheet |
| `--shadow-accent` | `0 4px 20px rgba(34,211,238,0.20)` | `0 4px 20px rgba(37,99,235,0.18)` | Primary CTA hover only — subtle, no glow bloom |

Prohibitions: no text shadows, no glowing headings, no inner shadows except on disabled inputs, no shadow on `--bg-muted` fills.

---

## 6. Motion

Hard cap: **200ms for every animation and transition.** Easing is ease-out family.

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | 80ms | Color-only hover (links, icons) |
| `--duration-fast` | 120ms | Button/input hover & pressed states, underline grow |
| `--duration-base` | 160ms | Dropdown open, tooltip, card hover shadow |
| `--duration-slow` | 200ms | Content fade-in on mount, mobile sheet, theme accent transitions |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Enter transitions (default) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit transitions |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State color changes |

Allowed motion patterns (Framer Motion, `MotionConfig reducedMotion="user"`):
- Section reveal: opacity 0→1 + translateY(8px→0), `--duration-slow`, `--ease-out`, triggered **once** via `whileInView` (`viewport={{ once: true, amount: 0.2 }}`).
- Stagger: max 3 items, 40ms step, same transform.
- Hover feedback: color/shadow/border via CSS transitions (not JS animation).
- Skeleton pulse: opacity 0.5→1 loop, ONLY while loading, removed on load.

Implementation note (ADR-0009): the shipped site uses exactly one entrance — the hero's CSS `rise-in` on mount (200ms, transform-only, works without JS) — plus CSS hover transitions. Scroll-triggered section reveals and stagger are removed.

Forbidden: parallax, scroll-jacking, autoplaying carousels/video, typewriter loops, bouncing springs (spring damping ≥ stiff or use tween), scale-on-scroll, rotating badges, ambient background animation, hover motion that moves layout (transform only, never layout properties).

**Exception (ADR-0010) — the hero lattice.** The 200 ms cap, the ease tokens and the `prefers-reduced-motion` rule govern every DOM animation on the site without exception. They do not govern the hero's WebGL canvas, which is not a transition between two states and has no meaningful duration. Inside that one layer the allowed behaviours are: a staggered grow-in (~1.8 s), a slow idle drift (≤ 0.3 units), a pointer tilt (±0.12 rad, eased at 0.05 lerp, spatial rather than directional so RTL needs no mirroring), and a convergence over the first fifth of the hero's scroll range. No scroll-jacking: the page scrolls normally and the canvas only reads scroll position. Under `prefers-reduced-motion: reduce` the layer renders **one static frame** and never starts its loop. See ADR-0010 §4.

`prefers-reduced-motion: reduce` (mandatory global rule):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
With reduced motion, Framer Motion components render final-state (opacity only, no translate). Skeleton pulse becomes static shimmer-free blocks.

---

## 7. Typography

### 7.1 Fonts (locked)

| Role | Font | Weights | Source |
|---|---|---|---|
| EN body & headings | **Inter** (variable) | 400, 500, 600, 700 | `next/font/google`, subset `latin`, `display: swap` |
| Mono (code, metrics, tags) | **Fira Code** | 400, 500 | `next/font/google`, subset `latin` |
| Arabic (all text when locale = AR) | **IBM Plex Sans Arabic** | 400, 500, 600, 700 | `next/font/google`, subset `arabic` |

Approved alternates (if bundle constraints require): Geist Sans / Geist Mono — swap is a one-line change, all rules in this document hold. Rejection requires an ADR.

CSS stacks:
```css
--font-sans-en: "Inter", "Geist Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: "Fira Code", "Geist Mono", ui-monospace, "Cascadia Code", Consolas, monospace;
--font-sans-ar: "IBM Plex Sans Arabic", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif;
```
Applied via `:lang(ar)` / `[dir="rtl"]` selector, or per-locale `className` from `next/font` — never via JS toggling. `next/font` automatic fallback metrics (`adjustFontFallback`) MUST remain enabled to prevent CLS.

### 7.2 Type scale (EN, rem-based, mobile → desktop)

| Token | Size mobile | Size desktop | Weight | Line-height | Tracking | Use |
|---|---|---|---|---|---|---|
| `text-display` | 40px / 2.5rem (fluid floor) | 68px / 4.25rem (fluid cap) — `clamp(2.5rem, 1.7rem + 3.2vw, 4.25rem)` | 700 | 1.08 | −0.025em | Hero headline (ADR-0009) |
| `text-h1` | 30px / 1.875rem | 36px / 2.25rem | 700 | 1.2 | −0.02em | Page titles |
| `text-h2` | 24px / 1.5rem | 28px / 1.75rem | 600 | 1.3 | −0.01em | Section titles |
| `text-h3` | 20px / 1.25rem | 22px / 1.375rem | 600 | 1.4 | 0 | Card/section sub-titles |
| `text-body-lg` | 17px / 1.0625rem | 18px / 1.125rem | 400 | 1.65 | 0 | Hero subcopy, lede paragraphs |
| `text-body` | 16px / 1rem | 16px / 1rem | 400 | 1.6 | 0 | Default body |
| `text-body-sm` | 14px / 0.875rem | 14px / 0.875rem | 400 | 1.5 | 0 | Nav links, helper text, meta |
| `text-caption` | 12px / 0.75rem | 13px / 0.8125rem | 500 | 1.45 | +0.04em (uppercase, EN only) | Eyebrows, labels, table headers |
| `text-mono-sm` | 13px / 0.8125rem | 14px / 0.875rem | 400 | 1.6 | 0 | Code, tech-stack tags, metrics |

Minimum body size anywhere: 16px (14px allowed only for meta/helper). Maximum paragraph measure: 68 characters (EN) using `--container-reading`.

### 7.3 Arabic adjustments (mandatory when `[dir="rtl"]`)

Arabic script has taller ascenders/descenders and diacritics; same px sizes are kept (IBM Plex Sans Arabic is metrically balanced) but line-height increases and letter-spacing is forbidden.

| Rule | Value |
|---|---|
| Line-height multiplier | EN value × 1.12–1.15 → `text-display` 1.35 · `text-h1` 1.4 · `text-h2` 1.5 · `text-h3` 1.6 · `text-body-lg` 1.8 · `text-body` 1.75 · `text-body-sm` 1.65 |
| Letter-spacing | **Always 0** — spacing breaks Arabic joined script |
| Text-transform | **Never** uppercase Arabic (no case exists); `text-caption` in AR renders normal case at weight 600, no tracking |
| Measure | Max ~60–65 characters per line for prose |
| Font weight | Arabic appears optically lighter than Inter at equal weight; headings use weight 600 minimum, body stays 400 |
| Diacritics | Text content MUST be submitted with correct harakat where meaningful; UI never strips or adds diacritics |

### 7.4 Numeric & code handling

| Rule | Value |
|---|---|
| Digits | **Western digits (0–9) in BOTH locales** — this is a technical portfolio; metrics, dates and version numbers stay comparable across EN/AR. (Assumption documented in §14.) |
| Formatting | Numbers formatted with `Intl.NumberFormat(locale, { numberingSystem: "latn" })` so AR pages keep Western digits with locale-appropriate separators |
| Alignment | All numeric table cells, stats and dates: `text-align: end` (logical) + `font-variant-numeric: tabular-nums` |
| Mono domains | Tech stacks, versions, metrics, dates in tables, code blocks — always the mono stack |
| Code blocks | Always `dir="ltr"` + `text-align: start`, even inside AR pages; horizontal scroll, never wrap; language label in top-left (top-inline-start) |
| Inline code | `--code-inline-bg`, `--radius-sm`, padding 2px 6px, mono 0.875em |

---

## 8. RTL & bilingual rules

### 8.1 Route-level direction

| Route | `<html lang>` | `<html dir>` |
|---|---|---|
| `/en/...` | `en` | `ltr` |
| `/ar/...` | `ar` | `rtl` |

`lang` and `dir` are set server-side per route (App Router layout per locale). Metadata, OpenGraph locale, and JSON-LD `inLanguage` follow the same locale. Never client-toggle `dir`; navigation between locales is a route change (language switcher preserves the equivalent path per `docs/SEO-I18N.md`).

### 8.2 Logical properties (hard rule)

All layout CSS uses logical properties. In Tailwind this means `ps-*`/`pe-*`, `ms-*`/`me-*`, `start-*`/`end-*`, `text-start`/`text-end`, `border-s`/`border-e`, `rounded-s-*`/`rounded-e-*`. The physical utilities `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left-*`, `right-*`, `text-left`, `text-right` are **banned in component code** (CI lint may enforce; reviewers must reject). Physical values are permitted only for truly non-directional things: `top-*` for sticky headers, shadow offsets (shadows are NOT mirrored), and `inset-0`.

Flex/grid order follows document order — no `flex-row-reverse` for RTL (the direction attribute already mirrors it). `flex-row-reverse`/`grid-flow-*` is banned except inside deliberately symmetric layouts.

### 8.3 Directional icons

| Icon class | LTR form | RTL form | Mechanism |
|---|---|---|---|
| Forward/next, "read more" | arrow-right | arrow-left | `rtl:-scale-x-100` (or swapped icon via `dir` variant) |
| Back, breadcrumb separator | chevron-left/right | mirrored | same |
| External-link | arrow-up-right | NOT mirrored | keep (diagonal arrow is direction-neutral convention) |
| Dropdown caret | chevron-down | NOT mirrored | keep |
| Close, menu, copy, check, theme | — | NOT mirrored | keep |
| Progress/steps (How I work) | flows inline-start → inline-end | mirrored via logical layout | build with logical flex, icons auto-mirror |

Rule of thumb: mirror only icons that encode *reading direction*. Logos, social glyphs, media and code icons never mirror.

### 8.4 Mixed-direction text (bidi)

Arabic sentences embed Latin brand/tech tokens ("Next.js", "Supabase", "AGPL-3.0"). To prevent punctuation displacement:

1. Every standalone Latin token inside Arabic copy is wrapped in `<bdi>` (or `span[dir="ltr"]` with `unicode-bidi: isolate`). This applies to project names, tech names, emails, version numbers.
2. User-generated strings rendered anywhere (admin previews, inquiry data) render with `dir="auto"`.
3. Emails, URLs, code, and numeric-only strings: `dir="ltr"` + mono font, inline-block isolated.
4. Trailing punctuation/parentheses in mixed lines are authored inside the wrapper, not left dangling between runs.
5. Arabic-Indic digits are not mixed with Western digits in the same paragraph.

Example: `<span lang="ar">تطبيقات ويب مبنية باستخدام <bdi>Next.js</bdi> و<bdi>Supabase</bdi>.</span>`

### 8.5 Content pairing rules

- Every visible EN string has an AR counterpart in the translation tables; missing AR falls back to EN **with the original direction of the fallback string** (LTR) — never force-flip fallback text.
- Formatted dates use the page locale (`Intl.DateTimeFormat("en" | "ar", { numberingSystem: "latn" })`).
- Icons that carry meaning get `aria-label` in the active locale.

---

## 9. Theming & zero-FOUC

### 9.1 Resolution order (locked)

1. **Stored manual override** — `localStorage["fotedev-theme"]` ∈ {`light`, `dark`} (set only by explicit user action).
2. **System preference** — `prefers-color-scheme` (first visit, no override).
3. **Dark fallback** — if storage read fails or preference is unavailable, dark wins.

Dark is the default theme pair; the class-less/SSR default render is dark.

### 9.2 Implementation contract (zero-FOUC)

- Server renders `<html lang dir class="dark">` (dark-first SSR). A **blocking inline script** in `<head>` (not module, not deferred, placed before first paint) resolves the real theme and swaps the class before any paint:

```html
<script>
  (function () {
    try {
      var s = localStorage.getItem("fotedev-theme");
      var t = (s === "light" || s === "dark")
        ? s
        : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      document.documentElement.classList.toggle("dark", t === "dark");
      document.documentElement.classList.toggle("light", t === "light");
      document.documentElement.style.colorScheme = t;
    } catch (e) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  })();
</script>
```

- `<meta name="color-scheme" content="dark light">` present; CSS sets `color-scheme` per theme so native form controls, scrollbars and autofill match.
- Light tokens live on `:root`/`.light`, dark on `.dark`. Because the script is blocking, no flash occurs in either direction; the `try/catch` guarantees dark when storage is blocked (e.g. private mode).
- `next-themes` (or equivalent) may own the React side but MUST be configured: `attribute="class"`, `defaultTheme="dark"`, `enableSystem`, `disableTransitionOnChange`. Its injected script satisfies the blocking requirement; do not add a second, conflicting script.
- Theme transitions: color transitions of ≤ 200ms are allowed on body-level background/text (`transition: background-color, color var(--duration-fast)`), suppressed during init via `disableTransitionOnChange`.
- System-following behavior: while no override is stored, the page follows live `prefers-color-scheme` changes (`matchMedia` listener). Once the user picks a theme, the override persists across sessions until they explicitly reset ("Use system theme" link in the footer removes the key).

### 9.3 Theme toggle component

- Icon button (sun/moon) in the header, 40×40px hit area, `aria-label` = "Switch to light theme" / "Switch to dark theme" / "تبديل المظهر" per active locale.
- Toggling stores the chosen value immediately (persistent override). No "system" third state in the header; system reset lives in the footer.
- Toggle renders correct target icon based on **current** theme; it must not depend on client hydration timing (suppress hydration mismatch via mounted-guard or CSS-only swap).
- Both themes must be visually verified at: home hero, project card, form, table — a "light polish parity" check is part of the M2 acceptance list (§13).

---

## 10. Component specifications

All components implement `:focus-visible` rings (`--ring`, 2px outline, 2px offset), respect `prefers-reduced-motion`, and use logical properties. shadcn/ui components are themed to these values.

### 10.1 Buttons

Variants and sizes:

| Variant | Dark (rest) | Dark (hover) | Light (rest) | Light (hover) |
|---|---|---|---|---|
| `primary` | bg `--accent`, text `--accent-foreground` | bg `--accent-hover` + `--shadow-accent` | bg `--accent`, white text | bg `--accent-hover` |
| `secondary` | bg transparent, border `--border-interactive`, text `--text-secondary` | bg `rgba(148,163,184,0.08)`, border `--border-strong`, text `--text-primary` | bg `--bg-muted`, text `--text-primary`, no border | bg `#E2E8F0` |
| `ghost` | text `--text-secondary`, no bg | bg `rgba(148,163,184,0.08)`, text `--text-primary` | text `--text-secondary` | bg `--bg-muted`, text `--text-primary` |
| `destructive` | bg `rgba(239,68,68,0.12)`, text `--danger-text` | bg `rgba(239,68,68,0.22)` | bg `--danger`, white text | bg `#B91C1C` |
| `link` | text `--accent-text`, underline on hover | same | same | same |

| Size | Height | Padding-inline | Font |
|---|---|---|---|
| `sm` | 36px | 12px | 14px / 500 |
| `md` (default) | 40px | 16px | 14px / 500 |
| `lg` | 48px | 20px | 16px / 500 |

State matrix (all variants):
- **Focus-visible:** 2px `--ring` outline + 2px offset. On `primary` in dark (cyan fill), ring stays `#67E8F9` with offset — visible against page bg.
- **Active/pressed:** accent-active shade; translateY is NOT used (color only).
- **Disabled:** bg `rgba(148,163,184,0.10)` dark / `--bg-muted` light, text `--text-muted`, border transparent, `cursor: not-allowed`, removed from tab order via `disabled` attribute, `aria-disabled` when logically disabled but rendered.
- **Loading:** label replaced or followed by 16px spinner, `aria-busy="true"`, width preserved (min-width = rest width), disabled during pending.
- **Icon-only:** 40×40px (36 for `sm`), `aria-label` mandatory.
- One `primary` per view section maximum (calm rule); CTAs: "Start a project" (contact) and "View work".

### 10.2 Inputs & form fields

Applies to text, email, textarea, select. Height: 44px (`textarea` min-height 120px). Radius `--radius-md`. Padding-inline 12px. Label above field: `text-body-sm` weight 500, `--text-secondary`, margin-bottom 6px. Helper text below: 13px `--text-muted`.

| State | Dark | Light |
|---|---|---|
| Rest | bg `--bg-surface`, border 1px `--border-interactive`, text `--text-primary`, placeholder `--text-muted` | same tokens, light values |
| Hover | border `--border-strong` | border `--border-strong` |
| Focus | border `--accent-text` + 3px `--ring-input` halo | same, light values |
| Error | border `--danger-border`, message below (see 10.8), `aria-invalid="true"` | same |
| Disabled | bg `--bg-muted`, border `--border-default`, text `--text-muted` | same |
| Read-only | bg `--bg-muted`, border `--border-interactive` | same |

Rules: labels are always visible (placeholder is never a label); `for`/`id` pairing mandatory; autofill styling via `color-scheme` (no manual `:-webkit-autofill` hacks); email/URL inputs get `dir="ltr"` attribute inside AR pages (label stays RTL-aligned via logical alignment); select has 44px custom chevron, native dropdown acceptable; required fields marked with `*` in the label + `aria-required`.

### 10.3 Cards

| Variant | Dark | Light | Use |
|---|---|---|---|
| `surface` | bg `--bg-surface`, border `--border-default`, radius `--radius-lg`, padding 24px (16px mobile) | same | Project cards, service cards, info panels |
| `interactive` | `surface` + hover: border `--accent-border`, `--shadow-md` | same | Clickable project/case-study cards |
| `flat` | bg `--bg-muted`, no border | same | Grouped lists, quote blocks, stat rows |

Interactive cards: entire card is one link (single focusable element), `aria-label` summarizing destination; hover transitions `--duration-base`; focus ring on the card outline; no scale/translate hover (border + shadow only). Card headings `text-h3`, body `text-body-sm`–`text-body`, meta row `text-caption` in `--text-muted`. Media inside cards: `--radius-xl`, fixed aspect ratio (16:9 covers, 4:3 gallery) with `object-cover`.

### 10.4 Tables

Used for: contributions list (OSS credibility), admin inbox (M5), metrics.

- Header: bg `--bg-muted`, `text-caption` weight 600, text `--text-secondary`; EN uppercase+tracking, AR normal case (per §7.3); bottom border `--border-strong`.
- Rows: bottom border `--border-default`; hover bg `rgba(148,163,184,0.05)` dark / `#F1F5F9` light; padding-block 12px, padding-inline 16px.
- Numeric/status columns: `text-align: end`, `tabular-nums`, mono for figures.
- Status cells use §10.5 pills.
- Row click targets (admin only) need keyboard alternative — admin tables use a trailing actions button, never row-only click.
- **Mobile (< 640px):** tables restructure to stacked cards (label:value pairs), keeping semantic `<table>` markup with `role` attributes or switching to definition-list markup at the data layer — the visual table is desktop-only.
- Empty state: `--bg-muted` panel, muted icon + localized "No entries yet" text; loading state: 3 skeleton rows (static under reduced motion); max-height 480px with sticky header when long.

### 10.5 Chips & status pills

Rounded-full, `type-pill` — sentence case, 12–13px / weight 500, letter-spacing 0.01em (0 in AR) per ADR-0009 — padding 2px 10px, `--radius-full`.

| Pill | Dark (bg / text) | Light (bg / text) |
|---|---|---|
| `success` (merged, available) | `--success-bg` / `--success-text` | same |
| `warning` (acknowledged, limited availability) | `--warning-bg` / `--warning-text` | same |
| `danger` (reserved for errors) | `--danger-bg` / `--danger-text` | same |
| `neutral` (open, draft) | `rgba(148,163,184,0.12)` / `--text-secondary` | `rgba(100,116,139,0.10)` / `--text-secondary` |
| `accent` (tech tag) | `--accent-subtle` / `--accent-text` | same |

Honesty mapping is content-level: "merged" = success, "open" = neutral, "acknowledged" = warning (per `docs/CONTENT-EVIDENCE.md` semantics). Pills never encode unverifiable claims.

### 10.6 Navigation

**Desktop (≥ 768px):** header 64px, sticky, `bg: color-mix(in oklab, var(--bg) 82%, transparent)` + `backdrop-filter: blur(12px)` + bottom border `--border-default` (border only after scroll > 8px, `--shadow-sm` with it).

Layout: wordmark `fotedev` (16px/600, `--text-primary`, links home, never an image logo in v1) at inline-start → nav links (Projects, Services, About, Contact; 14px/500, `--text-secondary`) → theme toggle, language switcher, `primary sm` "Start a project" at inline-end.

- Link states: hover `--text-primary` (`--duration-instant`); active route: `--text-primary` + 2px accent underline (2px, 6px offset, full label width). Underline is `border-image`-free plain element; in RTL it mirrors automatically (logical layout).
- Language switcher: text button "العربية" / "English" (shows the *other* locale name in that locale), navigates to equivalent path, `hreflang` attributes present.
- Keyboard: header is a `<header>` landmark with `<nav aria-label="Primary">`; skip-link precedes it.

**Mobile (< 768px):** header 56px; visible items: wordmark, theme toggle, hamburger (44×44, `aria-expanded`, `aria-controls`, `aria-label="Open menu"` / localized). Tap opens a full-width panel below header (bg `--bg-surface`, `--radius-lg` bottom corners, `--shadow-lg`, slides down 200ms `--ease-out`):

- Links stacked, 48px row height, 16px font, padding-inline 16px; active route uses accent-subtle pill bg.
- "Start a project" `primary md` full-width at panel end.
- Behavior contract: focus trapped in panel while open; `Escape` closes and returns focus to hamburger; scrim click closes; body scroll locked; panel `role="dialog"` `aria-modal="true"` `aria-label="Site menu"` (localized); closes on route change; state fully keyboard-operable; no nested menus in v1.

### 10.7 Footer

- Top border `--border-default`; bg transparent on `--bg`; padding-block 48px (32px mobile).
- Layout desktop: 3 columns — (1) identity: wordmark + one-line offer (localized, `text-body-sm`, `--text-muted`), (2) contact: email as `link` button + "Copy email" icon button with clipboard confirmation (visually-hidden live region "Copied" / localized), (3) links: GitHub, LinkedIn (from site settings), theme reset ("Use system theme", only when an override exists).
- Bottom row: `text-caption` `--text-muted`: `© {year} Ahmed Aboalayoun` + license line `Code: AGPL-3.0-only · Content & assets: All rights reserved` (localized, AR version keeps license identifiers in `<bdi>`).
- All footer links ≥ 44px hit height on mobile; landmarks `<footer>`; no badge walls, no GitHub stats widgets (locked non-goal).

### 10.8 Forms with inline errors (contact slice, M4; layout rules apply from M2)

- Single column, max `--container-reading` (560px inner), field vertical gap 24px (`--spacing-6`), with 8px label–field gap.
- **Inline error** per field: below the field, 13px/500 `--danger-text`, prefixed by 14px alert icon; container `id="{field}-error"` referenced by `aria-describedby`; sets `aria-invalid="true"` on the input; appears without layout jump (reserved 0 is fine — error inserts and pushes, transition ≤ 200ms color only).
- **Validation:** client-side on blur + on submit (Zod schemas mirrored server-side); server errors map to the same inline slots. Never rely on color alone — icon + text.
- **Submit failure summary:** if ≥ 1 invalid field on submit, render an error box (`--danger-bg`, `--radius-md`) at form top with `role="alert"`, listing each error as an anchor that focuses its field; keyboard focus moves to the box.
- **Pending:** submit button enters loading state (§10.1), `aria-busy`, form fields stay editable but re-submit is blocked (idempotency per prompt-1 §6).
- **Success:** form is replaced by a success panel (check icon `--success-text`, `--success-bg` panel, `--radius-lg`) with localized message + "email directly" fallback (mailto button) — success is shown from storage result, never from email delivery; panel receives focus (`tabIndex={-1}`).
- **Honeypot:** field named `website`, `aria-hidden="true"`, `tabIndex={-1}`, visually hidden; submits are silently dropped server-side.
- **Turnstile widget** sits above submit; its error state uses inline-error styling; widget container gets `--radius-md` border on error.

---

## 11. Accessibility floor (WCAG 2.1 AA — minimum shipped state)

| Requirement | Contract |
|---|---|
| Contrast | All text ≥ 4.5:1 (≥ 3:1 large ≥ 24px/18.66px-bold); interactive component boundaries & focus indicators ≥ 3:1 (§2.5 table is the verified baseline; new color usage must be re-verified) |
| Focus visibility | `:focus-visible` ring on EVERY interactive element: 2px `--ring` + 2px offset; never `outline: none` without replacement; ring visible over both themes and over accent fills |
| Keyboard operability | All functionality reachable and usable by keyboard alone; logical tab order (DOM order); no positive `tabindex`; overlays trap focus; `Escape` closes; no keyboard traps |
| Skip link | First tabbable element: "Skip to main content" (localized); visually hidden until focused (renders at top, `--accent-subtle` bg, `--ring` focus); jumps to `<main id="main-content">` |
| Landmarks | `<header>` (banner), `<nav aria-label>` (primary + footer nav labeled "Footer"), `<main>` (exactly one, `id="main-content"`), `<footer>` (contentinfo); exactly one `<h1>` per page; heading levels never skip |
| Forms | Programmatic label per field (`<label for>`), `aria-describedby` for helper+error, `aria-invalid`, `aria-required`, error summary `role="alert"`, focus moved to first invalid field on failed submit |
| Live regions | Async messages (copy-confirmation, form status, theme change is silent) in `aria-live="polite"` regions |
| Images | Every informative image has localized `alt` (EN+AR from `media_assets`); decorative images `alt=""`; media never the sole carrier of information |
| Target size | Interactive targets ≥ 44×44px on touch layouts (≥ 24×24px absolute minimum), with 8px separation |
| Reflow | Usable at 320px width and at 200% zoom without horizontal scrolling of text content (excluding code blocks, which scroll internally) |
| Motion | `prefers-reduced-motion` honored globally (§6); nothing flashes more than 3×/second |
| Color independence | Status is never color-only: pills carry text labels; errors carry icons + text; links underlined or ≥ 4.5:1 + underline-on-hover — links in prose are underlined |
| Language | `lang`/`dir` per route (§8.1); parts in another language get `lang` attribute (e.g. `<bdi lang="en">`) |
| Testing bar (per `docs/QUALITY.md`) | axe clean on all public pages (both locales, both themes) + manual keyboard walkthrough + TalkBack/VoiceOver pass on Home→Contact |

This floor is enforced in M6 audit; components that violate it do not pass M2 review.

---

## 12. Do / Don't

**Do**
- Neutral slate surfaces, one cyan/blue accent, generous whitespace, tabular numbers, logical properties, calm borders + subtle shadows.
- Reserve `--accent-subtle` for selection/active states; reserve glow (`--shadow-accent`) for the primary CTA hover.
- Keep both themes visually equivalent — check every component in dark AND light before merge.
- Wrap mixed-direction tokens in `<bdi>`; test every AR page with real Arabic content, not translated placeholders.

**Don't**
- No neon-terminal aesthetics: no glow text, no scanlines/grid overlays, no CRT noise, no blinking cursors in headings, no terminal-style chrome around ordinary sections. (The hero lattice's amber bloom is exempt - ADR-0010 §3 - and is the only such treatment on the site.)
- No streak counters, contribution-graph widgets, badge walls, star-history charts, or "visitor counters" anywhere on the site (locked decision).
- No second decorative hue; no gradient text on body; no rainbow tags.
- No parallax, autoplay media, ambient loops, scroll-jacking, or > 200ms animations. (The hero lattice is the sole exception, and its scroll coupling is read-only - ADR-0010 §4.)
- No letter-spacing, text-transform, or negative tracking on Arabic.
- No physical-direction CSS (`pl/pr/ml/mr/left/right`) in components; no `flex-row-reverse` for RTL compensation.
- No placeholder-as-label; no color-only status; no contrast exemptions for "decorative" text.

---

## 13. M2 acceptance checklist (design contract verification)

M2 is not done until all of the following are demonstrably true:

1. All §2 tokens exist as CSS custom properties in both themes; zero raw hex values in component code (grep-verified).
2. Zero-FOUC verified: hard refresh with light system preference on a dark-default build shows no dark flash; same test reversed; private-mode (storage blocked) falls back to dark with no flash.
3. Manual theme override persists across reloads; "Use system theme" clears it; live system-preference change is followed while no override exists.
4. `/en` and `/ar` render with correct `lang`/`dir` per route; RTL layout mirror verified on header, nav (mobile sheet), footer, cards, forms, tables.
5. No physical-direction utilities in components (lint/grep clean).
6. Type scale implemented with AR line-height overrides; Arabic text has zero letter-spacing; numerals are Western + tabular in both locales.
7. All §10 component states exist in both themes: buttons (5 variants × 6 states), inputs (7 states incl. error), cards (3 variants + interactive hover/focus), table (header/hover/empty/loading), pills (5), desktop nav + mobile sheet (focus trap, Escape, scroll lock), footer, form error/success/pending paths.
8. Skip link works as first tab stop on every page; landmarks and single `<h1>` verified in both locales.
9. Keyboard-only walkthrough completes Home → Projects → Contact → submit-success in both locales.
10. axe clean (zero critical/serious) on all public routes, both themes, both locales; reduced-motion walkthrough confirms no transform animation.
11. Motion audit: no animation/transition exceeds 200ms (computed-style check on hover and reveal states).

---

## 14. Documented assumptions (owner-visible)

1. **Numerals:** Western digits (0–9) used in both EN and AR (technical-audience consistency); AR number grouping via `Intl` with `numberingSystem: "latn"`. Reversible via one formatting utility if Ahmed prefers Arabic-Indic digits later.
2. **Theme resolution:** stored override → system → dark, with dark as SSR default (satisfies both "dark default pair" and "system on first visit").
3. **Fonts:** Inter + Fira Code + IBM Plex Sans Arabic locked (Geist Sans/Geist Mono documented as approved alternates).
4. **Storage key:** `fotedev-theme`; values `light`/`dark` only; "system" is represented by key absence.
5. **Breakpoints:** Tailwind defaults (`sm 640 / md 768 / lg 1024`); nav collapses below `md`, tables below `sm`.
6. **Container values:** 1152px content / 720px reading — chosen for 16px body measure ≈ 68ch EN.
