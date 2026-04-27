Implement `talent-hospitality` using GitHub Issues and the parent branch for `#{{PARENT_ISSUE}}`.

## Contract
- Progress lives in GitHub issues, comments, and commits — no local log.
- One branch per PRD; stay on the parent branch for `#{{PARENT_ISSUE}}` all session.
- No new branch per child issue unless its `PR flow` requires one.
- One ready child issue per session; leave the parent issue open.
- Use `UBIQUITOUS_LANGUAGE.md` terms in code, UI, comments, commits, and issue comments.

## 1. Orient
a. `gh issue view {{PARENT_ISSUE}}` — read in full.
b. Skim `UBIQUITOUS_LANGUAGE.md` if needed.
c. `gh issue list --state open --limit 20 --search "#{{PARENT_ISSUE}} in:body" --json number,title,body`
d. `git branch --show-current && git status --short && git log --oneline --decorate -n 12`
e. From each open child extract: `Blocked by`, `Skills`, `Files`, `Acceptance criteria`, `PR flow`.
f. Skip blocked issues; respect dependency order.

## 2. Pick One Issue
Pick the **riskiest** ready issue (never the easiest).

Priority: architectural → integrations → unknown complexity → a11y/security → api/data → performance → polish

Skip: blocked issues; issues requiring human input when an AFK-ready alternative exists.

## 3. Load Skills
Load every skill in the issue's `Skills` section. Skip gracefully if unavailable.

## 4. Implement
- Confirm you are on the parent branch for `#{{PARENT_ISSUE}}`; switch if not.
- Read every file in `Files` plus minimum indirectly referenced extras before editing.
- Keep the diff focused to this one child issue.
- Apply `UBIQUITOUS_LANGUAGE.md` terms to all product logic and copy.

## 5. Verify
Re-read changed files and check each acceptance criterion directly against the implementation. Do not claim success for anything not implemented.

## 6. Commit
One commit on the parent branch, before closing:

```
<issue-number>: <one-line summary>

Parent: #{{PARENT_ISSUE}}
Issue: #<n> <title>
Why: <vertical slice completed>
Files: <comma-separated>
Verify: <code-review basis>
Notes: <follow-up or none>
```

## 7. Close & Report
a. Post a comment on the child issue, then close it. Leave the parent issue open.
b. No open child issues remain → print `<promise>COMPLETE</promise>`
c. Unresolvable blocker → comment on the blocked issue explaining it, then print `<promise>BLOCKED</promise>`
