#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

ISSUE_NUMBER="${ISSUE_NUMBER:?ISSUE_NUMBER is required}"
ISSUE_TITLE="${ISSUE_TITLE:-Auto-dev request #$ISSUE_NUMBER}"
ISSUE_BODY="${ISSUE_BODY:-}"
ISSUE_URL="${ISSUE_URL:-https://github.com/${GITHUB_REPOSITORY:-fengwm64/AlgorithmVisualizations}/issues/$ISSUE_NUMBER}"
AUTO_PIPELINE="${AUTO_PIPELINE:-auto-dev}"

case "$AUTO_PIPELINE" in
  auto-dev|auto-fix)
    ;;
  *)
    echo "AUTO_PIPELINE must be auto-dev or auto-fix, got: ${AUTO_PIPELINE}" >&2
    exit 2
    ;;
esac

if [[ "$ISSUE_TITLE" == "Auto-dev request #$ISSUE_NUMBER" && "$AUTO_PIPELINE" == "auto-fix" ]]; then
  ISSUE_TITLE="Auto-fix request #$ISSUE_NUMBER"
fi

PIPELINE_TITLE="Auto Dev"
PIPELINE_COMMIT_PREFIX="Auto-dev"
PIPELINE_PR_PREFIX="Auto-dev"
PIPELINE_SUCCESS_MESSAGE="add visualization"

if [[ "$AUTO_PIPELINE" == "auto-fix" ]]; then
  PIPELINE_TITLE="Auto Fix"
  PIPELINE_COMMIT_PREFIX="Auto-fix"
  PIPELINE_PR_PREFIX="Auto-fix"
  PIPELINE_SUCCESS_MESSAGE="fix visualization"
fi

ISSUE_ARTIFACT_DIR=".auto-dev/issues/issue-${ISSUE_NUMBER}"
PRD_PATH="${ISSUE_ARTIFACT_DIR}/prd.md"
QA_REPORT_PATH="${ISSUE_ARTIFACT_DIR}/qa-report.md"
DECISION_PATH="${ISSUE_ARTIFACT_DIR}/decision.md"

export ISSUE_NUMBER ISSUE_TITLE ISSUE_BODY ISSUE_URL AUTO_PIPELINE ISSUE_ARTIFACT_DIR PRD_PATH QA_REPORT_PATH DECISION_PATH

if [[ -z "${ANTHROPIC_AUTH_TOKEN:-}" && -n "${ANTHROPIC_API_KEY:-}" ]]; then
  export ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_API_KEY"
fi

ANTHROPIC_BASE_URL="$(printf '%s' "${ANTHROPIC_BASE_URL:-}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL%/}"
ANTHROPIC_MODEL="$(printf '%s' "${ANTHROPIC_MODEL:-mimo-v2.5-pro}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL%\"}"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL#\"}"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL%\'}"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL#\'}"

case "$ANTHROPIC_MODEL" in
  MiMo-V2.5-Pro|MIMO-V2.5-PRO|XiaomiMiMo/MiMo-V2.5-Pro|mimo-v2.5-pro)
    ANTHROPIC_MODEL="mimo-v2.5-pro"
    ;;
  MiMo-V2.5|MIMO-V2.5|XiaomiMiMo/MiMo-V2.5|mimo-v2.5)
    ANTHROPIC_MODEL="mimo-v2.5"
    ;;
  MiMo-V2.5-Flash|MIMO-V2.5-FLASH|mimo-v2.5-flash)
    ANTHROPIC_MODEL="mimo-v2.5-flash"
    ;;
esac

export ANTHROPIC_BASE_URL
export ANTHROPIC_MODEL
export ANTHROPIC_DEFAULT_SONNET_MODEL="$ANTHROPIC_MODEL"
export ANTHROPIC_DEFAULT_OPUS_MODEL="$ANTHROPIC_MODEL"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="$ANTHROPIC_MODEL"
export ANTHROPIC_SMALL_FAST_MODEL="$ANTHROPIC_MODEL"
export CLAUDE_CODE_SUBAGENT_MODEL="$ANTHROPIC_MODEL"
export ANTHROPIC_CUSTOM_MODEL_OPTION="$ANTHROPIC_MODEL"
export ANTHROPIC_CUSTOM_MODEL_OPTION_NAME="MiMo ${ANTHROPIC_MODEL}"
export ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION="MiMo model routed through Anthropic-compatible gateway"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="${CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:-1}"

if [[ -z "${ANTHROPIC_BASE_URL:-}" || -z "${ANTHROPIC_AUTH_TOKEN:-}" ]]; then
  echo "ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY/ANTHROPIC_AUTH_TOKEN are required for Claude Code." >&2
  exit 2
