# Master Engineering Blueprint: `fotedev/My-portfolio` (`fotedev.me`)

All decisions are now locked in based on your exact requirements, your GitHub profile data, and industry best practices for a high-converting freelance engineering portfolio. From this point forward, all specifications, documentation, and agent instructions are in **English** so your coding agent can reason and execute with maximum precision.

---

## 1. Locked Decisions & Best-Practice Resolutions

| Domain | Locked Decision | Engineering Rationale |
| :--- | :--- | :--- |
| **Repository Name** | **`fotedev/My-portfolio`** *(exact hyphenated casing)* | Replaces/renames the old `My_portfolio` repo. `fotedev/fotedev` (`C:\programming\github\my-profile-repo`) remains untouched as your GitHub profile README repo. |
| **Brand & Identity** | **Ahmed Aboalayoun** (`fotedev` / **FOTE**) | Clean, authoritative engineering brand. We will **omit** the literal phrase *"Father Of The Eyes"* from client-facing pages to maintain strict B2B/freelance professionalism. |
| **Primary Goal** | **Client Acquisition & Freelance Revenue** | Structured as a conversion funnel: High-impact Hero $\rightarrow$ Services $\rightarrow$ Proof (Case Studies + OSS Contributions) $\rightarrow$ Credentials (OMP Certificate) $\rightarrow$ Frictionless Contact. |
| **Tech Stack** | **Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion** | Matches your core stack, enables a full `/admin` dashboard with SSR/Server Actions, and uses **On-Demand ISR (`revalidatePath`)** so public pages run at static speed (`0` DB reads on cached hits) while updating instantly when you edit in Admin. |
| **Hosting & Domain** | **Vercel** + Custom Domain **`fotedev.me`** | Native Next.js support, global Edge CDN, built-in Web Analytics & Speed Insights. |
| **Backend & DB** | **Supabase** *(New Org + New Project via MCP)* | PostgreSQL + Row-Level Security (RLS) + Supabase Auth (for `/admin`) + Supabase Storage (for project media, CV, and your certificate PDF). |
| **Contact Pipeline & Free-Tier Protection** | **Supabase + Cloudflare Turnstile + DB Rate-Limiting + EmailJS** | Protects your Supabase Free Tier from spam/exhaustion using: (1) Turnstile CAPTCHA token validation, (2) Server-side IP/fingerprint cooldown, and (3) a Postgres RPC rate-limit guard (`max 3 messages / IP / hour` & `global cap / hour`). |
| **Localization (i18n)** | **UI: Bilingual (`en` default + `ar` RTL)**<br>**Docs & Code: 100% English** | English default maximizes global/Gulf tech SEO; full Arabic RTL switch converts regional clients. All repo docs (`docs/*.md`, `.factory/`) are strictly in English. |
| **Licensing** | **Dual License: AGPLv3 (Code) + All Rights Reserved (Brand/Content)** | Stronger than MIT: prevents anyone from cloning your repo and deploying a closed-source commercial copy without releasing source, while legally locking down your name, logo, certificate, and case studies. |

---

## 2. Extracted High-Value Content Strategy (From Your README & Local Files)

Your GitHub README contains **elite trust signals** that 95% of freelancers lack. We will elevate these directly onto the landing page:

1. **Core Value Proposition (Hero):**
   * **Headline (EN):** *Full-Stack AI Engineer — Building Scalable GenAI, RAG Systems & Production Web Apps.*
   * **Headline (AR):** *مهندس برمجيات وذكاء اصطناعي متكامل — بناء أنظمة GenAI وتطبيقات ويب جاهزة للإنتاج.*
   * **Status Badge:** Live dynamic badge controlled from Admin (`🟢 Available for Freelance & Consulting`).
2. **Featured Case Studies (Initial Seed Data — Discoverable via GitHub MCP):**
   * **Masar X (`fotedev/Masar-x-next`):** Multi-platform AI study & knowledge orchestration ecosystem (`Next.js`, `Supabase`, `pgvector`, `Electron`, `RAG`, sub-second streaming).
   * **Khalat:** Production application governed end-to-end by a deterministic AI Software Factory pipeline.
   * **Interactive SaaS & UI Platform:** High-performance platform with 15+ Framer Motion mechanics, real-time WebSockets, dual-theme engine, and RBAC admin panel.
   * **AI Pipelines & Agentic Tooling:** Production MCP integrations, automated LLM evaluations, and deterministic agent workflows.
