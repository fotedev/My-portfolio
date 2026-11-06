Understood. **From now on, all our discussion, planning documents, specifications, and agent instructions will be in English.** The portfolio itself will support **English and Arabic**.

Your README gives us a clearer direction: this should position you as a **Full-Stack AI Engineer available for client work**, not as a generic developer with a gallery of projects.

Below is the consolidated plan. It replaces the conflicting recommendations from the previous responses.

> **Verification status:** I have read the README you pasted. I have not inspected your repositories, certificate PDF, hosting accounts, or local files. The implementation agent should inspect those sources before publishing factual claims.

# 1. Fixed decisions

| Area | Decision |
|---|---|
| Brand | **fotedev** |
| Public identity | **Ahmed Aboalayoun**, with the Arabic name confirmed during content review |
| Brand meaning | Keep “Father Of The Eyes” private; no Easter egg needed |
| Primary objective | Generate qualified freelance inquiries |
| Domain | `fotedev.me` |
| Repository | **`fotedev/My-portfolio`** — exact requested spelling and hyphen |
| Existing profile repository | `fotedev/fotedev` remains separate and unchanged |
| Website languages | English and Arabic |
| Documentation | English only |
| Hosting preference | **Vercel** |
| Backend | New Supabase organization and project |
| Content management | Custom admin dashboard |
| Appearance | Light and dark themes, responsive layouts |
| Development method | Spec-driven Software Factory from the beginning |
| Expansion boundary | Portfolio content, services, case studies, and potentially articles—not a store or client platform |

The local certificate is currently identified as:

```text
C:\programming\github\My-Portfolio\ahmed-aboalyoun-certificate.pdf
```

The agent must preserve that file before replacing existing project contents. There is no reason to delete the GitHub repository or rewrite its history merely to rebuild the application.

# 2. Positioning: sell outcomes, support them with evidence

## Recommended headline

> **Web applications and AI tools built around your business.**

Supporting copy:

> I’m Ahmed, a Full-Stack AI Engineer. I build web applications, knowledge tools, and workflow automation—from initial requirements to deployment.

This is initial copy, not an immutable decision. The repository review should refine it around your strongest demonstrable work.

### Primary actions

- **Discuss your project** → contact form.
- **Explore selected work** → case studies.

Use one consistent primary action throughout the website. Do not introduce booking software, WhatsApp, or additional conversion paths until there is a real account and reason to use them.

## Initial service categories

| Service | Client-facing description |
|---|---|
| **Web applications & dashboards** | Business tools, responsive applications, and interfaces for managing content or operations |
| **AI knowledge & document tools** | Document search, retrieval-assisted applications, and AI features grounded in your content |
| **Workflow automation & integrations** | Connect existing tools and reduce repetitive manual work |

These are proposed offerings based on your README. Publish only the capabilities supported by the project review.

**AI-assisted development belongs in your process explanation—not as a promise of flawless code, enterprise quality, or guaranteed delivery speed.**

# 3. Public website structure

## Recommended launch routes

```text
/
  → /en

/en
/ar

/en/projects
/ar/projects

/en/projects/[slug]
/ar/projects/[slug]

/en/about
/ar/about

/en/contact
/ar/contact

/en/privacy
/ar/privacy

/admin
```

English is the recommended initial default, with a visible language switcher. Switching languages should preserve the equivalent page where available.

## Homepage order

1. **Hero**
   - Clear offer.
   - Brief introduction.
   - Primary and secondary actions.

2. **Selected work**
   - Target three strong case studies.
   - Publish fewer if only two have sufficient evidence.
   - Do not pad the portfolio with generic project categories.

3. **Services**
   - Three focused offers.
   - Describe deliverables and suitable problems, not just technologies.

4. **How I work**
   - Understand → specify → implement → verify → deploy.
   - Explain your factory process in language clients understand.

5. **Engineering credibility**
   - Verified open-source contributions.
   - Relevant technical evidence.
   - Certification as a supporting credential.

6. **About preview**
   - Brief personal introduction.
   - Link to the full about page.

7. **Contact**
   - Compact inquiry form.
   - Direct email alternative.

Do not carry over GitHub streaks, visitor counters, animated typing banners, or large badge collections. Those are profile decorations, not strong sales evidence.

# 4. Content assessment from your README

## Projects to investigate first

| Candidate | What the agent should establish |
|---|---|
| **Masar X** | Actual capabilities, current maturity, your role, usable screenshots, deployment status |
| **khalat** | User problem, implemented solution, operational evidence, current deployment status |
| **A distinct automation or AI project** | Concrete repository and demonstrable functionality—not a generic category |
| **This portfolio** | A later engineering case study once it is actually launched |