fi

node --input-type=module <<'NODE'
const baseUrl = process.env.ANTHROPIC_BASE_URL || ''
let parsed = null

try {
  parsed = new URL(baseUrl)
} catch {
  parsed = null
}

console.log('::group::Claude Code environment diagnostics')
console.log(`ANTHROPIC_BASE_URL set: ${baseUrl ? 'yes' : 'no'}`)
console.log(`ANTHROPIC_BASE_URL protocol: ${parsed?.protocol || 'invalid'}`)
console.log(`ANTHROPIC_BASE_URL host: ${parsed?.host || 'invalid'}`)
console.log(`ANTHROPIC_BASE_URL path: ${parsed?.pathname || 'invalid'}`)
console.log(`ANTHROPIC_AUTH_TOKEN set: ${process.env.ANTHROPIC_AUTH_TOKEN ? 'yes' : 'no'}`)
console.log(`ANTHROPIC_API_KEY set: ${process.env.ANTHROPIC_API_KEY ? 'yes' : 'no'}`)
console.log(`ANTHROPIC_MODEL normalized: ${process.env.ANTHROPIC_MODEL || '(empty)'}`)
console.log(`ANTHROPIC_DEFAULT_SONNET_MODEL: ${process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || '(empty)'}`)
console.log(`ANTHROPIC_DEFAULT_OPUS_MODEL: ${process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || '(empty)'}`)
console.log(`ANTHROPIC_DEFAULT_HAIKU_MODEL: ${process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || '(empty)'}`)
console.log(`CLAUDE_CODE_SUBAGENT_MODEL: ${process.env.CLAUDE_CODE_SUBAGENT_MODEL || '(empty)'}`)
console.log('::endgroup::')
NODE

if command -v claude >/dev/null 2>&1; then
  claude --version || true
fi

run_algorithm_tests() {
  node --input-type=module <<'NODE'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function findAlgorithmModules(dir) {
  if (!fs.existsSync(dir)) return []

  const modules = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      modules.push(...findAlgorithmModules(fullPath))
    } else if (entry.isFile() && entry.name === 'algorithm.js') {
      modules.push(fullPath)
    }
  }

  return modules
}

const modules = findAlgorithmModules('src/animations')

if (modules.length === 0) {
  console.log('No standalone algorithm.js modules found; skipping algorithm self-tests.')
  process.exit(0)
}

for (const modulePath of modules) {
  const mod = await import(pathToFileURL(path.resolve(modulePath)).href)

  if (typeof mod.runAlgorithmTests === 'function') {
    console.log(`Running algorithm self-test: ${modulePath}`)
    await mod.runAlgorithmTests()
  } else {
    console.log(`Skipping ${modulePath}: runAlgorithmTests export not found.`)
  }
}
NODE
}

read_status_field() {
  local field="${1:?field is required}"

  STATUS_PATH=".auto-dev/status/issue-${ISSUE_NUMBER}.json" FIELD="$field" node --input-type=module <<'NODE'
import fs from 'node:fs'

const status = JSON.parse(fs.readFileSync(process.env.STATUS_PATH, 'utf8'))
const value = status[process.env.FIELD]
console.log(value == null ? '' : value)
NODE
}

