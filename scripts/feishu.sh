#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-}"
shift || true

ISSUE_NUMBER="${ISSUE_NUMBER:-unknown}"
ISSUE_URL="${ISSUE_URL:-https://github.com/${GITHUB_REPOSITORY:-fengwm64/vis}/issues/${ISSUE_NUMBER}}"

send_text() {
  local text="$1"

  if [[ -z "${FEISHU_WEBHOOK:-}" ]]; then
    echo "$text"
    return 0
  fi

  local payload
  payload="$(MESSAGE="$text" node --input-type=module <<'NODE'
const text = process.env.MESSAGE || ''
console.log(JSON.stringify({
  msg_type: 'text',
  content: { text },
}))
NODE
)"

  curl -fsS \
    -X POST "$FEISHU_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "$payload" >/dev/null
}

case "$COMMAND" in
  status)
    STAGE="${1:?stage is required}"
    MESSAGE="${2:?message is required}"
    ROLE="${AGENT_ROLE:-Agent}"
    send_text "[#${ISSUE_NUMBER}] 🤖 ${ROLE} ${MESSAGE}
当前阶段: ${STAGE}
Issue: ${ISSUE_URL}"
    ;;
  handoff)
    FROM_ROLE="${1:?from role is required}"
    TO_ROLE="${2:?to role is required}"
    DELIVERABLE="${3:?deliverable path is required}"
    SUMMARY="${4:?summary is required}"
    send_text "[#${ISSUE_NUMBER}] 📦 交付：@${FROM_ROLE} ➜ @${TO_ROLE}
产物: ${DELIVERABLE}
要点:
${SUMMARY}
继续: 请 @${TO_ROLE} 接手下一步。"
    ;;
  *)
    echo "Usage: feishu.sh status <stage> <message> | feishu.sh handoff <from-role> <to-role> <deliverable-path> <summary>" >&2
    exit 2
    ;;
esac
