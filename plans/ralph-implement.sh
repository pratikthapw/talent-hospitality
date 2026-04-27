#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"

if [ "${1:-}" = "" ] || [ "${2:-}" = "" ]; then
  echo "Usage: $0 <iterations> <parent-issue-number> [--main=MODEL] [--explorer=MODEL] [--librarian=MODEL] [--worker=MODEL] [--designer=MODEL] [--fixer=MODEL]"
  echo ""
  echo "Examples:"
  echo "  $0 10 42"
  echo "  $0 10 42 --main=openai/gpt-5.1"
  echo "  $0 10 42 --explorer=google/gemini-2.5-flash --designer=google/gemini-2.5-pro"
  echo "  $0 5 42 --fixer=google/gemini-2.5-flash"
  echo ""
  echo "Arguments:"
  echo "  <iterations>            Number of implement-loop iterations to run"
  echo "  <parent-issue-number>   GitHub issue number of the parent PRD issue (e.g. 42)"
  echo ""
  echo "Flags:"
  echo "  --main=MODEL        Model for implement agent       (default: inherits from /models)"
  echo "  --explorer=MODEL    Model for implement-explorer    (default: google/antigravity-gemini-3-flash)"
  echo "  --librarian=MODEL   Model for implement-librarian   (default: google/antigravity-gemini-3-flash)"
  echo "  --worker=MODEL      Model for implement-worker      (default: inherits from main)"
  echo "  --designer=MODEL    Model for implement-designer    (default: google/antigravity-gemini-3.1-pro)"
  echo "  --fixer=MODEL       Model for implement-fixer       (default: google/antigravity-gemini-3-flash)"
  echo ""
  echo "Requires: gh CLI authenticated and run from inside a GitHub repo."
  echo "Logs written to: $LOG_DIR/"
  exit 1
fi

ITERATIONS="$1"
PARENT_ISSUE="$2"
shift 2

EXPLORER_MODEL="google/antigravity-gemini-3-flash"
LIBRARIAN_MODEL="google/antigravity-gemini-3-flash"
DESIGNER_MODEL="google/antigravity-gemini-3.1-pro"
FIXER_MODEL="google/antigravity-gemini-3-flash"
MAIN_MODEL=""
WORKER_MODEL=""

for arg in "$@"; do
  case "$arg" in
    --main=*)      MAIN_MODEL="${arg#--main=}" ;;
    --explorer=*)  EXPLORER_MODEL="${arg#--explorer=}" ;;
    --librarian=*) LIBRARIAN_MODEL="${arg#--librarian=}" ;;
    --worker=*)    WORKER_MODEL="${arg#--worker=}" ;;
    --designer=*)  DESIGNER_MODEL="${arg#--designer=}" ;;
    --fixer=*)     FIXER_MODEL="${arg#--fixer=}" ;;
  esac
done

AGENT_OVERRIDES=""

