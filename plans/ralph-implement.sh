#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"

if [ "${1:-}" = "" ] || [ "${2:-}" = "" ]; then
  echo "Usage: $0 <iterations> <parent-issue-number> [--main=MODEL] [--researcher=MODEL] [--operator=MODEL] [--worker=MODEL] [--designer=MODEL] [--fixer=MODEL]"
  echo ""
  echo "Examples:"
  echo "  $0 10 42"
  echo "  $0 10 42 --main=openai/gpt-5.1"
  echo "  $0 10 42 --researcher=google/gemini-2.5-flash --designer=google/gemini-2.5-pro"
  echo "  $0 5 42 --fixer=google/gemini-2.5-flash"
  echo ""
  echo "Arguments:"
  echo "  <iterations>            Number of implement-loop iterations to run"
  echo "  <parent-issue-number>   GitHub issue number of the parent PRD issue (e.g. 42)"
  echo ""
  echo "Flags:"
  echo "  --main=MODEL        Model for implement agent        (default: inherits from /models)"
  echo "  --researcher=MODEL  Model for implement-researcher   (default: google/antigravity-gemini-3-flash)"
  echo "  --operator=MODEL    Model for implement-operator     (default: inherits from main)"
  echo "  --worker=MODEL      Model for implement-worker       (default: inherits from main)"
  echo "  --designer=MODEL    Model for implement-designer     (default: google/antigravity-gemini-3.1-pro)"
  echo "  --fixer=MODEL       Model for implement-fixer        (default: google/antigravity-gemini-3-flash)"
  echo ""
  echo "Requires: gh CLI authenticated and run from inside a GitHub repo."
  exit 1
fi

ITERATIONS="$1"
PARENT_ISSUE="$2"
shift 2

RESEARCHER_MODEL="google/antigravity-gemini-3-flash"
DESIGNER_MODEL="google/antigravity-gemini-3.1-pro"
FIXER_MODEL="google/antigravity-gemini-3-flash"
MAIN_MODEL=""
OPERATOR_MODEL=""
WORKER_MODEL=""

for arg in "$@"; do
  case "$arg" in
    --main=*)       MAIN_MODEL="${arg#--main=}" ;;
    --researcher=*) RESEARCHER_MODEL="${arg#--researcher=}" ;;
    --operator=*)   OPERATOR_MODEL="${arg#--operator=}" ;;
    --worker=*)     WORKER_MODEL="${arg#--worker=}" ;;
    --designer=*)   DESIGNER_MODEL="${arg#--designer=}" ;;
    --fixer=*)      FIXER_MODEL="${arg#--fixer=}" ;;
  esac
done

AGENT_OVERRIDES=""