extract_follow_up_field() {
  local field="${1:?field is required}"

  INCOMING_PATH="$INCOMING_PATH" FIELD="$field" node --input-type=module <<'NODE'
import fs from 'node:fs'

const body = fs.existsSync(process.env.INCOMING_PATH)
  ? fs.readFileSync(process.env.INCOMING_PATH, 'utf8')
  : ''

const patterns = {
  previousIssue: /- 原 Issue:\s*(?:#)?(\d+)/,
  previousPr: /- 原 PR:\s*(?:#)?(\d+)/,
}

console.log(body.match(patterns[process.env.FIELD])?.[1] || '')
NODE
}

resolve_previous_prs() {
  local previous_issue="${1:-}"
  local previous_pr="${2:-}"

  if [[ -n "$previous_pr" ]]; then
    printf '%s\n' "$previous_pr"
    return 0
  fi

  if [[ -z "$previous_issue" ]]; then
    return 0
  fi

  gh pr list \
    --state open \
    --search "#${previous_issue} in:body" \
    --json number \
    --jq '.[].number' 2>/dev/null || true
}

prepare_issue_artifacts() {
  mkdir -p "$ISSUE_ARTIFACT_DIR"

  if [[ ! -f "$PRD_PATH" && -f ".auto-dev/prd.md" ]]; then
    cp ".auto-dev/prd.md" "$PRD_PATH"
  fi

  if [[ ! -f "$QA_REPORT_PATH" && -f ".auto-dev/qa-report.md" ]]; then
    cp ".auto-dev/qa-report.md" "$QA_REPORT_PATH"
  fi

  if [[ ! -f "$DECISION_PATH" && -f ".auto-dev/decision.md" ]]; then
    cp ".auto-dev/decision.md" "$DECISION_PATH"
  fi
}

mark_superseded_follow_up() {
  local new_pr_url="${1:?new PR URL is required}"
  local previous_issue previous_pr previous_prs previous_pr_number new_pr_ref

  if [[ "$AUTO_PIPELINE" != "auto-fix" ]]; then
    return 0
  fi

  previous_issue="$(extract_follow_up_field previousIssue)"
  previous_pr="$(extract_follow_up_field previousPr)"

  if [[ -z "$previous_issue" && -z "$previous_pr" ]]; then
    return 0
  fi

  new_pr_ref="$(printf '%s' "$new_pr_url" | sed -n 's#.*/pull/\([0-9][0-9]*\).*#\1#p')"
  if [[ -n "$new_pr_ref" ]]; then
    new_pr_ref="#${new_pr_ref}"
  else
    new_pr_ref="$new_pr_url"
  fi

  if [[ -n "$previous_issue" ]]; then
    gh issue comment "$previous_issue" \
      --body "后续修复 PR 已创建：${new_pr_ref}。这个 Issue 的修复链路已由 #${ISSUE_NUMBER} / ${new_pr_ref} 接管，自动关闭以避免继续跟踪旧入口。" >/dev/null || true

    if [[ "$previous_issue" != "$ISSUE_NUMBER" ]]; then
      gh issue close "$previous_issue" \
        --comment "Superseded by #${ISSUE_NUMBER} / ${new_pr_ref}." >/dev/null || true
    fi
  fi

  previous_prs="$(resolve_previous_prs "$previous_issue" "$previous_pr")"

  if [[ -n "$previous_prs" ]]; then
    while IFS= read -r previous_pr_number; do
      [[ -z "$previous_pr_number" ]] && continue

      gh pr comment "$previous_pr_number" \
        --body "后续修复 PR 已创建：${new_pr_ref}。本 PR 已被 #${ISSUE_NUMBER} / ${new_pr_ref} 接管，自动关闭以避免误合并旧修复。" >/dev/null || true
      gh pr close "$previous_pr_number" --comment "Superseded by #${ISSUE_NUMBER} / ${new_pr_ref}." >/dev/null || true
    done <<< "$previous_prs"
  fi
}

run_agent_role() {
  local role="${1:?role is required}"
  local agent_file=".claude/agents/${role}.md"
  local stage owner role_prompt

  if [[ ! -f "$agent_file" ]]; then
    echo "Unknown agent role: ${role}" >&2
    return 1
  fi

  stage="$(read_status_field current_stage)"
  owner="$(read_status_field current_owner)"
  role_prompt="$(cat "$agent_file")"

  echo "::group::${PIPELINE_TITLE} agent: ${role}"
  echo "Starting role=${role}, current_stage=${stage}, current_owner=${owner}"

  claude -p \
    --model "$ANTHROPIC_MODEL" \
    --permission-mode bypassPermissions \
    --append-system-prompt "$SHARED_SYSTEM_PROMPT"$'\n\n'"$role_prompt" <<EOF_AGENT
你现在直接扮演 ${role} agent，处理 ${AUTO_PIPELINE} Issue #${ISSUE_NUMBER}。

当前文件：
- 原始需求: ${INCOMING_PATH}
- 状态文件: .auto-dev/status/issue-${ISSUE_NUMBER}.json
- Issue 产物目录: ${ISSUE_ARTIFACT_DIR}
- PRD: ${PRD_PATH}
- QA 报告: ${QA_REPORT_PATH}
- 拒绝决策: ${DECISION_PATH}

当前状态：
- current_stage: ${stage}
- current_owner: ${owner}

执行规则：
- 先读取 .claude/context/team-charter.md、.claude/context/auto-dev-context.md 和 ${agent_file}。
- 不要等待用户输入。
- 不要假装已经交给下一个 agent；必须真实写入交付物并调用 scripts/update-status.sh 更新 owner/stage。
- 不要再写 .auto-dev/prd.md、.auto-dev/qa-report.md 或 .auto-dev/decision.md；这些旧共享路径会造成多个 issue 的 PR 冲突。
- 本次调用不要使用 Task 工具拉起下一个 agent。GitHub Actions 中由 scripts/start.sh supervisor 根据 status 文件继续启动下一位。
- 如果你完成 handoff，只需更新 status、发飞书消息并退出。
- 如果你发现需要回退，更新 owner/stage 到对应角色并退出。
- 如果你是 QA，通过后只推进到 qa_passed，不要执行 git 或 gh；PR 由 start.sh finalizer 创建。
EOF_AGENT

  echo "::endgroup::"
}

run_agent_supervisor() {
  local max_steps=18
  local step stage owner

  for step in $(seq 1 "$max_steps"); do
    stage="$(read_status_field current_stage)"
    owner="$(read_status_field current_owner)"

    echo "${PIPELINE_TITLE} supervisor step ${step}: stage=${stage}, owner=${owner}"

    case "$stage" in
      pr_opened|rejected|aborted|qa_passed)
        return 0
        ;;
    esac

    case "$owner" in
      pm|algorithm|frontend|qa)
        run_agent_role "$owner"
        ;;
      *)
        echo "Unknown current_owner '${owner}' at stage '${stage}'." >&2
        return 1
        ;;
    esac
  done

  echo "${PIPELINE_TITLE} supervisor exceeded ${max_steps} steps." >&2
  return 1
}

