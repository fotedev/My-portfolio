# PRODUCT.md — Product & Positioning Spec (fotedev portfolio)

| | |
|---|---|
| **Status** | Draft v0.1 — for GATE 1 review |
| **Date** | 2026-11-06 |
| **Scope** | Positioning, audience, conversion model, services, page funnel, process framing, success metrics, and non-goals for `fotedev.me` |
| **Sources** | `prompt-0.md` §2 (locked decisions), `prompt-1.md` §5.2 (content requirements), `docs/CONTENT-EVIDENCE.md` (verified facts; all rows dated 2026-11-06) |
| **Language rule** | English document. Arabic appears only inside the bilingual copy drafts that explicitly require it (§3 offer, §6 services). |

Cross-references: visual and typographic rules → `DESIGN.md`; data structures → `docs/CONTENT-MODEL.md`; technical flows and quotas → `docs/ARCHITECTURE.md`; SEO/i18n mechanics → `docs/SEO-I18N.md`.

---

## 1. Purpose

This document defines **what the site sells and to whom** — not how it is built. The site is a sales asset, not a gallery (`prompt-0.md` §1). Every section exists to move a visitor toward one action: **sending a qualified inquiry**.

## 2. Positioning

**fotedev — Ahmed Aboalayoun — Full-Stack AI Engineer for client work.**

Ahmed designs, builds, and ships complete web applications and AI tools for businesses, working as one engineer responsible end to end: from the first conversation to a deployed, documented product in the client's hands. The differentiator is not a technology list — it is that a client gets a working system (spec, implementation, verification, deployment, handover) plus native-quality bilingual EN/AR delivery.

Positioning rules:

- **One engineer, honestly framed.** No "we", no agency language, no implied team. The builder is Ahmed plus an AI coding agent (`prompt-0.md` §1); the site says so where relevant (§7.4.2).
- **Lead with client outcomes** — working software around the client's business — never with a résumé or a stack list.
- **No invented claims.** Every factual credibility claim on the site must have a verified row in `docs/CONTENT-EVIDENCE.md`. Unverified claims cannot be published (`prompt-0.md` §3.7).

## 3. One-line offer — *initial copy, refined at GATE 2*

| Locale | Copy (verbatim draft) |
|---|---|
| EN (default) | **"Web applications and AI tools built around your business."** |
| AR (RTL) | **"تطبيقات ويب وأدوات ذكاء اصطناعي مبنية حول عملك."** |

- Used in the Hero as the line under the name/role; SEO meta descriptions derive from it (per `docs/SEO-I18N.md`).
- Both locales are **initial copy, refined at GATE 2**. Wording may change; meaning may not: the offer is (a) web applications, (b) AI tools, (c) built around the client's business — not a generic dev-for-hire line.

## 4. Audience

Markets (`prompt-1.md` §5.2): **Egypt + Gulf + international freelance clients.**

| Segment | Profile | What convinces them |
|---|---|---|
| Egypt | SMEs / founders; Arabic-first buyers | Native-quality Arabic site and delivery; working tools for real operations; direct access to the engineer |
| Gulf (KSA, UAE, …) | Businesses expecting polish and documentation | Written specs, deployment, handover; bilingual delivery |
| International | English-first freelance clients; async communication | Verified engineering credibility (OSS record, §7.5), clear process |

Shared profile: a business that needs **working software around its operations** — apps, dashboards, document tools, automations. Not a consumer app; not a design-only marketing site.

- **Anti-audience** (handled by reply, not by on-site copy): requests outside the three services, "idea-only" partnerships, unpaid work. The exactly-three service structure itself filters these.
- The site must **not** state a city or country of residence — no evidence row exists for one (§12). Market focus is a targeting statement, not a residency claim.

## 5. Conversion model

### 5.1 Primary conversion — inquiry

The primary goal is a visitor submitting the inquiry form **or** emailing directly.

