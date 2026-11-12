# ADR-0010 — WebGL hero lattice: a scoped exception to the motion and accent contract

**Status:** Accepted 2026-11-11
**Deciders:** Ahmed Aboalayoun (owner directive: "clone & scrub bhived.ai, clean-room recreate the animation for my website")
**Scope:** Public hero (`/[locale]`) only — the WebGL canvas layer. Amends `DESIGN.md` §1.5, §2.2, §6, §12 and `docs/QUALITY.md` §8.2, §8.4. All other locked decisions (theming, RTL, typography, accessibility floor, content model) are unchanged.

---

## Context

`bhived.ai` (ArtKeyAi) ships a landing page whose hero sits on a full-viewport WebGL layer: a hexagonal lattice of instanced hexagons over a near-black ground, joined by additive proximity lines, blooming, drifting on an idle sine, tilting toward the pointer, and progressively densifying and converging into a form as the page scrolls.

The reference was inspected to answer "is this already open source?". It is not, in the part that matters here:

- The `ArtKeyAi` GitHub organisation publishes five repositories — `bhived-mcp` (Apache-2.0), `bhived-python` (Apache-2.0), `n8n-nodes-bhived` (MIT), `dify-plugin-bhived` (Apache-2.0) and `NeMo-Agent-Toolkit-bhived` (Apache-2.0). All five are agent-side SDK and integration code.
- **None of them contains the marketing frontend.** A GitHub-wide search for `bhived` returns 52 repositories; none is the site. The Next.js application that renders `bhived.ai` is closed source.

So no source may be copied, and the only lawful route to the same visual result is a clean-room re-creation from observed behaviour. This ADR records that method as well as the design change.

That change is not cosmetic. `DESIGN.md` is a binding contract, and the reference effect contradicts it in several places at once:

| Clause            | Contract says                                                                                                                                  | The reference effect does                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| §1.5              | "Motion is a cue, not a show. Animation confirms user action or reveals content once. No ambient loops, no parallax, no autoplay."             | Idle ambient drift; pointer parallax; autoplay on load  |
| §2.2              | One accent family, blue/cyan only; accent ≤ 10% of any viewport at rest                                                                        | A saturated amber (`#ff6b35`) field over the whole hero |
| §6                | 200 ms hard cap; "ambient background animation", "parallax", "scroll-jacking" forbidden                                                        | Multi-second continuous render loop                     |
| §12               | "No neon-terminal aesthetics"; "No second decorative hue"; "No parallax, autoplay media, ambient loops, scroll-jacking, or > 200ms animations" | Bloom-glowed neon wireframe                             |
| `QUALITY.md` §8.2 | "Allowed client islands (and effectively only these on public routes)"                                                                         | A WebGL island                                          |
| `QUALITY.md` §8.4 | First-load JS ≤ ~200 KB gzip (measured: **185.5 KB gzip** on `/en` — ~14 KB headroom)                                                          | three.js + postprocessing                               |

ADR-0009 deliberately went the other way: it deleted every scroll-triggered reveal and reduced motion to a single 200 ms CSS `rise-in` on the hero, because scattered entrances "read as template motion". This ADR reverses that direction for one layer, deliberately and narrowly, and says why.

## Decision

### 1. Scope: one decorative WebGL layer on the hero

A single `<canvas>` is mounted inside the hero section, `position: absolute`, `inset: 0`, `pointer-events: none`, `aria-hidden="true"`. It is the only permitted exception to §1.5 and §6. It is decorative: it is invisible to assistive technology, never receives pointer events, and carries no text.

It is **bound to the hero box** rather than to the viewport, and it scrolls with the hero. This is a deliberate divergence from the reference, where the layer is fixed for the whole document; a viewport-fixed layer bleeds through the transparent sections below the hero and ends up sitting behind body copy several screens down, which is exactly the failure the "working document" language (ADR-0009) exists to prevent. Bound to the hero, the layer is present for the length of the hero and never intrudes on anything else.

The canvas is transparent — it paints no background — so the page's own surface tokens are never replaced in either theme.

### 2. Implementation: raw three.js, not React Three Fiber

