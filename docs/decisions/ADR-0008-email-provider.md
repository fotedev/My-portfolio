# ADR-0008: Email notification provider for new inquiries

| | |
|---|---|
| **Status** | Accepted (2026-11-07, M4) |
| **Context** | prompt-5 §4.4: notify the owner after a successful inquiry insert. Notification is **separate, optional, and fail-tolerant** — a failed/absent notification never affects storage or the visitor's UI. |
| **Decision** | **Resend** (`https://api.resend.com/emails`, plain `fetch` — no SDK dependency) |
| **Degraded mode** | The Edge Function calls Resend **only when** `EMAIL_PROVIDER_API_KEY` **and** `EMAIL_FROM` function secrets are set. Until then (and if any send fails), the function logs and the inquiry simply stays `unread` in `/admin/inquiries`. |
| **Sender** | `EMAIL_FROM` = `onboarding@resend.dev` placeholder until the fotedev.me domain exists (M6 DNS wiring) and is verified in Resend; then a `@fotedev.me` sender. |
| **Why Resend over EmailJS** | EmailJS's free tier (~200/mo) is client-side oriented and awkward for a server-side, secret-bearing call; Resend's free tier (~3,000/mo, 100/day at decision time) fits the 50-inquiries/day global cap with headroom, has a 3-line REST API, and supports domain verification for a proper `@fotedev.me` sender at M6. |
| **Volume math** | Global inquiry cap 50/day (rate limiter) × ~1 notification each ≪ 100/day free-tier send limit. Notifications can never exhaust the provider quota on their own. |
| **Consequences** | Rotation of `EMAIL_PROVIDER_API_KEY` follows `docs/OPERATIONS.md` §7. Failure alerting = function logs only (checked in the monthly quota review, §5). Switching providers later = replace one `fetch` call inside `notifyViaResend`. |
| **Verification date** | Pricing/limits re-checked 2026-11-07 (resend.com/pricing); re-verify at M6 before enabling the real key. |