- **Inquiry form** (Contact section): name, email, service interest, message, optional budget/timeline. Protected per the locked flow: Turnstile + honeypot, server-side site verification, persistent Postgres rate limiting. Success is shown from the stored-inquiry result, never from email-delivery success (`prompt-0.md` §2).
- **Direct email fallback always visible:** a copyable `fote.engineer@gmail.com` (v1 address; admin-editable from `/admin`). The form must never be the only path — if the form is down, email still works (incident framing in `prompt-1.md` §7 and `docs/OPERATIONS.md`).

### 5.2 Secondary conversion — explore work

The second goal is for visitors who are not ready to inquire to leave with evidence: a case study read, a verified PR link checked, the process understood. This path feeds later inquiries; it is not a tracked form conversion in v1.

### 5.3 Qualified inquiry (definition used by all metrics)

A submission that (a) passes validation and spam checks — honeypot hits and rate-limit rejects are excluded — and (b) carries a concrete project signal: a selected service interest or a message describing a real need, with a plausible email address. Exact scoring rules are finalized at GATE 2 (§11).

### 5.4 Deliberately absent channels

No WhatsApp, Calendly, or any booking/scheduling channel in v1 — none has a real account behind it (locked decision, `prompt-0.md` §2; rationale in `docs/decisions/ADR-0004-email-first-contact-no-booking.md`). A channel is added only when it exists, is monitored, and has a reason.

## 6. Services — exactly 3, deliverables-first

Rules for all service copy:

- **Deliverables-first:** every card leads with what the client receives — never with a skills or tech list. Technology names appear at most as supporting detail.
- Each card ships in EN and AR (bilingual site; AR is native-quality, not flipped English — locked decision).
- Adjacent requests (e.g., a plain company website) are answered in conversation; they do not get a fourth card in v1.
- All drafts below are **initial copy, refined at GATE 2**.

### 6.1 Web applications & dashboards

**EN draft:** "A production web application or dashboard — not a prototype: real data, user accounts with roles, and the views and reports your team uses daily. Deployed, documented, and handed over to you."

**AR draft:** "نظام ويب أو لوحة تحكم جاهز للعمل منذ اليوم الأول: بيانات حقيقية، حسابات مستخدمين بصلاحيات، شاشات وتقارير يستخدمها فريقك يوميًا — منشور وموثّق ومُسلَّم إليك."

Included deliverables (draft): a short written spec you approve; data model, auth, roles and permissions; the application or dashboard UI, bilingual-ready (EN/AR); production deployment with documentation and handover.

### 6.2 AI knowledge & document tools

**EN draft:** "A tool that turns your documents into answers: semantic search and Q&A over your own files — PDFs, contracts, knowledge bases — with source citations and access control, instead of manual digging."

**AR draft:** "أداة تحوّل مستنداتك إلى إجابات: بحث دلالي وأسئلة وأجوبة على ملفاتك الخاصة — ملفات PDF وعقود وقواعد معرفة — مع الاستشهاد بالمصادر وصلاحيات الوصول، بدل البحث اليدوي في الملفات."

Included deliverables (draft): a document ingestion pipeline for your formats; a semantic (vector) index over your content; a search/Q&A interface with citations; access control plus an evaluation pass on your real documents.

### 6.3 Workflow automation & integrations

**EN draft:** "Automations that connect the tools you already use: data sync between systems, notifications and alerts, scheduled jobs, and API integrations that remove repetitive manual work from your week."

**AR draft:** "أتمتة تربط الأدوات التي تستخدمها فعلًا: مزامنة البيانات بين الأنظمة، إشعارات وتنبيهات، مهام مجدولة، وتكاملات واجهات برمجية (API) تلغي العمل اليدوي المتكرر من أسبوعك."

Included deliverables (draft): a short workflow audit of what is manual today; the integration or automation, built and monitored; failure alerts and a runbook; documentation and handover.

## 7. Page funnel