open_pr_from_current_changes() {
  local branch="${AUTO_PIPELINE}/issue-${ISSUE_NUMBER}"
  local status_path=".auto-dev/status/issue-${ISSUE_NUMBER}.json"
  local stash_name="${AUTO_PIPELINE}-issue-${ISSUE_NUMBER}"
  local stashed="false"
  local stash_ref=""
  local patch_file=""
  local pr_url

  echo "::group::${PIPELINE_TITLE} finalization"
  echo "Finalizing issue #${ISSUE_NUMBER} from qa_passed state."

  npm run build || return 1
  run_algorithm_tests || return 1

  if ! command -v gh >/dev/null 2>&1; then
    echo "gh CLI is required to create the pull request." >&2
    return 1
  fi

  prepare_issue_artifacts
  patch_file="$(mktemp)" || return 1
  git add -A -- src "$status_path" "$ISSUE_ARTIFACT_DIR" || return 1

  if git diff --cached --quiet; then
    echo "No generated code changes found after qa_passed; aborting PR creation." >&2
    return 1
  fi

  git diff --cached --binary -- src "$status_path" "$ISSUE_ARTIFACT_DIR" > "$patch_file" || return 1

  if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    git stash push --include-untracked -m "$stash_name" || return 1
    stashed="true"
    stash_ref="stash@{0}"
  fi

  git fetch origin main || return 1
  git config user.name "github-actions[bot]" || return 1
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com" || return 1
  git checkout -B "$branch" origin/main || return 1

  if [[ "$stashed" == "true" ]]; then
    git apply --index "$patch_file" || return 1
    if [[ -n "$stash_ref" ]]; then
      git stash drop "$stash_ref" >/dev/null || true
    fi
  fi

  git add -A -- src "$status_path" "$ISSUE_ARTIFACT_DIR" || return 1

  if git diff --cached --quiet; then
    echo "No generated code changes found after qa_passed; aborting PR creation." >&2
    return 1
  fi

  git commit -m "${PIPELINE_COMMIT_PREFIX}: ${PIPELINE_SUCCESS_MESSAGE} for issue #${ISSUE_NUMBER}" || return 1
  git push --set-upstream origin "$branch" --force-with-lease || return 1

  if ! pr_url="$(gh pr view "$branch" --json url --jq '.url' 2>/dev/null)"; then
    pr_url="$(gh pr create \
      --title "${PIPELINE_PR_PREFIX}: ${ISSUE_TITLE}" \
      --body "Closes #${ISSUE_NUMBER}" \
      --base main \
      --head "$branch")" || return 1
  fi

  mark_superseded_follow_up "$pr_url"

  AGENT_ROLE=QA bash scripts/update-status.sh \
    --stage pr_opened \
    --owner qa \
    --from qa \
    --to maintainer \
    --artifact "$QA_REPORT_PATH" \
    --pr-url "$pr_url" \
    --message "PR opened by start.sh finalizer." || return 1

  git add "$status_path" || return 1
  if ! git diff --cached --quiet; then
    git commit -m "Record ${AUTO_PIPELINE} PR status for issue #${ISSUE_NUMBER}" || return 1
    git push || return 1
  fi

  bash scripts/feishu.sh status pr_opened "QA 通过，已创建 PR：${pr_url}"
  echo "::endgroup::"
}

