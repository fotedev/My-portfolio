# Content Evidence Log

**Rule:** Nothing may be published on the site unless it has a row here with a verification date and source URL. Open PRs are always labeled **open** — never "merged". Closed-unmerged PRs are never labeled "merged". Vendor-acknowledged disclosures are labeled **acknowledged** — never "fixed".

All rows verified live on **2026-11-06**.

**Re-verified 2026-11-07 (M3 publish pass):** OSS statuses unchanged (#114809 merged 2026-09-18; #106626 + #122144 open, updated 2026-10-17; minimax #141 closed not_planned 2026-10-19). `fotedev/ghost` re-confirmed: public, **28 stars**, Apache-2.0, pushed 2026-11-07. `fotedev/Masar-x-next` re-confirmed: public, homepage `https://masarx.vercel.app/`, pushed 2026-11-07. **khalat published as a case study per owner directive (2026-11-07): repository is private (GitHub API 404, verified 2026-11-06), so all case-study statements are owner-attested in this conversation; the UI renders a "Private production repo" badge and `repo_url` stays NULL — no public-source claim is made. `fotedev/context` stays unpublished (undocumented repo; owner directive: keep as draft — no row created).**

## Verified profile links (seed source: profile README `fotedev/fotedev`)

| Item | Value | Source |
|---|---|---|
| Email (public) | `fote.engineer@gmail.com` | README "Connect" section (mailto) |
| GitHub | `https://github.com/fotedev` | README |
| LinkedIn | `https://www.linkedin.com/in/fotedev` | README |
| X (Twitter) | `https://x.com/FoteTeam` | README |
| Telegram | `https://t.me/ACYRO0016K` | README |
| YouTube | `https://www.youtube.com/channel/UCmfp_B-hOFq4UW5g1T4LCvQ` | README (badge URL carries `?sub_confirmation=1` — strip it on the site) |
| Facebook | `https://www.facebook.com/profile.php?id=61558539080140` | README (optional footer only) |
| Instagram | `https://www.instagram.com/devtech.team/` | README (optional footer only) |

## Case-study candidates (proposal — Ahmed approves at GATE 1)

| Repo | Verified state (2026-11-06) | Live demo | Honest summary | Recommendation |
|---|---|---|---|---|
| `fotedev/Masar-x-next` | Public, TypeScript, last commit 2026-11-05 (active) | `https://masarx.vercel.app` (repo homepage + README) | pnpm monorepo: Next.js web (live in production) + Electron desktop + Expo mobile sharing one Supabase backend (RLS, Edge Functions); bilingual AR/EN AI study platform with semantic PDF search and vector indexing | **Strong — propose as case study #1** |
| `fotedev/ghost` | Public, PowerShell (+ Python core), 28 stars (re-verified 2026-11-07), Apache-2.0, Pester/ShellCheck/unittest suites + CI | none (CLI, clone-and-run) | GHOST rotates device/machine identifiers for AI IDEs (Cursor, Windsurf, ZCode, …) with audit logs and restore scripts. **Caveat:** its own README/SECURITY.md warn it may violate vendor ToS — frame strictly as privacy/dev-hygiene engineering, or skip | **PUBLISHED in M3 (owner decision 2026-11-07): privacy/dev-hygiene framing + explicit responsible-use note in both locales** |
| `fotedev/context` | Public, Python, last commit 2026-09-21; no root README (`docs/README.md` is entry), no demo | none | "File Aggregator": CLI/TUI/GUI aggregating source files + snippets into arena contexts, tiktoken token counting, Gemini Flash judge for model-output comparison (LMArena workflow), 18 stars | **Weak — real but undocumented; needs a README pass before it can be a case study** |
| `fotedev/khalat` | **Does not exist publicly — GitHub API 404.** Closest match: `fotedev/ELKHLAT` is **private** | n/a | n/a publicly | **PUBLISHED in M3 (owner directive 2026-11-07, option c): private production repo, `repo_url` NULL, "Private production repo" badge, all statements owner-attested — zero public-source claims** |
| Old `fotedev/My_portfolio` | Public, JavaScript, pushed 2025-09-02; README fetch failed (API symlink-blob error) — metadata only | `https://fote.vercel.app` (repo homepage) | Previous portfolio; self-referential for the new site | **Skip as case study** |
| "Interactive SaaS & UI Platform" / "AI Pipelines & Agentic Tooling" (profile rows) | Both link to the GitHub **profile**, not distinct repos | — | Content leads only — no backing repo found | **Not publishable as case studies** |

## Verified open-source & security contributions

| Claim | Source (URL) | Verified | Status to publish |
|---|---|---|---|
| hermes-agent PR #109834 (`fix(cli): honour key_env/api_key in config.yaml model.aliases entries`) authored by `fotedev` | https://github.com/NousResearch/hermes-agent/pull/109834 | 2026-11-06 | **Closed (not merged)** — accurate phrasing: *"closed as superseded; the fix was salvaged into merged PR #114809 with an attributed commit"* |
| Salvage: #114809 merged to main 2026-09-18 by `teknium`; commit `74f75fe` authored by `fotedev` ("Source hunk from PR #109834"); #114809 body credits "Salvages #109834 (@fotedev) — source hunk, earliest filer" | https://github.com/NousResearch/hermes-agent/pull/114809 | 2026-11-06 | **Merged (the salvage PR is the merged artifact)** |
| #114809 verbatim title (re-read live for the seed): `fix(config): malformed custom_providers no longer empties the providers view; config set refuses type mismatches; nested aliases keep key_env (#114605, #114471, salvage #45730, #109834)` | https://github.com/NousResearch/hermes-agent/pull/114809 | 2026-11-06 | **Confirmed verbatim** (PR page title; merged=true 2026-09-18T16:41:03Z, merged_by=teknium1) |
| hermes-agent PR #106626 (`fix(gateway): prefer session model override in /usage billing route`) | https://github.com/NousResearch/hermes-agent/pull/106626 | 2026-11-06 | **Open** (last updated 2026-10-17) |
| hermes-agent PR #122144 (`fix(windows): respawn gateway on the venv interpreter …`) | https://github.com/NousResearch/hermes-agent/pull/122144 | 2026-11-06 | **Open** (last updated 2026-10-17) |
| minimax-code issue #141 (insecure plaintext storage of Telegram bot tokens; Windows NTFS permission fallbacks in `@mavis/local-runtime`) — vendor response 2026-09-21 by collaborator `hetaoBackend`: "Thank you for the responsible, detailed disclosure. Acknowledged on both counts… Forwarded to security review." | https://github.com/MiniMax-AI/minimax-code/issues/141#issuecomment-5753819247 | 2026-11-06 | **Acknowledged** — issue closed 2026-10-19 as `not_planned`; no fix PR referenced. Never label "fixed" or "resolved" |

## Certificate (source of truth: the PDF itself)

Source: `ahmed-aboalyoun-certificate.pdf` (local, 1 page, bilingual AR/EN). Extracted verbatim 2026-11-06:

| Field | Value |
|---|---|
| Program | «مليون خيّر لأوامر الذكاء الاصطناعي» / **1 MILLION PROMPTERS** (both printed on the certificate) |
| Issuer marks | Printed as logo wordmarks (no "issued by" sentence): **Dubai Future Foundation** (مؤسسة دبي للمستقبل) and **Dubai Centre for Artificial Intelligence**. Site wording must be "logo credits", not a legal issuer sentence. |
| Recipient | **Ahmed Aboalyoun** (Latin script, as printed) |
| Date | **TO VERIFY** — no date printed anywhere on the page |
| Credential ID | **TO VERIFY** — none printed |
| Verification URL | **TO VERIFY** — a QR code is printed (bottom-left) but no URL text; QR target not resolved |
| Reference link used in docs | `https://dub.ai/omp` (from Ahmed; not printed on the PDF — treat as external reference, cite as "program page") |
| Qualification wording | Arabic completion text present; two segments possibly OCR-imperfect («تتمكين», «وبالتالي مع المنظمة الشامل») — spot-check against the PDF before quoting verbatim on the site |
| Visual | "شهادة إتمام" (Certificate of Completion) header; blue radial motif; DFF oval logo, DCAI wordmark, circular seal; QR bottom-left; no signature block, no date, no ID |

**Publication rule for the certificate:** show program name + recipient + issuer logo credits; date/ID/verify-URL stay `TO VERIFY` until Ahmed supplies them (or QR is resolved). Do not state an issue date on the site until verified.

## Re-verification policy

- OSS statuses re-checked at seed time (M1) and before launch (M6).
- Any content change touching a claim must add/refresh its row here first.