“Interactive SaaS & UI Platform” and “AI Pipelines & Agentic Tooling” currently link to your GitHub profile rather than distinct projects. They are **content leads**, not publication-ready case studies.

### Case-study template

Each case study should contain:

- Context and intended users.
- Problem and constraints.
- Your role.
- What you built.
- Important implementation decisions.
- Screenshots or a short demonstration.
- Results supported by evidence.
- Current status and relevant limitations.
- Live and source links where available.

Claims such as **“sub-second latency,” “production-ready,” and “scalable”** require specific evidence or more restrained wording. No invented client results or performance figures.

## Open-source contributions

Create a compact **“Open-source contributions”** section rather than presenting these as client projects.

For each contribution, record:

```text
Repository
Contribution title
Your contribution
Current status
Source link
Verification date
```

The agent should verify the linked PRs and issue before using labels such as “merged,” “credited contributor,” or “vendor acknowledged.” An open PR must remain visibly distinguished from an accepted contribution.

## Certificate

Use:

- **Program:** One Million Prompters.
- **Reference:** `https://dub.ai/omp`, subject to verification.
- **Certificate details:** Taken from the PDF itself.

Do not infer the issuing organization, completion date, or exact qualification wording from the filename alone.

Provide an accessible credential entry and an optional PDF link. It should support your portfolio—not substitute for project evidence.

## Contact information

We already have a usable address:

```text
fote.engineer@gmail.com
```

Use that initially instead of inventing a professional email address. Make the public contact address editable in the admin dashboard.

Prioritize **GitHub, LinkedIn, and email**. Other social accounts can remain optional footer links.

# 5. Technical architecture

## Recommended stack

- **Next.js App Router**
- **TypeScript**
- **Tailwind CSS**
- **next-intl** for locale routing and interface translations
- **Supabase Postgres, Auth, and Storage**
- **Vercel**
- **Playwright** for critical browser journeys
- A lightweight unit-testing setup for validation and application logic

Next.js is a good fit for your existing experience, Vercel preference, and integrated dashboard. **Astro is also capable of this architecture; a dashboard does not make it unsuitable.** We choose Next.js for fit, not because it is universally superior.

```text
Public website
    ↓ reads published content
Cached Next.js pages
    ↓
Supabase

Admin dashboard
    ↓ authenticated content operations
Draft / preview / publish
    ↓
Supabase + targeted cache revalidation

Contact form
    ↓
Supabase Edge Function
    ↓
Validation + Turnstile + persistent rate limiting
    ↓
Private inquiry storage
    ↓
Optional email notification
```

### Publishing behavior

- **Save draft:** Store changes without changing the public website.
- **Preview:** Show the unpublished version only to the administrator.
- **Publish:** Validate required content, update publication state, and invalidate affected caches.
- **Failure:** Report publication/revalidation problems clearly rather than displaying a false success.

We will define an acceptable publishing delay and test it. We will not promise instantaneous updates or a guaranteed Lighthouse score.

### Hosting correction

We will keep **Vercel** as requested. Before production launch, the agent must verify which current plan permits this intended use and its cost.

Also, Cloudflare supports dynamic applications through its runtime offerings; it is not simply “static only.” That correction does not change your hosting decision.

# 6. Admin dashboard and data model

## Launch dashboard

Include management of:

- Homepage copy and site settings.
- Projects and translated case studies.
- Services.
- About content and credentials.
- Selected open-source contributions.
- Images and downloadable files.
- Contact inquiries.
- Publication state and display order.

Avoid building an unrestricted drag-and-drop page builder. **Structured editing is easier to maintain and harder to break.**

## Suggested tables

```text
site_settings
site_setting_translations

projects
project_translations

services
service_translations

credentials
credential_translations

contributions
contribution_translations

media_assets
inquiries
```

Use shared records for language-independent fields and translation records for localized content. This keeps publication state, links, and ordering separate from translated text.

Additional implementation tables should exist only when required—for example, persistent rate-limit counters.

### Deliberately deferred

- Blog tables and editor.
- Booking integrations.
- Testimonials without genuine testimonials.
- Client accounts.
- CRM integrations.
- Advanced analytics dashboards.
- Multiple administrator roles.

Document how a blog could fit later, but do not build an unused blogging system now.

# 7. Contact form: reliable within a free-tier budget

**Visitors will not need an account.**

Recommended fields:

- Name.
- Email.
- Service of interest.
- Project description.
- Optional budget range.
- Optional timeline.

## Submission requirements

1. Validate input on the receiving function.
2. Validate the Turnstile response server-side.
3. Apply persistent rate limits—not process-memory counters.
4. Reject oversized submissions and attachments.
5. Store an accepted inquiry.
6. Attempt the email notification separately.
7. Show success based on successful storage, not email delivery.