3. **Open-Source & Security Credibility Section (Major Conversion Booster):**
   * **NousResearch / `hermes-agent`:** Credited Contributor (`#109834` cherry-picked into `main` via `#114809`, `#106626`, `#122144`).
   * **MiniMax-AI / `minimax-code`:** Acknowledged Responsible Security Disclosure (`#141` — credential storage & Windows NTFS permission hardening in `@mavis/local-runtime`).
4. **Verified Credentials:**
   * **One Million Prompters (OMP) Certificate** (`dub.ai/omp` — Dubai Future Foundation).
   * Source file: `C:\programming\github\My-Portfolio\ahmed-aboalyoun-certificate.pdf` $\rightarrow$ To be uploaded to Supabase Storage (`public-assets/certificates/omp-certificate.pdf`) with a verifiable preview modal and download button on the site.

---

## 3. Visual Identity & `DESIGN.md` Specification

Your GitHub README already uses a cohesive **TokyoNight / Cyber-Engineering** palette (`#0A0E1A` background, `#22D3EE` Cyan accent, `#3B82F6` Electric Blue, `#10B981` Emerald status). We will formalize this into `DESIGN.md` so your website and GitHub profile feel like one unified brand:

* **Dark Mode (Default):**
  * Background Primary: `#0A0E1A` (Deep Obsidian Navy)
  * Background Elevated / Cards: `#111827` with `1px solid rgba(34, 211, 238, 0.14)` subtle borders
  * Accent Primary: `#22D3EE` (Cyan 400) & `#3B82F6` (Blue 500)
  * Status / Success: `#10B981` (Emerald 500)
  * Text Primary: `#F8FAFC` | Text Muted: `#94A3B8`
* **Light Mode:**
  * Background Primary: `#F8FAFC` | Cards: `#FFFFFF` with `#E2E8F0` border
  * Accent Primary: `#0284C7` (Sky 600) & `#2563EB` (Blue 600)
  * Text Primary: `#0F172A` | Text Muted: `#475569`
* **Typography:**
  * English (`LTR`): `Geist Sans` / `Inter` (Headings & Body), `Fira Code` / `Geist Mono` (Code, badges, metrics).
  * Arabic (`RTL`): `IBM Plex Sans Arabic` (matches technical geometric proportions cleanly).

---

## 4. Supabase Architecture & Free-Tier Rate-Limiting Design

To ensure your **Supabase Free Tier** never hits bandwidth or row limits from bots or repeated page loads:

### A. Zero-Read Public Pages (Next.js Cache + On-Demand Revalidation)
* Public pages (`/en`, `/ar`, `/en/projects/[slug]`) are **statically cached at the Vercel Edge**.
* Visitors browsing your site consume **0 Supabase database queries**.
* When you update a project, email, or setting in `/admin`, the Next.js Server Action calls `revalidatePath('/', 'layout')`, refreshing the static cache globally in milliseconds.

### B. Database Schema (`supabase/migrations/0001_initial_schema.sql`)
1. `site_settings` (Single-row config):
   * `contact_email` (default: `fote.engineer@gmail.com`, swappable to your `@fotedev.me` address anytime in Admin), `availability_status`, `hero_title_en`, `hero_title_ar`, `hero_subtitle_en`, `hero_subtitle_ar`, `cv_url`, `social_links` (JSONB: LinkedIn, X, Telegram, GitHub, YouTube, Facebook, Instagram).
2. `projects`:
   * `id`, `slug`, `title_en`, `title_ar`, `summary_en`, `summary_ar`, `problem_en`, `problem_ar`, `solution_en`, `solution_ar`, `results_en`, `results_ar`, `tech_stack` (`text[]`), `repo_url`, `live_url`, `cover_image_url`, `gallery_urls` (`text[]`), `is_featured` (`boolean`), `sort_order` (`int`), `status` (`draft` | `published`).