if [ -n "$RESEARCHER_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement-researcher\":{\"model\":\"${RESEARCHER_MODEL}\"},"
fi

if [ -n "$OPERATOR_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement-operator\":{\"model\":\"${OPERATOR_MODEL}\"},"
fi

if [ -n "$WORKER_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement-worker\":{\"model\":\"${WORKER_MODEL}\"},"
fi

if [ -n "$DESIGNER_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement-designer\":{\"model\":\"${DESIGNER_MODEL}\"},"
fi

if [ -n "$FIXER_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement-fixer\":{\"model\":\"${FIXER_MODEL}\"},"
fi

if [ -n "$MAIN_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement\":{\"model\":\"${MAIN_MODEL}\"},"
fi

AGENT_OVERRIDES="${AGENT_OVERRIDES%?}"

export OPENCODE_DEFAULT_AGENT=implement
export OPENCODE_CONFIG_CONTENT="{\"agent\":{${AGENT_OVERRIDES}}}"

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Error: required command not found: $command_name"
    exit 1
  fi
}

require_file() {
  local file_path="$1"
  if [ ! -f "$file_path" ]; then
    echo "Error: required file not found: $file_path"
    exit 1
  fi
}

slugify_branch_part() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g' \
    | cut -c1-48
}

ensure_parent_branch() {
  local issue_number="$1"
  local issue_title="$2"
  local branch_slug target_branch current_branch

  branch_slug=$(slugify_branch_part "$issue_title")
  if [ -n "$branch_slug" ]; then
    target_branch="parent-${issue_number}-${branch_slug}"
  else
    target_branch="parent-${issue_number}"
  fi

  current_branch=$(git branch --show-current 2>/dev/null || echo "")
  if [ "$current_branch" = "$target_branch" ]; then
    echo "$target_branch"
    return 0
  fi

  if [ -n "$(git status --porcelain)" ]; then
    echo "Error: working tree is dirty on branch '${current_branch:-detached}'."
    echo "Commit or stash changes before switching to parent branch '$target_branch'."
    exit 1
  fi

  if git show-ref --verify --quiet "refs/heads/$target_branch"; then
    git checkout "$target_branch" >/dev/null
  elif git show-ref --verify --quiet "refs/remotes/origin/$target_branch"; then
    git checkout -b "$target_branch" --track "origin/$target_branch" >/dev/null
  else
    git checkout -b "$target_branch" >/dev/null
    git push -u origin "$target_branch" >/dev/null
    echo "Created and pushed new parent branch: $target_branch"
  fi

  echo "$target_branch"
}

require_command git
require_command gh
require_command node
require_command opencode
require_file "$PROMPT_FILE"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: must run inside a git worktree."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh CLI is not authenticated."
  exit 1
fi

PARENT_TITLE=$(gh issue view "$PARENT_ISSUE" --json title --jq '.title' 2>/dev/null || true)
if [ -z "$PARENT_TITLE" ]; then
  echo "Error: unable to read parent issue #$PARENT_ISSUE."
  exit 1
fi

RUN_ID="$(date '+%Y%m%d-%H%M%S')-parent-${PARENT_ISSUE}"
RUN_DIR="$SCRIPT_DIR/runs/$RUN_ID"
RUN_LOG="$RUN_DIR/ralph.log"
mkdir -p "$RUN_DIR"
exec > >(tee -ia "$RUN_LOG") 2>&1
trap 'wait' EXIT

PARENT_BRANCH=$(ensure_parent_branch "$PARENT_ISSUE" "$PARENT_TITLE")
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
RECENT_COMMITS=$(git log --oneline --decorate -n 12 2>/dev/null || true)

# Clean stale temp files from previous crashed runs
rm -f /tmp/ralph-issues.* /tmp/ralph-iter.*

BASE_PROMPT=$(cat "$PROMPT_FILE")
PROMPT_TEMPLATE=$(echo "$BASE_PROMPT" | sed "s/{{PARENT_ISSUE}}/${PARENT_ISSUE}/g")
PROMPT_BASE="${PROMPT_TEMPLATE}

- Parent PRD issue: #${PARENT_ISSUE} — ${PARENT_TITLE}
- Parent branch: ${PARENT_BRANCH}
- Current branch: ${CURRENT_BRANCH:-detached}
- Recent commits:
${RECENT_COMMITS}"

cleanup() {
  local exit_code=${1:-130}
  echo ""
  echo "=== Interrupted — cleaning up ==="
  if [ -n "${OC_PID:-}" ] && kill -0 "$OC_PID" 2>/dev/null; then
    echo "Killing backgrounded opencode (PID $OC_PID)..."
    kill "$OC_PID" 2>/dev/null && wait "$OC_PID" 2>/dev/null
  fi
  if [ -n "${TEMP_OUTPUT:-}" ] && [ -f "$TEMP_OUTPUT" 2>/dev/null ]; then
    echo "Output retained at: $TEMP_OUTPUT"
  fi
  echo "Stopped at: $(date)"
  echo "Run log: $RUN_LOG"
  echo ""
  echo "Note: Orphaned opencode sessions may still exist."
  echo "  Check:  opencode session list -n 10"
  echo "  Review: https://opncd.ai or opencode session list --format json"
  exit "$exit_code"
}
trap cleanup SIGINT SIGTERM

count_open_issues() {
  local parent="$1"
  local tmp
  tmp=$(mktemp -t ralph-issues 2>/dev/null) || tmp=""
  if [ -z "$tmp" ]; then
    echo "unknown"
    return
  fi
  gh issue list --state open --limit 200 --search "\"Parent\" \"#${parent}\" in:body" --json number \
    > "$tmp" 2>/dev/null || echo "[]" > "$tmp"
  local count
  count=$(node -e "
    const items = JSON.parse(require('fs').readFileSync('${tmp}', 'utf8') || '[]');
    console.log(items.length);
  " 2>/dev/null || echo "unknown")
  rm -f "$tmp"
  echo "$count"
}

select_next_issue() {
  local parent="$1"
  local tmp
  tmp=$(mktemp -t ralph-issues 2>/dev/null) || tmp=""
  if [ -z "$tmp" ]; then
    echo '{"error":"mktemp_failed"}'
    return
  fi

  if ! gh issue list --state open --limit 200 --search "\"Parent\" \"#${parent}\" in:body" --json number,title,body,updatedAt \
    > "$tmp" 2>/dev/null; then
    rm -f "$tmp"
    echo '{"error":"issue_list_failed"}'
    return
  fi

  node -e '
    const fs = require("fs");
    const items = JSON.parse(fs.readFileSync(process.argv[1], "utf8") || "[]");
    const none = /^(none|n\/a|na|no|not applicable|n\.a\.|-|)$/i;

    function blockedBy(body) {
      const text = String(body || "");
      const match = text.match(/^\s*(?:[-*]\s*)?(?:\*\*)?Blocked by\s*:?(?:\*\*)?\s*(.+)$/im);
      if (!match) return "";
      const value = match[1].replace(/\*/g, "").replace(/^:\s*/, "").trim();
      return value && !none.test(value) ? value : "";
    }

    function score(issue) {
      const text = `${issue.title || ""}\n${issue.body || ""}`.toLowerCase();
      const weights = [
        [100, /\b(architecture|architectural|schema|migration|entitlement|policy)\b/],
        [90, /\b(integration|payment|stripe|checkout|webhook|subscription|billing)\b/],
        [80, /\b(unknown|risk|complex|dependency|blocked)\b/],
        [70, /\b(security|a11y|accessibility|permission|auth|authorization)\b/],
        [60, /\b(api|data|database|db|query|ledger|wallet|credit)\b/],
        [40, /\b(performance|cache|latency|slow)\b/],
        [10, /\b(polish|copy|style|visual|ui)\b/],
      ];
      return weights.reduce((total, [weight, pattern]) => total + (pattern.test(text) ? weight : 0), 0);
    }

    const open = items.map((issue) => ({ ...issue, blockedBy: blockedBy(issue.body), score: score(issue) }));
    const ready = open.filter((issue) => !issue.blockedBy);
    if (open.length === 0) {
      console.log(JSON.stringify({ done: true, open: 0 }));
      process.exit(0);
    }
    if (ready.length === 0) {
      console.log(JSON.stringify({
        blocked: true,
        open: open.length,
        blockedIssues: open.map((issue) => ({
          number: issue.number,
          title: issue.title,
          blockedBy: issue.blockedBy,
        })),
      }));
      process.exit(0);
    }
    ready.sort((a, b) => b.score - a.score || a.number - b.number);
    console.log(JSON.stringify(ready[0]));
  ' "$tmp" 2>/dev/null || echo '{"error":"selection_failed"}'
  rm -f "$tmp"
}

json_field() {
  local file="$1"
  local field="$2"
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8') || '{}');
    const value = data[process.argv[2]];
    process.stdout.write(value == null ? '' : String(value));
  " "$file" "$field"
}

echo "Starting AFK Ralph (implement agent) — max $ITERATIONS iterations"
echo "Parent PRD issue: #${PARENT_ISSUE} — $PARENT_TITLE"
echo "Parent branch: $PARENT_BRANCH"
echo "Started at: $(date)"
echo "PID: $$"
echo "Prompt: $PROMPT_FILE"
echo "Run directory: $RUN_DIR"
echo "Run log: $RUN_LOG"
echo "Models:"
echo "  researcher: $RESEARCHER_MODEL"
if [ -n "$OPERATOR_MODEL" ]; then echo "  operator:   $OPERATOR_MODEL"; else echo "  operator:   (inherits from main)"; fi
echo "  designer:  $DESIGNER_MODEL"
echo "  fixer:     $FIXER_MODEL"
if [ -n "$MAIN_MODEL" ]; then echo "  main:      $MAIN_MODEL"; else echo "  main:      (inherits from /models)"; fi
if [ -n "$WORKER_MODEL" ]; then echo "  worker:    $WORKER_MODEL"; else echo "  worker:    (inherits from main)"; fi
echo "---"
echo "OPENCODE_CONFIG_CONTENT: $OPENCODE_CONFIG_CONTENT"
echo "---"

for ((i=1; i<=$ITERATIONS; i++)); do
  echo ""
  echo "=== Iteration $i of $ITERATIONS — $(date) ==="

  issues_remaining=$(count_open_issues "$PARENT_ISSUE")

  echo "Open sub-issues: $issues_remaining"

  if [ "$issues_remaining" = "0" ]; then
    echo ""
    echo "=== All issues complete after $((i - 1)) iterations ==="
    gh issue close "$PARENT_ISSUE" --comment "All sub-issues complete. Branch \`$PARENT_BRANCH\` is ready for review." 2>/dev/null || true
    echo "Finished at: $(date)"
    exit 0
  fi

  SELECTED_ISSUE_FILE="$RUN_DIR/iteration-${i}.issue.json"
  select_next_issue "$PARENT_ISSUE" > "$SELECTED_ISSUE_FILE"

  selection_error=$(json_field "$SELECTED_ISSUE_FILE" "error")
  if [ -n "$selection_error" ]; then
    echo "Error selecting next issue: $selection_error"
    echo "Selection payload: $SELECTED_ISSUE_FILE"
    exit 1
  fi

  selection_done=$(json_field "$SELECTED_ISSUE_FILE" "done")
  if [ "$selection_done" = "true" ]; then
    echo ""
    echo "=== All issues complete after $((i - 1)) iterations ==="
    gh issue close "$PARENT_ISSUE" --comment "All sub-issues complete. Branch \`$PARENT_BRANCH\` is ready for review." 2>/dev/null || true
    echo "Finished at: $(date)"
    exit 0
  fi

  selection_blocked=$(json_field "$SELECTED_ISSUE_FILE" "blocked")
  if [ "$selection_blocked" = "true" ]; then
    echo ""
    echo "=== Ralph is blocked — no ready child issues ==="
    echo "Selection payload: $SELECTED_ISSUE_FILE"
    echo "Stopped at: $(date)"
    exit 1
  fi

  selected_issue_number=$(json_field "$SELECTED_ISSUE_FILE" "number")
  selected_issue_title=$(json_field "$SELECTED_ISSUE_FILE" "title")
  selected_issue_body=$(json_field "$SELECTED_ISSUE_FILE" "body")

  if [ -z "$selected_issue_number" ]; then
    echo "Error: selected issue has no number."
    echo "Selection payload: $SELECTED_ISSUE_FILE"
    exit 1
  fi

  echo "Selected child issue: #${selected_issue_number} — ${selected_issue_title}"
  echo "Selected issue payload: $SELECTED_ISSUE_FILE"

  RECENT_COMMITS=$(git log --oneline --decorate -n 12 2>/dev/null || true)
  ITERATION_PROMPT=$(echo "$PROMPT_BASE" | sed "s/{{CHILD_ISSUE}}/${selected_issue_number}/g")
  ITERATION_PROMPT="${ITERATION_PROMPT}

- Current iteration: ${i} of ${ITERATIONS}
- Selected child issue: #${selected_issue_number} — ${selected_issue_title}
- Selected child issue body:
${selected_issue_body}
- Current recent commits:
${RECENT_COMMITS}"

  ITERATION_PROMPT_FILE="$RUN_DIR/iteration-${i}.prompt.md"
  printf '%s\n' "$ITERATION_PROMPT" > "$ITERATION_PROMPT_FILE"
  echo "Iteration prompt: $ITERATION_PROMPT_FILE"

  set +e
  TEMP_OUTPUT="$RUN_DIR/iteration-${i}.opencode.log"
  : > "$TEMP_OUTPUT"
  before_head=$(git rev-parse HEAD 2>/dev/null || echo "")
  opencode run --agent implement "$ITERATION_PROMPT" > "$TEMP_OUTPUT" 2>&1 &
  OC_PID=$!

  spinner_frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  spinner_idx=0
  start_ts=$(date +%s)
  last_line=""
  while kill -0 "$OC_PID" 2>/dev/null; do
    elapsed=$(( $(date +%s) - start_ts ))
    mins=$(( elapsed / 60 ))
    secs=$(( elapsed % 60 ))
    new_line=$(tail -n1 "$TEMP_OUTPUT" 2>/dev/null | tr -d '\r\n' | cut -c1-60)
    if [ -n "$new_line" ]; then last_line="$new_line"; fi
    frame="${spinner_frames[$spinner_idx]}"
    printf "\r\033[K  %s  Sub-agent working… %02d:%02d  %s" \
      "$frame" "$mins" "$secs" "$last_line"
    spinner_idx=$(( (spinner_idx + 1) % ${#spinner_frames[@]} ))
    sleep 0.1
  done
  wait "$OC_PID"
  exit_code=$?
  printf "\r\033[K"
  set -e

  result=$(cat "$TEMP_OUTPUT")
  after_head=$(git rev-parse HEAD 2>/dev/null || echo "")

  echo "--- stream end ---"
  echo "Exit code: $exit_code"
  echo "Iteration output: $TEMP_OUTPUT"

  if [ -n "$before_head" ] && [ -n "$after_head" ] && [ "$before_head" != "$after_head" ]; then
    commit_count=$(git rev-list --count "${before_head}..${after_head}" 2>/dev/null || echo "unknown")
    echo "Commits created this iteration: $commit_count"
    if [ "$commit_count" != "1" ]; then
      echo "Warning: expected exactly 1 commit for issue #${selected_issue_number}."
    fi
  else
    echo "Commits created this iteration: 0"
  fi

  subagent_models=$(printf '%s\n' "$result" | grep -oE '> [^ ]+ · [^ ]+' | sort -u || true)
  echo "Models seen in output:"
  if [ -n "$subagent_models" ]; then
    echo "$subagent_models"
  else
    echo "  (none detected — may need to check output)"
  fi
  echo "---"

  git push origin "$PARENT_BRANCH" 2>/dev/null || echo "Push: nothing new or already up to date"

  issues_remaining_after=$(count_open_issues "$PARENT_ISSUE")
  echo "Open sub-issues after iteration: $issues_remaining_after"

  if [ "$issues_remaining_after" = "0" ]; then
    echo ""
    echo "=== Issues complete after $i iterations ==="
    gh issue close "$PARENT_ISSUE" --comment "All sub-issues complete. Branch \`$PARENT_BRANCH\` is ready for review." 2>/dev/null || true
    echo "Finished at: $(date)"
    exit 0
  fi

  if [[ "$result" == *"<promise>BLOCKED</promise>"* ]]; then
    echo ""
    echo "=== Ralph is blocked — human intervention needed ==="
    echo "Check the GitHub issues for comments on what is blocking."
    echo "  gh issue list --state open --limit 200 --search \"#${PARENT_ISSUE} in:body\""
    echo "Stopped at: $(date)"
    exit 1
  fi

  if [ $exit_code -ne 0 ]; then
    echo "Warning: opencode exited with code $exit_code on iteration $i — continuing to next iteration..."
    continue
  fi

  if [[ "$result" == *"<promise>ISSUE_COMPLETE</promise>"* ]]; then
    echo "Issue #${selected_issue_number} complete; continuing to next iteration."
    continue
  fi

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "Completion token emitted, but open sub-issues remain; continuing."
    continue
  fi

  echo "Warning: no completion token found for issue #${selected_issue_number}; continuing so the open-issue list remains source of truth."

done

echo ""
echo "=== Reached max iterations ($ITERATIONS) without completing all issues ==="
echo "Check remaining open sub-issues:"
echo "  gh issue list --state open --limit 200 --search \"#${PARENT_ISSUE} in:body\""
echo "Stopped at: $(date)"
exit 0
