# ADR-0006 — Supabase region selection

**Status:** Proposed — confirmed at M1 Step 0 (region recorded here once the project is created)
**Date:** 2026-11-06
**Deciders:** Ahmed Aboalayoun, engineering agent

## Context

The portfolio backend is a **new** Supabase organization (`fotedev-portfolio`) and project — Masar X's production project and any prior project are explicitly out of scope (locked decision). The primary audience is Egypt + the Gulf (docs/PRODUCT.md §4), with international visitors as a secondary group. Supabase projects are pinned to a region at creation; moving later means a full migration.

## Decision

Create the project in **`me-central-1`** (Supabase's Middle East region, UAE) if the region selector offers it — lowest latency for the primary Egypt/Gulf audience. If `me-central-1` is unavailable on the Free plan at creation time, fall back to **`eu-central-1`** (Frankfurt) — the closest well-provisioned region with strong peering to Egypt.

All public pages are statically cached at the CDN (docs/ARCHITECTURE.md §5), so region latency affects only admin writes, revalidation, and the M4 contact submission — not visitor page loads.

## Consequences

- Egypt/Gulf users get the best achievable first-byte latency for dynamic interactions.
- If `me-central-1` is not offered, `eu-central-1` adds modest latency (~30–60 ms) for Gulf users on dynamic paths only; acceptable and documented here.
- Region choice is effectively permanent for the project's life; changing it later requires a data migration (accepted, given the static-first architecture).
- **Confirmation record (to be filled at Step 0):** region offered / selected: `TO CONFIRM`, project ref: `TO CONFIRM`.
