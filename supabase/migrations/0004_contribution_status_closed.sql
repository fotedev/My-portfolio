-- 0004 (M6 closeout): add 'closed' to contribution_status.
--
-- hermes-agent PR #106626 closed unmerged on 2026-11-13 (close actor fotedev,
-- no merge commit — verified live via the GitHub API in the 2026-11-16
-- pre-launch re-verification, docs/CONTENT-EVIDENCE.md). The enum previously
-- had no 'closed' value, so the About page rendered the row as "Open PR" —
-- exactly the mislabeling the content-evidence rule forbids. Honesty mapping
-- (CONTENT-MODEL §6): 'closed' renders as a neutral pill, never dressed up as
-- merged, and the row summary states "closed unmerged — not merged".
ALTER TYPE public.contribution_status ADD VALUE IF NOT EXISTS 'closed';