Fixed order (`prompt-1.md` §5.2): **Hero → Selected Work → Services → How I work → Engineering credibility → About preview → Contact.** One scrollable Home page; each section has one job and one CTA direction.

### 7.1 Hero — *who and what, immediately*

- Content: name + role line ("Full-Stack AI Engineer" — draft), the one-line offer (§3), and an availability line sourced from the admin-editable `site_settings.availability_status`.
- CTA: primary "Start a project" → Contact; secondary "See the work" → Selected Work.
- Rules: no vanity stats, no badge wall, no autoplay or parallax-heavy motion (see `DESIGN.md`).

### 7.2 Selected Work — *evidence, not decoration*

- Content: 2–4 case studies (target 3–4) drawn from the evidence-backed lineup (§8) — **pending GATE 1 approval**. Each case study states problem → what was built → result, with only verification-backed content; links go only to verified repo/live URLs; status labels are honest.
- CTA: end-of-section pointer to Services ("What I can build for you").

### 7.3 Services — *what you can buy*

- Content: exactly the three cards from §6, deliverables-first, EN + AR.
- CTA per card: "Discuss this" → contact form with `service_interest` preselected.

### 7.4 How I work — *process as the differentiator*

Five steps, one plain sentence each (draft copy):

1. **Understand** — goals, users, constraints, and what "done" means, in your words, before any code.
2. **Specify** — a short written spec with acceptance criteria that you approve before implementation starts.
3. **Implement** — built in small reviewed increments; AI tools assist under my direction (disclosure below).
4. **Verify** — tests, accessibility and performance checks, and your review of a preview before anything ships.
5. **Deploy** — production deployment, documentation, and handover; you own what was built.

#### 7.4.1 AI-assisted development — process transparency, never a quality guarantee

**What the site states (draft copy):** "Parts of my work are produced with AI coding tools under my direction. Every line is reviewed and tested by me before it ships — I am responsible for the result."

**Why it is on the site:** this is process transparency — clients deserve to know how the work is produced. It is a disclosure, not a selling point, and it lives in this section only.

**Hard rules:**

- Never present AI assistance as a **quality guarantee** ("AI-verified", "bug-free by AI").
- Never as a **speed or price promise** ("AI makes it 10x faster/cheaper").
- Never as **autonomy** ("AI builds your app") — Ahmed directs, reviews, and owns every outcome.

| Allowed phrasing (draft) | Banned phrasing |
|---|---|
| "AI-assisted, human-reviewed" | "AI guarantees quality" |
| "I review and test everything I ship" | "Bug-free, AI-verified" |
| "My judgment, with better tooling" | "AI does the work while you watch" |

### 7.5 Engineering credibility — *verified OSS first, certificate as support*

This section states only what has a row in `docs/CONTENT-EVIDENCE.md`. Statuses are re-verified at M1 seed and again pre-launch in M6; any status change updates the evidence row first.

