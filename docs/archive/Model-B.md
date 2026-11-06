Understood: English only, and I'll stay on planning. Below are the locked decisions, what your README changes, my defaults, and a few open questions.

## 1. Locked decisions

| Area | Decision |
|---|---|
| Goal | Freelance clients; revenue is the priority |
| Audience | Egypt, Gulf, and international clients |
| Repo | `My-Portfolio` (hyphen, as you specified), open source |
| Domain | `fotedev.me` (DNS stays at Namecheap, pointed to Vercel) |
| Brand | **fotedev** + Ahmed Aboalayoun / أحمد أبو العيون. The meaning of FOTE is never mentioned anywhere on the site. |
| Hosting | **Vercel** |
| Backend | Supabase (new org and project, accessed via MCP) |
| Languages | EN (default) + AR (full RTL). **All docs and specs are English only.** |
| Theme | Dark + light, following system preference, with a toggle |
| Admin | `/admin` dashboard for projects, services, credentials, settings, and the message inbox |
| Process | Factory from commit one: issue → spec → gates → PR → run log |
| Approach | Plan everything first, then implement one issue per slice |
| Out of scope | No store, no testimonials at launch. The blog schema exists but the UI is behind a feature flag. |

## 2. Where I'm changing my earlier recommendation

**Next.js (App Router) instead of Astro.** With Vercel, a Supabase-backed admin with auth, and your existing Next.js experience, one framework for both the public site and the admin is simpler. On-demand revalidation (ISR) replaces deploy hooks, so an admin edit goes live in seconds while visitors still get static-speed pages.

**Contact form.** Next.js route handler → Cloudflare Turnstile verification → rate limiting → insert into Supabase `messages`. The limits, since you're on the free tier:
- Per-IP limit (for example 3 per hour).
- A global daily cap.
- A honeypot field and payload size limits.

Notifications go to Telegram (instant, free, no domain mailbox needed), with an optional Resend email later. EmailJS is dropped, and your email is shown as a copy/`mailto` fallback.

**Supabase free-tier risk.** Free projects pause after about 7 days of inactivity. Mitigation: a scheduled GitHub Action keep-alive ping, and public pages served from cached static output so a paused DB never takes down the site.

**Vercel Hobby.** The Hobby plan is officially non-commercial. My plan is to stay on Hobby for now and revisit Pro ($20/month) when the first paid client arrives. Nothing in the architecture is Vercel-locked, so the choice is reversible.

**License.** Apache-2.0 for the code, which includes a patent grant and no trademark rights. Content, photos, certificate, and brand fall under a separate "all rights reserved" notice. Any open-source license allows code copying, so the real protection is that content and brand stay out of the license.

## 3. What your README tells us

- **Palette reuse.** The profile uses bg `#0A0E1A`, cyan `#22D3EE`, blue `#3B82F6`, and slate `#94A3B8`. `DESIGN.md` will build its tokens from these so the GitHub profile and site feel like one brand.
- **Positioning mismatch.** The README speaks to recruiters ("Full-Stack AI Engineer, RAG, MCP"). The site speaks to buyers: outcomes, delivery speed, quality. The services will be client-facing: web apps/SaaS, AI integrations (RAG chatbots, automation), dashboards, and AI-assisted rapid delivery.
- **Proof discipline.** Every claim on the site, such as "sub-second latency" or "15+ Framer Motion mechanics", must link to evidence in a repo or live demo. Anything unverifiable gets cut or softened, because an unsupported claim costs credibility with paying clients.
- **Project candidates.** Masar X, khalat, and the Software Factory itself (open source, with run-log evidence). The README's "Interactive SaaS" and "AI Pipelines" rows link only to your profile, so they need real repos or demos, or they get dropped. The agent proposes via GitHub MCP and you approve.
- **Open-source credibility.** A small "Open Source" section with only the verifiable items: hermes-agent #109834 (salvaged into main with authorship preserved) and the MiniMax disclosure. Open PRs are labeled "open".
- **Certificate.** One Million Prompters (dub.ai), stored in Supabase Storage and managed from admin. The local PDF is only the upload source, so it stays out of git. It's shown as a credential with a verification link.
- **Temporary contact.** `fote.engineer@gmail.com` goes into `site_settings` as a placeholder, editable from admin once Namecheap email is sorted. The README link to `My_portfolio` gets updated to `My-Portfolio` at launch.
- **Old repo.** The new name differs, so there's no conflict. I recommend archiving the old repo rather than deleting it: same effect, no loss, no broken links.

## 4. Factory carry-over from khalat

- Port the protocol, run log, enforced-vs-process table, and emergency log.
- **Definition of Done for anything touching production** includes verifying the deployed commit on Vercel plus a smoke test on the live URL. This is the gap khalat exposed.
- Add a "shadow mode first" rule for any new automation, and a cost column (tokens and time) in the run log.
- CI gates: lint, typecheck, test, build, and Lighthouse CI (mobile performance ≥ 90, with accessibility, SEO, and best practices as hard gates). Lighthouse is a free Google tool that scores speed, SEO, and accessibility out of 100.

## 5. Roadmap (about 4 weeks, one issue per slice)

0. **Foundation:** repo, factory, CI, ruleset, and docs: `PRODUCT`, `ARCHITECTURE`, `DESIGN`, `CONTENT-MODEL`, `SEO-I18N`, `DECISIONS` (ADR log).
1. **Supabase:** schema, RLS, storage, and migrations kept in the repo.
2. **Shell:** i18n, RTL, theme, layout, and design tokens.
3. **Public site:** hero, services, case studies, credentials, and contact.
4. **Admin:** auth, CRUD, settings, and inbox.
5. **Launch:** Vercel production, `fotedev.me` DNS, SEO (sitemap, hreflang, OG), Lighthouse, and a live smoke test on mobile and desktop.

## 6. Open questions (reply "ok" where my default is fine)

1. Is `C:\programming\github\My-Portfolio` a fresh folder (just the PDF) or an old clone with history? *Default: treat it as fresh.*
2. WhatsApp number to display, or skip WhatsApp? *Default: add the field in admin, hidden until filled.*
3. The dub.ai certificate verification URL and issue date.
4. Do you have profiles on Khamsat, Mostaql, or Upwork to link? *Default: none until provided.*
5. Is the new Supabase org and project created yet? *Default: the agent creates the project via MCP.*
6. Professional photo for About? *Default: yes, optional until you supply it. Tone: friendly and professional.*

Once you answer, I'll write the full English kickoff prompt for the agent (Phase 0 and Phase 1) with all of the above encoded.