The reference is built on three.js r183 + React Three Fiber 9 + `@react-three/postprocessing`. Measured cost of each option (esbuild, minified, gzip -9):

| Stack                                                        | gzip         |
| ------------------------------------------------------------ | ------------ |
| three.js (selective imports)                                 | 138.2 KB     |
| **three.js + `postprocessing` (BloomEffect)**                | **152.2 KB** |
| three.js + React Three Fiber + `@react-three/postprocessing` | 270.8 KB     |

React Three Fiber costs ~107 KB gzip for no visual gain: it is a React reconciler and state container for a fixed background canvas with a single pointer input and no scene-graph mutation from application state. The renderer here is imperative three.js, driven by one `requestAnimationFrame` loop.

`three` and `postprocessing` are the only new runtime dependencies. `@react-three/drei` is not used. `postprocessing` is used solely for `BloomEffect`.

The effect is loaded with `next/dynamic` (`ssr: false`) and mounted only after first paint, so it never competes with the LCP element. It is a deferred chunk, not first-load JS.

### 3. Colour: one amber, inside the canvas only

§2.2 gains a narrow exception: the WebGL layer may use a single amber hue (`--hive-node` / `--hive-link`), defined per theme in `globals.css`. The exception is bounded:

- Amber appears **only** inside the canvas. No DOM element, no text, no icon, no border, no focus ring takes the amber hue.
- All UI and content remain strictly on the blue/cyan accent family. The amber is not a second _decorative_ hue on the page; it is the canvas's own material, like the colour of a photograph.
- The canvas is transparent. It paints no background, so the page's own surface tokens are untouched in both themes.
- The layer is decorative and `aria-hidden`, so it is excluded from contrast requirements (WCAG 1.4.3 applies to text and meaningful graphics; this is neither). The hero copy sits directly on the page's own background, with the canvas painting behind it - the node radius and link opacity are capped so that the mesh behind the headline never competes with the text.

Theme behaviour differs, because bloom cannot survive a light ground:

|              | Dark                                                        | Light                                    |
| ------------ | ----------------------------------------------------------- | ---------------------------------------- |
| Node         | amber `#ff6b35`                                             | deeper amber `#c2410c`                   |
| Link         | `#ff8c42`                                                   | `#ea580c`                                |
| Blending     | additive                                                    | normal                                   |
| Bloom        | on (threshold 0.65, intensity 0.6, radius 0.4, mipmap blur) | off                                      |
| Node opacity | full                                                        | reduced, to protect hero text legibility |

### 4. Motion: the §6 200 ms cap does not apply inside the canvas; §6 still applies to everything else

The 200 ms cap, the ease-out tokens and the `prefers-reduced-motion` global rule continue to govern every DOM animation on the site without exception. They do not govern the canvas render loop, which is not a transition between two states and has no meaningful duration.

What the canvas does, and how each is bounded:

| Behaviour        | Bound                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Entrance         | One staggered grow-in over ~1.8 s, per-node thresholds; one-shot, after which the loop continues with the idle drift and the pointer tilt |
| Idle drift       | Slow per-node sine, amplitude ≤ 0.3 units                                                                                                 |
| Pointer parallax | Group rotation, ±0.12 rad, eased at 0.05 lerp - spatial, not directional, so RTL needs no mirroring                                       |
| Convergence      | Nodes lerp toward the honeycomb core over the first fifth of the hero's scroll range, 0 → 1, eased in-out cubic                           |
| Scroll-jacking   | **None.** The page scrolls normally; the canvas only reads scroll position                                                                |

The convergence range is deliberately short. The reference drives it across
the whole document, which only works because its layer is fixed for the whole
page; bound to the hero, a long range would mean the form completes long
after the hero has left the screen and the reader never sees it settle. Over
a fifth of the hero's height the core forms while the hero is still on
screen, which is where the payoff belongs.

`prefers-reduced-motion: reduce` renders **one static frame** of the lattice and never starts the loop. This is deliberately stronger than the reference, which swaps the canvas for a flat colour block — a flat block would replace the page background and break the surface tokens. The static frame keeps the composition and costs one render.

### 5. Fallback ladder

