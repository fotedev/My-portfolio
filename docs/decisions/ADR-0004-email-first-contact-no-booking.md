# ADR-0004 — Contact: email-first (form → stored inquiry + copyable email fallback), no booking integrations in v1

**Status:** Accepted 2026-11-06
**Deciders:** Ahmed Aboalayoun (owner), spec-driven software factory (M0)
**Scope:** Locked decision (`prompt-0.md` §2) — do not re-litigate.

## Context

The site's primary objective is **qualified freelance inquiries**. The conversion path must work from day one, survive every component failing, and fit free-tier budgets. Constraints that shaped the choice:

- The professional email account exists for only ~1 month at project start — it **must not be a launch dependency**; `fote.engineer@gmail.com` is the initial public address, swappable from `/admin` later.
- No WhatsApp, Calendly, or booking integration exists behind the scenes yet — adding a widget that points at a non-existent account would be worse than omitting it.
- Spam/abuse is a certainty for any public form; free tiers cap function invocations, so the pipeline must be cheap and fail closed on writes.
- Inquiries are valuable: a form that only sends an email (and loses anything the mail filter drops) is weaker than one that persists the lead first.

## Decision

**Email-first contact, persisted inquiry, always-visible direct fallback:**

1. The contact form is the primary path: validated (Zod) → Turnstile + honeypot → Supabase Edge Function → server-side `siteverify` → persistent Postgres rate limit (3 per 10 min per network hash, 5 per email/day, 50 global/day) → **insert into `inquiries`** → notify Ahmed by email **separately and fail-tolerantly**.
2. **Success is reported from the storage result, never from email delivery.** If the notification email fails, the visitor still sees success (correctly — the inquiry is stored) and Ahmed sees the inquiry in `/admin/inquiries`.
3. **A copyable direct email (`mailto:` + one-click copy) is always visible** on the contact page and on every failure state (validation error, 429, Turnstile failure, function down). The page never hard-fails closed; if the entire pipeline is down, the visitor can still reach Ahmed by email.
4. Public contact address in v1: `fote.engineer@gmail.com`, stored in `site_settings` and editable from `/admin` — no code deploy needed when the professional email stabilizes.
5. **No WhatsApp, Calendly, or any booking/scheduling integration in v1** — none will be added until a real account and a real reason exist. Contact in v1 = form + email, nothing else.

## Consequences

**Positive**

- The funnel has no single point of failure: form breaks → email fallback; email breaks → inbox in `/admin`; analytics/captcha break → form still works.
- Leads are durable (DB) rather than mailbox-fragile, and auditable (status workflow, retention policy).
- Rate limiting + Turnstile + honeypot keep the pipeline inside free-tier invocation budgets; writes fail closed without taking the site down.
- Swapping the public address is an admin edit, not a release.

**Negative / accepted trade-offs**

- No scheduling convenience for visitors; serious clients must send an email first. Accepted until real usage shows demand.
- The form can still receive low-quality inquiries despite controls; the inbox workflow (read/replied/archived) absorbs this.
- Notification is best-effort by design — Ahmed must check `/admin/inquiries`, not rely on his inbox, which becomes a small operational habit (documented in `docs/OPERATIONS.md`).
- The email fallback depends on Ahmed answering from that address; response-time expectations are set in `docs/PRODUCT.md` metrics, not promised in UI copy.
