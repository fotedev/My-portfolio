# PR Checklist

Copy into the PR description. A PR without evidence is not a reviewable PR.

## Linked work
- Closes `<#issue>` — milestone `M<N>`

## What changed (≤ 5 bullets)
- `<change>`

## Evidence
- [ ] CI green (lint / typecheck / test / build) — or, pre-CI milestones: raw command/SQL output pasted below
- [ ] Screenshots or recording for anything visual (both themes, both locales if user-facing)
- [ ] Deploy/preview URL (if applicable)
- [ ] New factual claims are backed by dated rows in `docs/CONTENT-EVIDENCE.md`

## Factory checklist
- [ ] Acceptance criteria from the issue are all met
- [ ] No invented claims; open PRs stay "open"; disclosures stay "acknowledged"
- [ ] No secrets; `.env.example` updated if new vars
- [ ] Scope matches the issue — no drive-by features
- [ ] Rollback path stated and tested (or trivially revert)

## Verification commands
```bash
<paste actual command output here>
```

## Rollback
`<how to revert>`