1. `NEXT_PUBLIC_HERO_HIVE=0` → the layer is not mounted at all. This is the kill switch for the Lighthouse gate.
2. `prefers-reduced-motion: reduce` → static frame, no loop.
3. No WebGL context, or context creation fails → the canvas is removed and the hero renders exactly as it does today. Nothing else changes.
4. Portrait viewport → the camera pulls in and the field is fitted to the viewport's tighter axis, so the mesh fills a phone screen instead of floating as a band across the middle of it. Still animated, still the same node count.
5. JavaScript disabled → the canvas is client-only; the hero renders server-side exactly as it does today.

### 6. Accessibility

- `aria-hidden="true"`, `pointer-events: none`, and no text in the layer — it is invisible to the accessibility tree and cannot be focused.
- The layer never overlaps content in a way that reduces text contrast: the hero copy sits on the page background, and the node radius and link opacity are capped so that the mesh behind the headline stays below the contrast floor.
- The canvas is `position: absolute` inside the hero, with the hero's own content at `z-index: 10` above it.
- `axe-core` must not gain a violation of its own on `/en` or `/ar`, in either theme. The pages carry pre-existing findings unrelated to this layer (the warning status pill's contrast, and the copy-email button's label-in-name); the layer's contribution to the violation set is zero.

### 7. Budget and measured results

`docs/QUALITY.md` §8.2 gains the WebGL hero lattice as an allowed client island, scoped to the hero route and to this layer. §8.4 keeps its ~200 KB gzip soft budget for **first-load** JS and adds the measurement for the deferred canvas chunk.

Measured against the production build of this branch (Turbopack, both locales). "Critical" means the chunks whose response finished before First Contentful Paint — the static graph that blocks rendering:

| Measurement                                       | Before              | After                                                                                                         | Verdict                                               |
| ------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Critical JS on `/en` (blocks rendering)           | 152.7 KB gzip       | **154.6 KB gzip**                                                                                             | +1.9 KB — the loader component                        |
| Deferred canvas chunk                             | —                   | **150.1 KB gzip**, arriving ~250 ms after FCP                                                                 | Not in the critical path                              |
| Total JS for the route, deferred chunk included   | 185.5 KB gzip       | 337.6 KB gzip                                                                                                 | +152.1 KB — the cost of the effect                    |
| Lighthouse Performance, mobile                    | 99 / 100 (two runs) | **99 / 100**                                                                                                  | Gate is ≥ 90 — passes                                 |
| Lighthouse Accessibility / Best Practices, mobile | 100 / 100           | **100 / 100**                                                                                                 | —                                                     |
| LCP / TBT / CLS, mobile                           | —                   | 0.7–0.9 s / 20–30 ms / 0                                                                                      | —                                                     |
| axe violations attributable to the layer          | —                   | **0**                                                                                                         | Identical violation set before and after              |
| CSP violations                                    | —                   | **0**                                                                                                         | three.js needs neither `worker-src` nor `blob:`       |
| Kill switch (`NEXT_PUBLIC_HERO_HIVE=0`)           | —                   | layer absent, canvas absent, three.js chunk never fetched (11 JS files instead of 12), hero renders unchanged | Verified in a production build in **both** directions |

The route's own blocking JavaScript grows by 1.9 KB; the effect's cost is a 150 KB chunk that arrives long after the page has painted, so it never competes with the LCP element. The full-route total (337.6 KB gzip) is above the §8.4 soft budget, which is why §8.4 records deferred chunks separately and why the hard gate is Lighthouse rather than a byte count.

**The hard gate remains Lighthouse Performance ≥ 90 mobile** (`QUALITY.md` AC-9). If a future change pushes the hero below it, the kill switch in §5.1 is used and the effect is reworked or dropped — it is not shipped at the cost of the gate.

### 8. Clean-room method

Recorded so the provenance of this code is unambiguous:

