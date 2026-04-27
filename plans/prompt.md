Implement `talent-hospitality` using GitHub Issues and the parent branch for this PRD.

## Repo Contract

- This repo follows `git-workflow`.
- Durable progress lives in GitHub issues, issue comments, and git commits. Do not create or maintain a local progress log.
- This repo does not use local implementation state files such as `plans/progress.txt`, `plans/prd.json`, or `plans/to-issues.json`.
- Use exactly one branch per parent PRD issue. Stay on the parent branch prepared for `#{{PARENT_ISSUE}}` for the whole session.
- Do not create a new branch per child issue unless that child issue's `PR flow` explicitly requires it.
- Work on exactly one ready child issue in a session.
- Leave the parent PRD issue open.

## Repo Facts

- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Package manager: `pnpm`.
- Main source directories:
  - `app/`
  - `components/`
  - `lib/`
  - `hooks/`
  - `public/`
- Canonical domain vocabulary lives in `UBIQUITOUS_LANGUAGE.md`. Use those terms in code, UI copy, comments, commit bodies, and issue comments when the domain is involved.

## 1. Orient

a. Read the parent issue `#{{PARENT_ISSUE}}` in full.
b. Read `UBIQUITOUS_LANGUAGE.md` if necessary.
c. Find open child issues with:
   `gh issue list --state open --limit 200 --search "#{{PARENT_ISSUE}} in:body" --json number,title,body`
d. Read the current branch:
   `git branch --show-current`
e. Read current git status:
   `git status --short`
f. Read the latest commits:
   `git log --oneline --decorate -n 12`
g. For each open child issue, extract:
   - `Blocked by`
   - `Skills`
   - `Files`
   - `Acceptance criteria`
   - `PR flow`
h. Ignore blocked issues. Respect dependency order from each issue body.

## 2. Pick the Next Issue

Pick exactly one ready child issue.

Priority:
- architectural
- integrations
- unknown complexity
- a11y or security
- api or data
- performance
- polish

Rules:
- Never pick the easiest ready issue. Pick the riskiest ready issue.
- Skip issues that are blocked by still-open dependencies.
- Skip issues that require human input if an AFK-ready issue exists.

## 3. Load Skills

For the chosen child issue, load every skill named in its `Skills` section.
Skip gracefully if a skill cannot be loaded, but continue with the rest.

## 4. Implement

a. Treat the branch shown in the runtime context as the authoritative parent branch for this PRD.
b. If you are not already on that branch, switch back to it before editing.
c. Read every file listed in the chosen issue's `Files` section before editing.
d. If the issue body references additional prerequisite files indirectly, read only the minimum extra files needed.
e. Follow the issue's `PR flow` guidance if present.
f. Keep the diff minimal and focused to that one child issue.
g. Match existing patterns and conventions in `app/`, `components/`, and `lib/`.
h. Use canonical THP domain terms from `UBIQUITOUS_LANGUAGE.md` when implementing product logic or copy.

## 5. Verify

Verification is code-review-first.

a. Re-read the changed files and check each acceptance criterion against the implementation directly.
b. Run:
   - `pnpm lint`
   - `pnpm typecheck`
c. Run `pnpm build` if the change affects app-wide routing, auth wiring, config, or other cross-cutting production behavior.
d. If verification fails, fix the issue before committing.
e. Do not claim success for anything not actually implemented.

## 6. Commit

Commit before closing the issue or printing final status.

Commit on the parent branch for `#{{PARENT_ISSUE}}`.

Use one commit for the chosen child issue with:

Subject:
`<issue-number>: <one-line summary>`

Body:
- `Parent: #{{PARENT_ISSUE}}`
- `Issue: #<child-issue-number> <child-issue-title>`
- `Why: <what vertical slice was completed>`
- `Files: <comma-separated changed files>`
- `Verify: <checks run or code-review basis>`
- `Notes: <follow-up or none>`

## 7. Close or Report

a. After the commit succeeds, comment on the child issue with:
   - what was implemented
   - the commit SHA
   - how it was verified
b. Close the child issue only after the comment is posted.
c. Leave the parent issue open.
d. If no open child issues remain after this session, print `<promise>COMPLETE</promise>`.
e. If you hit an unresolvable blocker, leave a comment on the blocked child issue explaining the blocker, then print `<promise>BLOCKED</promise>`.

## Output

- Print final status only after the commit action is confirmed.
- If work was completed but more child issues remain, print a concise summary only.
