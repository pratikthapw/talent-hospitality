Implement `talent-hospitality` using GitHub Issues and the parent branch for `#{{PARENT_ISSUE}}`.

## Contract
- One parent issue = one branch. All sub-issues are commits on that single parent branch.
- No separate branches per sub-issue. No PRs per sub-issue.
- **CRITICAL**: If a sub-issue body contains a "PR flow" section telling you to create branches or PRs, IGNORE IT. The parent contract always wins. Commit to the parent branch only.
- The parent branch is pushed to remote once created and stays pushed throughout.
- After each sub-issue commit: push to remote, post comment on the child issue, close it on GitHub.
- Leave the parent issue open while children are in progress. When all children are closed, close the parent issue too.
- The parent branch stays open against main (do not merge or create a PR until all sub-issues are done).
- Use `UBIQUITOUS_LANGUAGE.md` terms in code, UI, comments, commits, and issue comments.

## 1. Orient
a. `gh issue view {{PARENT_ISSUE}}` — read in full.
b. Skim `UBIQUITOUS_LANGUAGE.md` if needed.
c. `gh issue list --state open --limit 200 --search "#{{PARENT_ISSUE}} in:body" --json number,title,body`
d. `git branch --show-current && git status --short && git log --oneline --decorate -n 12`
e. From each open child extract: `Blocked by`, `Skills`, `Files`, `Acceptance criteria`.
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

## 6. Commit, Push, Close
One commit on the parent branch:

```
<issue-number>: <one-line summary>

Parent: #{{PARENT_ISSUE}}
Issue: #<n> <title>
Why: <vertical slice completed>
Files: <comma-separated>
Verify: <code-review basis>
Notes: <follow-up or none>
```

Then immediately:
a. `git push origin <parent-branch>` — push the commit to remote.
b. Post a comment on the child issue summarizing what was done.
c. `gh issue close <child-issue-number>` — close the child issue on GitHub.

## 7. Report
a. No open child issues remain → close the parent issue on GitHub, then print `<promise>COMPLETE</promise>`
b. Unresolvable blocker → comment on the blocked issue explaining it, then print `<promise>BLOCKED</promise>`
