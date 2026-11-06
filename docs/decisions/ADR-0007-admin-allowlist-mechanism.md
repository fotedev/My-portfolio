# ADR-0007 — Single-admin authorization: `admin_users` allowlist table

**Status:** Accepted
**Date:** 2026-11-06
**Deciders:** Ahmed Aboalayoun, engineering agent

## Context

The site has exactly one admin (Ahmed — locked decision, ADR-0005). RLS policies need a server-side way to distinguish "the admin" from any other authenticated user. Two mechanisms were considered:

1. **Hard-coded `auth.uid()` constant** embedded in every policy (e.g. `auth.uid() = '1111…'`).
2. **`admin_users (user_id uuid primary key)` allowlist table** with a `public.is_admin()` security-definer helper.

Hard-coding the UUID spreads an immutable identity into a dozen policy definitions: rotating or adding an admin means rewriting migration SQL, and the UUID sits in plain text in an open-source repo (a minor information leak about the owner's account).

## Decision

Use the **`admin_users` allowlist table** with a `security definer` helper `public.is_admin()` (implemented in `supabase/migrations/0001_initial_schema.sql`):

- Policies express admin access as `using (public.is_admin())` — one mechanism, applied uniformly.
- `admin_users` itself has **no RLS policies** (reachable only through the definer function and the service role) and SQL-level revokes for `anon`/`authenticated` as defense in depth.
- Enrolling the single admin = one service-role/Dashboard insert of Ahmed's `auth.users` id (M1 Stage 4); MFA enrollment is documented in `docs/OPERATIONS.md`.

## Consequences

- Changing admin identity is a data operation (insert/delete a row), never a schema migration.
- No UUID is hard-coded in policy SQL; the open-source repo leaks nothing about the admin's identity.
- `is_admin()` is `stable` and `security definer` with a locked `search_path` — safe inside RLS predicates and cheap (single PK lookup).
- Risk accepted: an attacker who obtained the service-role key could insert themselves into `admin_users`. Mitigated by the standing rule that the service-role key is server-only (never in client code, never committed) and rotated per `docs/OPERATIONS.md`.
- If a second admin is ever needed, the model extends without policy changes — but multi-admin remains a locked non-goal (ADR-0005) and would require a new ADR.