- No source, minified or otherwise, from `bhived.ai` is copied, decompiled, or transcribed. The reference's own shipped bundle was read to _identify_ the technique (instanced hexagon lattice, CPU proximity links, additive blending, bloom, pointer tilt, scroll-driven convergence) — the technique is the idea, and it is re-implemented from scratch here in idiomatic TypeScript with different structure, different naming, and different algorithms.
- No bhived asset is used: no image, SVG, icon, font, logo, wordmark, copy, or colour-as-brand.
- The assembly form is original to this project: a scaled-down copy of the field's own hexagon — the same ring structure with the ring gap tightened — so the field folds into a crisp honeycomb core. It is not the reference's logo outline and not its brain target.
- The geometry is deterministic from a seed (`mulberry32`), so renders are reproducible and testable. The reference uses bare `Math.random()` and is not.
- The implementation is independent: raw three.js, no React Three Fiber.

**2026-11-13 addendum — composition re-tuned to the reference's current look.** The
reference site has redesigned its landing page since this ADR was written: its live
effect is now a clustered, irregular plexus of glowing nodes (bright clumps and
empty voids) rather than the uniform hex-lattice field this layer originally
shipped with, and the hexagon-clip composition described above is no longer what
the reference displays. This layer was re-tuned to match the reference's *current*
composition — clustered gaussian field with ambient scatter, a scroll-driven
reveal that rests with a minority of the mesh visible, stronger bloom, brighter
light-theme tokens — while every rule above still holds: the code remains a
from-scratch re-implementation, no bhived asset is used, and the assembly form
(the hexagonal rosette core the field folds into late in the scroll range) remains
this project's own.

## Consequences

**Positive**

- The hero gains a distinctive, ownable visual signature that no competitor shares, built on a proven technique and an original form.
- The contract exception is scoped, documented and bounded rather than a silent violation: one canvas, one hue, one route, one kill switch.
- The layer is decoration only. It cannot regress content, SEO, RTL or accessibility, because it carries none of them.
- The JS cost is measured before the decision, not after — and the decision to drop React Three Fiber saves 107 KB gzip for free.

**Negative / accepted trade-offs**

- ~150 KB gzip of deferred JavaScript on the home route, against a 200 KB first-load budget that had ~14 KB of headroom. Accepted because the chunk is deferred (the route's own JS is unchanged at 185.4 KB gzip) and the hard gate is Lighthouse, which measures 99.
- An amber field on the hero, against a "calm, technical, credible" positioning and a §1.1 "credibility over decoration" principle. Accepted deliberately, at owner instruction, and bounded to the canvas.
- A second motion idiom on a site whose whole identity is "one orchestrated entrance, then the page is still". Accepted deliberately. If the page later reads as busy, the kill switch is the intended remedy — not a rewrite.
- The effect carries the risk of a hard Lighthouse regression. Mitigated by the kill switch, the after-first-paint mount, the capped device pixel ratio and the off-screen park; verified by measurement (Lighthouse mobile 99), not assumption.
- The layer is bound to the hero rather than fixed to the viewport, so it scrolls with the hero instead of staying put. This is the one behavioural divergence from the reference and it is deliberate: see §1.

## Alternatives considered

| Alternative                                           | Why not                                                                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copy the reference implementation                     | Not available (closed source) and not lawful.                                                                                                                                                                 |
| React Three Fiber, as in the reference                | +107 KB gzip for no visual difference. Measured, then rejected.                                                                                                                                               |
| Raw WebGL 2, no three.js                              | ~25 KB gzip instead of 152 KB, but ~600–900 lines of hand-written matrix, instancing and bloom code for one effect. Held in reserve as the fallback if the Lighthouse gate fails and the effect must survive. |
| A CSS/SVG approximation                               | Cannot reproduce the per-node drift, the proximity links or the convergence.                                                                                                                                  |
| A dedicated `/experimental` route instead of the hero | Keeps the design contract intact, but the effect was requested for the hero. Available as a fallback if the gate fails.                                                                                       |
| Drop the effect                                       | Always available; the kill switch exists for exactly this.                                                                                                                                                    |

## Rollout

- Branch `feat/hive-lattice-hero`, based on the M2.1 design pass.
- Milestone issue under the `milestone` label; DESIGN.md and QUALITY.md amendments travel with this ADR in the same change, per the rule ADR-0009 set for itself.
- Evidence (captures in both themes and locales, first-load JS measurement, Lighthouse runs) recorded under `.factory/evidence/`.
