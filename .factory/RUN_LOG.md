# Run Log — measured data only

Columns are fixed; add one row per milestone (or per significant rework). No narrative essays — evidence lives in PRs, issues, and `docs/CONTENT-EVIDENCE.md`.

| Issue | Milestone | Skills used | CI failures | Review rounds | Duration (est.) | Cost (est.) | Prod verification (URL / SHA / date) |
|---|---|---|---|---|---|---|---|
| — (backlog = output) | M0 — foundation, factory, specs | Evidence Auditor (none), Certificate Reader (none), Spec Authors ×6 (none), Spec Consistency Reviewer (none), Edge-Case Auditor (`edge-cases`), Patch Engineer (none) | n/a (CI starts M2) | 2 (consistency review + edge-case audit; 18 fixes applied) | ~1 session | ~2.3M subagent tokens | pushed to `main` 2026-11-06 — commits `90a7bae`, `baf1d3b`, `6c02153` on https://github.com/fotedev/My-portfolio |

## Deviations & notes (measured facts, not essays)

- **M1:** Subagent dispatch failed twice (`exceed quota limit`, `user concurrency limit exceeded`) → Quota Research + Schema Architect work executed **directly by main** (deviation from the subagent plan, logged per protocol). Skills: `supabase-postgres-best-practices` conventions applied during schema authoring.
- **M1:** Step 0 BLOCKED — primary `supabase` MCP token denied for project `eysuvsofdluvzhlxdzkv` (scoped to a different org). Remote work (migration apply, RLS proof, seed, cert upload) paused until Ahmed re-authenticates the MCP to the new org/project. Local artifacts (schema, seed, tests, quotas, ADR-0006/0007) completed and committed on `m1-supabase` meanwhile.

- **M0:** `organize-root` skill judged by name, **not opened** — workspace hygiene was 4 file moves + gitignore, performed directly by the orchestrator (see `docs/SKILLS-MAP.md`).
- **M0:** Review findings: 0 HIGH / 8 MED / 3 LOW consistency issues + 3 partial edge-case coverages + 3 extra edge cases — all 18 patched and spot-verified before the gate.
- **M0:** Evidence finding: `khalat` is **not** public (404; private `ELKHLAT` exists) — case-study lineup is an open GATE 1 item.
- **M0:** Certificate: date / credential ID / verify URL are **TO VERIFY** (not printed on the PDF).