3. `services`:
   * `id`, `title_en`, `title_ar`, `description_en`, `description_ar`, `deliverables_en` (`text[]`), `deliverables_ar` (`text[]`), `icon`, `sort_order`, `is_active`.
4. `contributions_and_certs`:
   * `id`, `category` (`oss_contribution` | `security_disclosure` | `certification`), `title_en`, `title_ar`, `issuer_or_repo`, `description_en`, `description_ar`, `proof_url`, `asset_pdf_url`, `issued_at`, `sort_order`.
5. `posts` (Blog-ready for future expansion):
   * `id`, `slug`, `title_en`, `title_ar`, `content_mdx_en`, `content_mdx_ar`, `published_at`, `status`.
6. `messages` (Protected Lead Inbox):
   * `id`, `sender_name`, `sender_email`, `project_type`, `budget_range`, `message_body`, `ip_hash`, `status` (`unread` | `read` | `replied` | `archived`), `created_at`.

### C. Multi-Layer Contact Rate Limiting (Free Tier Shield)
1. **Layer 1 (Client/Edge):** Honeypot hidden field + Cloudflare Turnstile verification in the Next.js Server Action.
2. **Layer 2 (Database Trigger / RPC Guard):** Before inserting into `messages`, a `BEFORE INSERT` Postgres trigger checks:
   * Maximum **3 submissions per `ip_hash` per 60 minutes**.
   * Maximum **50 total submissions per 24 hours** across the table.
   * If exceeded, Postgres aborts the transaction cleanly before writing storage rows.
3. **Layer 3 (Notification):** After successful DB insert, triggers EmailJS / Resend webhook to notify your inbox immediately.

---

## 5. Target Repository Structure (`fotedev/My-portfolio`)

```text
My-portfolio/
├── .factory/
│   ├── PROTOCOL.md              # Deterministic Software Factory rules, gates & shadow-mode policy
│   ├── RUN_LOG.md               # Cycle time, CI pass/fail, token/cost estimate, post-deploy verification
│   └── templates/
│       ├── ISSUE_SPEC.md
│       └── PR_CHECKLIST.md
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # Deterministic Gate: Lint + Typecheck + Unit/Integration Tests + Build
│   └── pull_request_template.md
├── docs/
│   ├── PRODUCT.md               # Positioning, conversion funnel, target personas, KPIs
│   ├── ARCHITECTURE.md          # Next.js ISR + Supabase RLS + Rate-Limiting architecture
│   ├── CONTENT-MODEL.md         # Schema definitions, bilingual fallback rules, asset specs
│   └── SEO-I18N.md              # Metadata, OpenGraph, JSON-LD Person/Service schema, hreflang (/en, /ar)
├── DESIGN.md                    # Complete visual system, tokens, typography, RTL/LTR layout rules
├── LICENSE                      # Dual License: GNU AGPLv3 (Code) + All Rights Reserved (Assets/Brand)
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── seed.sql                 # Initial seed from your README (Masar X, OSS PRs, OMP Cert, Socials)
└── src/
    ├── app/
    │   ├── [locale]/            # Public cached routes (/en, /ar, /en/projects/[slug])
    │   ├── admin/               # Protected Admin Dashboard (/admin/login, /admin/projects, /admin/messages, /admin/settings)
    │   └── api/                 # Revalidation & rate-limited contact endpoints
    ├── components/
    │   ├── public/              # Hero, ServicesGrid, CaseStudyCard, OssCredibility, CertModal, ContactForm
    │   ├── admin/               # ProjectEditor, InboxTable, SettingsForm, MediaUploader
    │   └── ui/                  # ThemeToggle, LocaleSwitcher, Buttons, Badges
    └── lib/
        ├── supabase/            # Server, Client, and Admin middleware clients
        ├── i18n/                # Dictionaries & RTL/LTR helpers
        └── validations/         # Zod schemas for forms & admin inputs
```

---

## 6. Phased Execution Backlog (Software Factory Milestones)

Every milestone will be executed as tracked GitHub Issues with deterministic CI gates:

* **Milestone 0 — Factory Foundation & Architecture Docs (`Issue #1`):**
  * Rename/initialize `fotedev/My-portfolio`.
  * Commit `.factory/`, `DESIGN.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT-MODEL.md`, `docs/SEO-I18N.md`, `LICENSE`, and `.github/workflows/ci.yml`.
* **Milestone 1 — Supabase Provisioning, Schema & Seed Data (`Issue #2`):**
  * Use Supabase MCP to initialize the new project, apply `0001_initial_schema.sql` (tables + RLS policies + rate-limit trigger + storage buckets).
  * Upload `C:\programming\github\My-Portfolio\ahmed-aboalyoun-certificate.pdf` to Supabase Storage and seed initial data from `C:\programming\github\my-profile-repo` and top GitHub repos.
* **Milestone 2 — Core Next.js App, i18n (`EN`/`AR` RTL), & Theme Engine (`Issue #3`):**
  * Scaffold Next.js App Router, Tailwind tokens from `DESIGN.md`, `en`/`ar` routing, Navbar, Footer, and live status badge.
* **Milestone 3 — High-Conversion Public Portfolio & Case Studies (`Issue #4`):**
  * Build Hero, Services section, Featured Case Studies + `/[locale]/projects/[slug]` detail pages, OSS & Security Disclosure showcase (`hermes-agent`, `minimax-code`), and interactive OMP Certificate viewer.
* **Milestone 4 — Rate-Limited Contact Funnel (`Issue #5`):**
  * Build the bilingual Contact Form with Zod validation, Honeypot/Turnstile, Supabase RPC rate-limited insertion, EmailJS notification hook, and one-click Copy Email / Telegram / LinkedIn CTAs.
* **Milestone 5 — Admin Dashboard & On-Demand ISR (`Issue #6`):**
  * Build `/admin` protected by Supabase Auth: CRUD for Projects, Services, Credentials, Site Settings (instant email/CV swap), and Lead Messages Inbox with automatic `revalidatePath`.
* **Milestone 6 — Vercel Production Deployment, `fotedev.me` DNS & Smoke Gate (`Issue #7`):**
  * Connect `fotedev/My-portfolio` to Vercel, configure `fotedev.me` DNS records, run Lighthouse CI checks (Performance/SEO/Accessibility $\ge 90$), and record production smoke proof in `.factory/RUN_LOG.md`.

---

## 7. Ready-to-Use Master Kickoff Prompt for Your Agent

Copy and paste the block below directly into your AI coding agent to begin **Milestone 0 & Milestone 1** immediately:

```markdown
# ROLE & OBJECTIVE
You are the Lead Engineering Agent operating under a strict deterministic Software Factory protocol.
We are building and deploying a brand-new, production-grade, bilingual (EN/AR) Full-Stack AI Engineer Portfolio & Admin CMS for **Ahmed Aboalayoun (`fotedev`)** at **`fotedev.me`**.

## 1. ENVIRONMENT & ASSETS AVAILABLE TO YOU
1. **Target GitHub Repository:** `fotedev/My-portfolio` (exact hyphenated name `My-portfolio`). If `fotedev/My_portfolio` exists with an underscore, rename it to `My-portfolio` or archive it and ensure `fotedev/My-portfolio` is the active clean repository.
2. **Local Reference Assets (Read-Only Sources):**
   - Profile README Repo: `C:\programming\github\my-profile-repo` (This is `fotedev/fotedev` — DO NOT overwrite or modify this repo; use it to extract SVG banners, project descriptions, OSS contribution links, and social URLs).
   - Prompt Engineering Certificate PDF: `C:\programming\github\My-Portfolio\ahmed-aboalyoun-certificate.pdf` ("One Million Prompters" — `dub.ai/omp`).
   - Make sure any local backup of the old `My-Portfolio` folder is preserved outside the active git working tree before resetting the repo.
3. **MCP Servers Enabled:**
   - **GitHub MCP:** Use to manage repo settings, inspect `fotedev` repositories (such as `Masar-x-next`, `khalat`, etc.) to draft rich technical Case Studies, and manage Issues/PRs.
   - **Supabase MCP:** Use to configure the new Supabase organization/project, apply SQL migrations, configure RLS policies, and create Storage buckets.

## 2. LOCKED ARCHITECTURAL DECISIONS
- **Framework:** Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Framer Motion.
- **Hosting:** Vercel (`fotedev.me`).
- **Database, Auth & Storage:** Supabase. Public routes MUST use Next.js static caching / ISR with On-Demand Revalidation (`revalidatePath` triggered from `/admin` Server Actions) so public visitor traffic consumes near-zero Supabase free-tier reads.
- **Contact Form Protection:** Saves to Supabase `messages` table via a Postgres rate-limited function/trigger (max 3 submissions per hashed IP per hour, max 50 global per day to protect the Supabase Free Tier) + Honeypot/Turnstile + EmailJS notification + direct copyable email fallback (`fote.engineer@gmail.com` initially, editable via `/admin` Settings).
- **Bilingual UI, English Docs:** Public UI supports `/en` (default, LTR) and `/ar` (full RTL). All repository documentation (`docs/*.md`, `DESIGN.md`, `.factory/*`) and code comments MUST be written 100% in English.
- **Branding Rule:** Use **Ahmed Aboalayoun** and **`fotedev`** / **FOTE**. Do NOT include the literal phrase "Father Of The Eyes" on public client-facing pages.
- **License:** Dual License in `LICENSE` — GNU AGPLv3 for source code, and explicit "All Rights Reserved" for all personal branding, text content, case studies, and certificate/media assets.

## 3. YOUR IMMEDIATE TASK: EXECUTE MILESTONE 0 (PHASE 0: PLANNING & FACTORY GOVERNANCE)
Do NOT write application UI code yet. First, establish the repository foundation and deterministic Software Factory governance:

1. Verify/prepare the `fotedev/My-portfolio` repository and inspect `C:\programming\github\my-profile-repo` + top repos via GitHub MCP to catalog the best 4 projects for Case Studies.
2. Create the Software Factory governance files:
   - `.factory/PROTOCOL.md` (Define enforced CI gates vs. process gates, 2-gate spec/PR workflow, shadow-mode rule for new automations, and emergency bypass log).
   - `.factory/RUN_LOG.md` (Include columns for Issue #, Stage, CI Failures, Review Rounds, Approx. Duration/Cost, and Production Verification Evidence).
   - `.factory/templates/ISSUE_SPEC.md` & `.github/pull_request_template.md`.
3. Create the complete English specification documents:
   - `DESIGN.md` (TokyoNight-inspired cyber-engineering aesthetic matching the GitHub profile: Deep Obsidian `#0A0E1A` dark mode default, `#22D3EE` Cyan & `#3B82F6` Electric Blue accents, clean high-contrast Light Mode, `Geist`/`Inter` + `IBM Plex Sans Arabic` + `Fira Code`).
   - `docs/PRODUCT.md` (Freelance conversion strategy, services offered, OSS credibility section featuring `NousResearch/hermes-agent` PRs & `MiniMax-AI/minimax-code` security disclosure `#141`, and the One Million Prompters certificate).
   - `docs/ARCHITECTURE.md` (Next.js App Router + On-Demand ISR + Supabase Auth/RLS + Free-Tier Rate-Limiting design).
   - `docs/CONTENT-MODEL.md` (Complete SQL schema for `site_settings`, `projects`, `services`, `contributions_and_certs`, `posts`, and `messages` with RLS policies).
   - `docs/SEO-I18N.md` (Bilingual routing `/en` and `/ar`, `hreflang`, OpenGraph, JSON-LD structured data, Lighthouse 90+ gates).
   - `LICENSE` (AGPLv3 for code + All Rights Reserved for branding/content/media).
4. Create the ordered GitHub Issues backlog (Milestones 1 through 6) using the `.factory/templates/ISSUE_SPEC.md` format.
5. Pause at **GATE 1** and present a concise summary of the generated specs, proposed 4 Case Studies, and Issue backlog for my approval before executing Milestone 1 (Supabase migration & Next.js scaffolding).
```