mkdir -p ".auto-dev/incoming" ".auto-dev/status" "$ISSUE_ARTIFACT_DIR"

INCOMING_PATH=".auto-dev/incoming/issue-${ISSUE_NUMBER}.md"
cat > "$INCOMING_PATH" <<EOF_INCOMING
# Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}

${ISSUE_URL}

## Body

${ISSUE_BODY}
EOF_INCOMING

if [[ ! -f ".auto-dev/status/issue-${ISSUE_NUMBER}.json" ]]; then
  STATUS_PATH=".auto-dev/status/issue-${ISSUE_NUMBER}.json" node --input-type=module <<'NODE'
import fs from 'node:fs'

const issue = Number(process.env.ISSUE_NUMBER)
const statusPath = process.env.STATUS_PATH
const title = process.env.ISSUE_TITLE || `Issue #${issue}`

const status = {
  issue,
  title,
  pipeline: process.env.AUTO_PIPELINE || 'auto-dev',
  current_stage: 'submitted',
  current_owner: 'pm',
  pinned_comment_id: null,
  pr_url: null,
  history: [],
  retry_count: {
    qa_to_frontend: 0,
    qa_to_algorithm: 0,
    frontend_to_algorithm: 0,
    algorithm_to_pm: 0,
    frontend_to_pm: 0,
  },
}

fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`)
NODE
fi

bash scripts/update-status.sh \
  --stage submitted \
  --owner pm \
  --from system \
  --to pm \
  --artifact "$INCOMING_PATH" \
  --message "Issue submitted and queued for PM triage."

bash scripts/feishu.sh status submitted "新需求已进入 PM 评估：${ISSUE_TITLE}"

SHARED_SYSTEM_PROMPT="$(cat .claude/context/team-charter.md && printf '\n\n' && cat .claude/context/auto-dev-context.md)"

if ! run_agent_supervisor; then
  MESSAGE="${PIPELINE_TITLE} supervisor failed before reaching a terminal stage."
  AGENT_ROLE=system bash scripts/update-status.sh \
    --stage aborted \
    --owner system \
    --from system \
    --to maintainer \
    --artifact ".auto-dev/status/issue-${ISSUE_NUMBER}.json" \
    --message "$MESSAGE"
  if command -v gh >/dev/null 2>&1 && [[ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
    gh issue comment "$ISSUE_NUMBER" --body "$MESSAGE" >/dev/null
  fi
  bash scripts/feishu.sh status aborted "$MESSAGE"
  exit 1
fi

FINAL_STAGE="$(STATUS_PATH=".auto-dev/status/issue-${ISSUE_NUMBER}.json" node --input-type=module <<'NODE'
import fs from 'node:fs'
const status = JSON.parse(fs.readFileSync(process.env.STATUS_PATH, 'utf8'))
console.log(status.current_stage || '')
NODE
)"

case "$FINAL_STAGE" in
  pr_opened)
    bash scripts/feishu.sh status pr_opened "${AUTO_PIPELINE} Issue #${ISSUE_NUMBER} 已完成并创建 PR。"
    ;;
  qa_passed)
    if ! open_pr_from_current_changes; then
      MESSAGE="${PIPELINE_TITLE} reached qa_passed but start.sh failed to create PR."
      AGENT_ROLE=system bash scripts/update-status.sh \
        --stage aborted \
        --owner system \
        --from system \
        --to maintainer \
        --artifact ".auto-dev/status/issue-${ISSUE_NUMBER}.json" \
        --message "$MESSAGE"
      if command -v gh >/dev/null 2>&1 && [[ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
        gh issue comment "$ISSUE_NUMBER" --body "$MESSAGE" >/dev/null
      fi
      bash scripts/feishu.sh status aborted "$MESSAGE"
      exit 1
    fi
    ;;
  rejected|aborted)
    MESSAGE="${PIPELINE_TITLE} finished with terminal stage: ${FINAL_STAGE}"
    if command -v gh >/dev/null 2>&1 && [[ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
      gh issue comment "$ISSUE_NUMBER" --body "$MESSAGE" >/dev/null
    fi
    bash scripts/feishu.sh status "$FINAL_STAGE" "$MESSAGE"
    exit 1
    ;;
  *)
    MESSAGE="${PIPELINE_TITLE} exited before reaching a terminal success stage. Current stage: ${FINAL_STAGE:-unknown}"
    if command -v gh >/dev/null 2>&1 && [[ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
      gh issue comment "$ISSUE_NUMBER" --body "$MESSAGE" >/dev/null
    fi
    bash scripts/feishu.sh status aborted "$MESSAGE"
    exit 1
    ;;
esac