- **NousResearch/hermes-agent — merged contribution:** PR #114809 (merged to main 2026-09-18; commit `74f75fe` authored by `fotedev`; PR body credits "Salvages #109834 (@fotedev)"). The original #109834 was **closed as superseded** — any mention must use the superseded/salvaged phrasing, never "merged".
- **NousResearch/hermes-agent — open PRs:** #106626 and #122144. Published as **open**, never "merged".
- **MiniMax-AI/minimax-code — responsible disclosure:** issue #141; the vendor acknowledged both findings (2026-09-21). Published as **acknowledged**, never "fixed" or "resolved".
- **Certificate — supporting credential:** program **"1 MILLION PROMPTERS"** (printed bilingually on the certificate; exact wording per the evidence log's Certificate table); recipient shown exactly as printed on the PDF; issuer shown as **logo credits** (Dubai Future Foundation; Dubai Centre for Artificial Intelligence) — never as an "issued by" sentence; program-page reference `https://dub.ai/omp`. Issue date, credential ID, and a verification URL are **TO VERIFY** and must not appear on the site until Ahmed supplies them (the QR code is unresolved).
- **Framing:** the section leads with verified open-source engineering; the certificate is one supporting item inside the AI-practice story, not the headline.

### 7.6 About preview

- Content: 2–3 sentences (who Ahmed is, what he builds, how he works), a photo, and one link to the full About page (which carries the certificate detail per §7.5).
- Must not include: residency/location claims (no evidence row), availability promises beyond the admin-editable status, or a certificate issue date.

### 7.7 Contact — *the conversion endpoint*

- The inquiry form (§5.1) plus the direct copyable email always visible.
- Profile links limited to verified rows: GitHub, LinkedIn, X, Telegram, YouTube (Facebook/Instagram optional, footer only — per the evidence log).
- "What happens next" copy (draft): "You'll hear back from me directly." — **no** SLA or reply-time promise on the site until Ahmed commits to one (decision at GATE 2, §11).

## 8. Case-study lineup policy (GATE 1 dependency)

Verified state as of 2026-11-06 (`docs/CONTENT-EVIDENCE.md`):

| Candidate | Verdict | Handling |
|---|---|---|
| `fotedev/Masar-x-next` (Masar X) | **Strong — proposed case study #1** | Anchor case study: bilingual AR/EN AI study platform; pnpm monorepo (Next.js web + Electron desktop + Expo mobile) on one Supabase backend; semantic PDF search / vector indexing; live at `https://masarx.vercel.app`; active as of 2026-11-05. Awaiting Ahmed's GATE 1 approval. |
| `fotedev/ghost` | Strong with framing caveat | Publishable only if Ahmed accepts the caveat: framed strictly as privacy / dev-hygiene engineering; its own README/SECURITY.md warn it may violate vendor ToS — never framed as a "hacking" tool. |
| `fotedev/context` | Weak | Real but undocumented (no root README, no demo). Publishable only after a README pass; otherwise excluded from v1. |
| `fotedev/khalat` | **Blocked — not publicly available** | GitHub API returns 404; closest match `fotedev/ELKHLAT` is private. **It must not appear in positioning, copy, or case-study planning.** Options belong to Ahmed (make public / drop / describe without public source — the last weakens the evidence rule); default is drop. |
| Old `fotedev/My_portfolio` | Skip | Self-referential; not a case study. |
| Profile rows ("Interactive SaaS & UI Platform", "AI Pipelines & Agentic Tooling") | Not publishable | They link to the GitHub profile, not distinct repos — content leads only. |

Rules:

- The v1 lineup is **Masar X plus whichever candidates Ahmed approves at GATE 1**. No case study publishes without its evidence row and verification date.
- If fewer than two case studies are approved, Selected Work ships with Masar X plus an explicit "more work on request" line — no filler, no unverified projects.

## 9. Success metrics

All metrics are internal. None is published on the site as a claim.

| # | Metric | Definition | Source |
|---|---|---|---|
| M1 | **Qualified inquiries / month** | Count of inquiries meeting §5.3, per calendar month. The primary business metric. | `inquiries` table (`status`, `created_at`) |
| M2 | **Reply rate** | Percentage of qualified inquiries that reached status `replied`, measured on the month they arrived, observed with a 30-day lag. | `inquiries.status` |
| M3 | **Time-to-first-response** | Median hours from `created_at` to the first transition to `replied`. | Admin inbox / inquiry timestamps |
| M4 | **Lighthouse ≥ 90 (mobile, lab)** | CI gate at M6 under documented lab conditions (per `docs/SEO-I18N.md`). Internal quality bar — never advertised as a public claim. | Lighthouse CI |
| M5 | **% inquiries from organic/direct** — backlog item | Deferred to backlog: requires a new `source_referrer` column plus a privacy review before it can ship; not part of the v1 metrics set. | Deferred to backlog |

- Source attribution deferred to backlog (needs column + consent decision).
- **Targets:** none are invented in this document. Ahmed sets numeric targets at GATE 2 once a baseline exists (first 4–8 weeks of live data).
- **Vanity rule:** **zero** GitHub-README-style widgets on the site — no star counts, streaks, contribution graphs, or badge walls (`prompt-0.md` §1, `prompt-1.md` §5.2). GitHub presence = verified contribution links (§7.5) only.

## 10. Explicit non-goals

| Non-goal | Rationale |
|---|---|
| No store / e-commerce | Locked scope guard (`prompt-0.md` §3.8) |
| No client login / client area / CRM | Same; single admin (Ahmed) only |
| No blog UI | `posts` tables may exist in schema; no UI in v1 |
| No booking (Calendly / WhatsApp / scheduling) | No real account or reason exists yet (§5.4, ADR-0004) |
| No testimonials | Until genuine ones exist — and then only with consent and a verifiable source |
| No vanity GitHub widgets | §9 vanity rule |
| No agency/team language ("we", "our team") | One engineer plus an AI-assisted process, honestly framed (§2, §7.4.1) |
| No invented claims or numbers | `prompt-0.md` §3.7 — nothing publishes without an evidence row |
| No residency/location claims | No evidence row exists (§12) |
| No published rates in v1 | No pricing decision is locked; commercials are set per project in conversation (assumption — confirm at GATE 1) |

## 11. Copy status & refinement checkpoints

- All bilingual copy in this document (§3 offer, §6 services) is **initial draft copy, refined at GATE 2** — the same status the one-line offer carries in `prompt-1.md` §5.2.
- Decisions batched for GATE 2 (none block GATE 1): qualified-inquiry scoring rules (§5.3); numeric metric targets (§9); reply-time expectation copy (§7.7); final wording of offer and services after Ahmed's review.
- Any copy that states a fact must keep its `CONTENT-EVIDENCE.md` row valid (re-verification policy: M1 seed + pre-launch M6).

## 12. Evidence traceability

Factual claims used in this document, mapped to rows in `docs/CONTENT-EVIDENCE.md`:

| Claim in this doc | Evidence row |
|---|---|
| Public contact email `fote.engineer@gmail.com` | "Verified profile links" |
| GitHub `github.com/fotedev`; LinkedIn / X / Telegram / YouTube links; Facebook/Instagram footer-optional | "Verified profile links" |
| Masar X facts (repo, live URL `masarx.vercel.app`, monorepo + Supabase backend, bilingual AR/EN AI study platform, semantic PDF search, activity 2026-11-05) | "Case-study candidates" |
| ghost framing caveat; `context` weakness; old `My_portfolio` skip; profile rows not publishable | "Case-study candidates" |
| `khalat` 404 / `ELKHLAT` private | "Case-study candidates" |
| hermes-agent #109834 closed-as-superseded; salvage #114809 merged 2026-09-18 (commit `74f75fe`, credit line); #106626 and #122144 open | "Verified open-source & security contributions" |
| minimax-code #141 acknowledged (vendor comment 2026-09-21; closed `not_planned` 2026-10-19 — never "fixed") | "Verified open-source & security contributions" |
| Certificate: program name, recipient as printed, issuer logo credits (DFF, DCAI), no printed date/ID/verify-URL, `dub.ai/omp` as program page, QR unresolved | "Certificate" |

Spec-level decisions (services, funnel, metrics, non-goals, copy drafts) derive from `prompt-1.md` §5.2 and the `prompt-0.md` §2 locked decisions — they are positioning choices, not external facts, and need no evidence rows.

One cross-source nuance for the consistency reviewer: the certificate prints the recipient as **"Ahmed Aboalyoun"** (Latin script, verbatim per the evidence log) while the locked site identity is **"Ahmed Aboalayoun"** (`prompt-0.md` §2). The certificate must always be shown exactly as printed (evidence rule); the site identity spelling follows the locked decision.