if [ -n "$EXPLORER_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement-explorer\":{\"model\":\"${EXPLORER_MODEL}\"},"
fi

if [ -n "$LIBRARIAN_MODEL" ]; then
  AGENT_OVERRIDES="${AGENT_OVERRIDES}\"implement-librarian\":{\"model\":\"${LIBRARIAN_MODEL}\"},"
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

PARENT_BRANCH=$(ensure_parent_branch "$PARENT_ISSUE" "$PARENT_TITLE")
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
RECENT_COMMITS=$(git log --oneline --decorate -n 12 2>/dev/null || true)

# Inject the parent issue number into the prompt at runtime.
# prompt.md provides the base instructions; this appends the concrete anchor.
BASE_PROMPT=$(cat "$PROMPT_FILE")
PROMPT=$(echo "$BASE_PROMPT" | sed "s/{{PARENT_ISSUE}}/${PARENT_ISSUE}/g")
PROMPT="${PROMPT}

- Parent PRD issue: #${PARENT_ISSUE} — ${PARENT_TITLE}
- Parent branch: ${PARENT_BRANCH}
- Current branch: ${CURRENT_BRANCH:-detached}
- Recent commits:
${RECENT_COMMITS}"

CURRENT_LOG=""

cleanup() {
  echo ""
  echo "=== Interrupted — cleaning up ==="
  if [ -n "$CURRENT_LOG" ]; then
    echo "Log saved: $CURRENT_LOG"
  fi
  echo "Stopped at: $(date)"
  echo ""
  echo "Note: Orphaned opencode sessions may still exist."
  echo "  Check:  opencode session list -n 10"
  echo "  Review: https://opncd.ai or opencode session list --format json"
  exit 130
}
trap cleanup SIGINT SIGTERM

count_open_issues() {
  local parent="$1"
  local tmp
  tmp=$(mktemp /tmp/ralph-issues-XXXXXX.json)
  gh issue list --state open --limit 200 --search "#${parent} in:body" --json number \
    > "$tmp" 2>/dev/null || echo "[]" > "$tmp"
  local count
  count=$(node -e "
    const items = JSON.parse(require('fs').readFileSync('${tmp}', 'utf8') || '[]');
    console.log(items.length);
  " 2>/dev/null || echo "unknown")
  rm -f "$tmp"
  echo "$count"
}

echo "Starting AFK Ralph (implement agent) — max $ITERATIONS iterations"
echo "Parent PRD issue: #${PARENT_ISSUE} — $PARENT_TITLE"
echo "Parent branch: $PARENT_BRANCH"
echo "Started at: $(date)"
echo "PID: $$"
echo "Logs: $LOG_DIR/"
echo "Prompt: $PROMPT_FILE"
echo "Models:"
echo "  explorer:  $EXPLORER_MODEL"
echo "  librarian: $LIBRARIAN_MODEL"
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
    echo "Finished at: $(date)"
    exit 0
  fi

  ITER_LOG="$LOG_DIR/iter-${i}-$(date +%Y%m%d-%H%M%S).log"
  CURRENT_LOG="$ITER_LOG"

  echo "Log: $ITER_LOG"

  # Run opencode in background, stream output to log file
  set +e
  opencode run --agent implement "$PROMPT" > "$ITER_LOG" 2>&1 &
  OC_PID=$!

  # Spinner while sub-agent is working
  spinner_frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  spinner_idx=0
  start_ts=$(date +%s)
  last_line=""
  current_model=""
  while kill -0 "$OC_PID" 2>/dev/null; do
    elapsed=$(( $(date +%s) - start_ts ))
    mins=$(( elapsed / 60 ))
    secs=$(( elapsed % 60 ))
    new_line=$(tail -n1 "$ITER_LOG" 2>/dev/null | tr -d '\r\n' | cut -c1-80)
    if [ -n "$new_line" ]; then last_line="$new_line"; fi
    latest_model=$(grep -oE '> [a-z]+-[a-z]+ · [^ ]+|> implement · [^ ]+' "$ITER_LOG" 2>/dev/null | tail -1 | tr -d '\r\n' || true)
    if [ -n "$latest_model" ]; then current_model="$latest_model"; fi
    frame="${spinner_frames[$spinner_idx]}"
    if [ -n "$current_model" ]; then
      printf "\r\033[K  %s  %s  %02d:%02d  %s" \
        "$frame" "$current_model" "$mins" "$secs" "$last_line"
    else
      printf "\r\033[K  %s  Sub-agent working… %02d:%02d  %s" \
        "$frame" "$mins" "$secs" "$last_line"
    fi
    spinner_idx=$(( (spinner_idx + 1) % ${#spinner_frames[@]} ))
    sleep 0.1
  done
  wait "$OC_PID"
  exit_code=$?
  printf "\r\033[K"   # clear spinner line
  set -e

  echo "--- stream end ---"
  echo "Exit code: $exit_code"
  echo "Full log: $ITER_LOG"

  result=$(cat "$ITER_LOG")

  if [ $exit_code -ne 0 ]; then
    echo "Warning: opencode exited with code $exit_code on iteration $i — continuing to next iteration..."
    continue
  fi

  subagent_models=$(echo "$result" | grep -oE '> [^ ]+ · [^ ]+' | sort -u)
  echo "Models seen in output:"
  if [ -n "$subagent_models" ]; then
    echo "$subagent_models"
  else
    echo "  (none detected — may need to check log)"
  fi
  echo "---"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "=== Issues complete after $i iterations ==="
    echo "Finished at: $(date)"
    exit 0
  fi

  if [[ "$result" == *"<promise>BLOCKED</promise>"* ]]; then
    echo ""
    echo "=== Ralph is blocked — human intervention needed ==="
    echo "Check the GitHub issues for comments on what is blocking."
    echo "  gh issue list --state open --limit 200 --search \"#${PARENT_ISSUE} in:body\""
    echo "Log: $ITER_LOG"
    echo "Stopped at: $(date)"
    exit 1
  fi

done

echo ""
echo "=== Reached max iterations ($ITERATIONS) without completing all issues ==="
echo "Check remaining open sub-issues:"
echo "  gh issue list --state open --limit 200 --search \"#${PARENT_ISSUE} in:body\""
echo "Stopped at: $(date)"
exit 0