Do not allow anonymous clients to insert directly into `inquiries`; that would bypass the submission controls.

An initial rate-limit policy can start around **three accepted submissions per ten minutes per network identifier**, with additional per-email and global limits. Treat these as configurable starting values, not universal best practices.

The agent must check current Supabase quotas and document:

- Expected traffic.
- Invocation and storage budgets.
- Data retention.
- Global submission limits.
- Behavior when quotas or limits are reached.

Application-level limits reduce database writes and notification costs, but **cannot guarantee that abusive traffic will consume zero function invocations**. The direct email link remains the fallback.

Choose the notification provider after checking current pricing and sender requirements. Supabase Edge Functions alone do not deliver email.

# 8. Design and quality standards

## Visual direction

**Calm, technical, and credible—not a neon terminal demo.**

Recommended foundation:

- Neutral surfaces with one blue/cyan accent.
- Clear typography and generous spacing.
- Real product screenshots.
- Consistent project presentation.
- System theme on first visit, with a persistent manual override.
- Restrained motion respecting `prefers-reduced-motion`.
- Proper Arabic layout, not merely right-aligned English components.

`DESIGN.md` should define tokens, typography, spacing, component states, RTL behavior, focus styles, and motion rules.

## Acceptance criteria

- No known launch-blocking defects.
- Critical journeys tested in both languages.
- Keyboard navigation and readable contrast.
- Usable mobile navigation and forms.
- Correct loading, empty, error, and success states.
- Localized metadata, canonical URLs, `hreflang`, sitemap, and social previews.
- Admin and unpublished previews excluded from indexing.
- Optimized media and limited public-page JavaScript.

Use **90+ mobile Lighthouse performance as an initial laboratory target under documented conditions**, not a promise of identical results on every device. Automated accessibility checks must be supplemented with manual checks.

For analytics, measure useful events—project views, contact starts, successful inquiries, and email clicks. Provider selection and consent requirements need review; “cookieless” does not automatically mean “no privacy obligations.”

# 9. License recommendation

“More secure” is not a precise license category.

If your goal is **open-source code with stronger reciprocal obligations than MIT**, my recommendation is:

- **AGPL-3.0-only for original application code.**
- A separate notice reserving rights to your branding, personal content, photographs, screenshots, and certificate, subject to third-party rights.

AGPL still permits commercial use. It does not prevent copying or guarantee attribution enforcement in every situation. If you want to prohibit commercial reuse, that requires a different, source-available approach—not conventional open source.

Record the intended protection before finalizing `LICENSE`; do not quietly choose a restrictive license on your behalf.

# 10. Execution plan for the agent

**Plan the complete release first; implement it through small, testable vertical slices.**

| Phase | Deliverable | Exit condition |
|---|---|---|
| **0 — Inspect and specify** | Repository inventory, evidence review, product scope, design direction, architecture, backlog | Major assumptions and unresolved decisions documented |
| **1 — Foundation** | Application shell, factory workflow, CI, locale/theme routing, Vercel preview | Repeatable build and verified preview deployment |
| **2 — Publishing slice** | One project managed in admin and displayed publicly in both languages | Draft → preview → publish works end to end |
| **3 — Portfolio content** | Homepage, services, about, selected projects, credentials | Approved factual content and responsive UI |
| **4 — Contact slice** | Form, limits, inquiry inbox, notification handling | Success and failure paths tested |
| **5 — Launch** | Domain, metadata, accessibility, performance, production checks | Deployed commit identified and live smoke tests pass |

A preview deployment should happen early—not after all development is complete.

## Planning documents

```text
AGENTS.md
DESIGN.md

docs/
  PRODUCT.md
  SCOPE.md
  ARCHITECTURE.md
  CONTENT-MODEL.md
  CONTENT-EVIDENCE.md
  SEO-I18N.md
  QUALITY.md
  OPERATIONS.md
  ROADMAP.md
  decisions/

.factory/
  README.md
  templates/
  runs/
```

All documentation must be in English.

The factory should distinguish **checks enforced by tooling** from **steps followed by convention**. Keep one active implementation issue initially, bounded review loops, and a run log recording verification results, deviations, and production evidence.

## Immediate instruction to the implementation agent

> Begin with Phase 0 only. Inspect the existing portfolio and profile repositories, preserve the certificate, and identify reusable assets. Verify candidate projects and contribution claims. Produce the English planning documents, decision records, and ordered issue backlog. Do not modify the profile repository, publish unverified claims, or begin full application implementation before the planning review.

**No further broad questionnaire is needed.** The remaining decisions are narrow: hosting budget, the intended license protection, and approval of the inspected content and visual direction. Everything else above provides a practical baseline for the agent to plan against.