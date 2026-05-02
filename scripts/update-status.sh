#!/usr/bin/env bash
set -euo pipefail

STAGE=""
OWNER=""
FROM_ROLE=""
TO_ROLE=""
ARTIFACT=""
MESSAGE=""
PR_URL=""
BUMP_RETRY="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stage)
      STAGE="${2:?--stage requires a value}"
      shift 2
      ;;
    --owner)
      OWNER="${2:?--owner requires a value}"
      shift 2
      ;;
    --from)
      FROM_ROLE="${2:?--from requires a value}"
      shift 2
      ;;
    --to)
      TO_ROLE="${2:?--to requires a value}"
      shift 2
      ;;
    --artifact)
      ARTIFACT="${2:?--artifact requires a value}"
      shift 2
      ;;
    --message)
      MESSAGE="${2:?--message requires a value}"
      shift 2
      ;;
    --pr-url)
      PR_URL="${2:?--pr-url requires a value}"
      shift 2
      ;;
    --bump-retry)
      BUMP_RETRY="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$STAGE" ]]; then
  echo "--stage is required" >&2
  exit 2
fi

ISSUE_NUMBER="${ISSUE_NUMBER:?ISSUE_NUMBER is required}"
ISSUE_TITLE="${ISSUE_TITLE:-Issue #$ISSUE_NUMBER}"
REPO="${GITHUB_REPOSITORY:-fengwm64/AlgorithmVisualizations}"
STATUS_DIR=".auto-dev/status"
STATUS_PATH="$STATUS_DIR/issue-${ISSUE_NUMBER}.json"
mkdir -p "$STATUS_DIR"

STATUS_PATH="$STATUS_PATH" \
ISSUE_NUMBER="$ISSUE_NUMBER" \
ISSUE_TITLE="$ISSUE_TITLE" \
STAGE="$STAGE" \
OWNER="$OWNER" \
FROM_ROLE="$FROM_ROLE" \
TO_ROLE="$TO_ROLE" \
ARTIFACT="$ARTIFACT" \
MESSAGE="$MESSAGE" \
PR_URL="$PR_URL" \
BUMP_RETRY="$BUMP_RETRY" \
AUTO_PIPELINE="${AUTO_PIPELINE:-auto-dev}" \
node --input-type=module <<'NODE'
import fs from 'node:fs'

const statusPath = process.env.STATUS_PATH
const issue = Number(process.env.ISSUE_NUMBER)
const title = process.env.ISSUE_TITLE || `Issue #${issue}`

let status
if (fs.existsSync(statusPath)) {
  status = JSON.parse(fs.readFileSync(statusPath, 'utf8'))
} else {
  status = {
    issue,
    title,
    current_stage: 'submitted',
    current_owner: 'pm',
    pinned_comment_id: null,
    pr_url: null,
    history: [],
    retry_count: {},
  }
}

const entry = {
  ts: new Date().toISOString(),
  from: process.env.FROM_ROLE || status.current_owner || 'system',
  to: process.env.TO_ROLE || process.env.OWNER || status.current_owner || 'pm',
  stage: process.env.STAGE,
}

if (process.env.ARTIFACT) entry.artifact = process.env.ARTIFACT
if (process.env.MESSAGE) entry.message = process.env.MESSAGE

status.issue = issue
status.title = title
status.pipeline = status.pipeline || process.env.AUTO_PIPELINE || 'auto-dev'
status.current_stage = process.env.STAGE
status.current_owner = process.env.OWNER || entry.to
status.history = Array.isArray(status.history) ? status.history : []
status.history.push(entry)
status.retry_count = status.retry_count && typeof status.retry_count === 'object'
  ? status.retry_count
  : {}

if (process.env.PR_URL) {
  status.pr_url = process.env.PR_URL
}

if (process.env.BUMP_RETRY === 'true' && entry.from && entry.to) {
  const key = `${entry.from}_to_${entry.to}`
  status.retry_count[key] = Number(status.retry_count[key] || 0) + 1
}

fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`)
NODE

render_comment() {
  STATUS_PATH="$STATUS_PATH" ISSUE_URL="${ISSUE_URL:-https://github.com/$REPO/issues/$ISSUE_NUMBER}" AUTO_PIPELINE="${AUTO_PIPELINE:-auto-dev}" node --input-type=module <<'NODE'
import fs from 'node:fs'

const status = JSON.parse(fs.readFileSync(process.env.STATUS_PATH, 'utf8'))
const history = Array.isArray(status.history) ? status.history : []
const pipeline = status.pipeline || process.env.AUTO_PIPELINE || 'auto-dev'
const cell = (value) => String(value || '').replace(/\n/g, ' ').replace(/\|/g, '\\|')
const artifactDir = `.auto-dev/issues/issue-${status.issue}`
const previewLimit = 9000
const rows = history.slice(-12).map((item) => {
  const artifact = item.artifact ? `\`${cell(item.artifact)}\`` : ''
  return `| ${cell(item.ts)} | ${cell(item.from)} -> ${cell(item.to)} | ${cell(item.stage)} | ${artifact} | ${cell(item.message)} |`
})

const prLine = status.pr_url ? `\nPR: ${status.pr_url}\n` : ''
const artifactSpecs = [
  ['PRD', `${artifactDir}/prd.md`],
  ['QA Report', `${artifactDir}/qa-report.md`],
  ['Decision', `${artifactDir}/decision.md`],
]

function escapeDetails(value) {
  return String(value || '').replace(/<\/details>/gi, '<\\/details>')
}

function readArtifactPreview(label, filePath) {
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf8').trim()
  const truncated = raw.length > previewLimit
    ? `${raw.slice(0, previewLimit)}\n\n... truncated in Issue comment; see \`${filePath}\` in the PR branch for the full file.`
    : raw

  return `<details>
<summary>${label}: <code>${filePath}</code></summary>

${escapeDetails(truncated)}

</details>`
}

const artifactPreviews = artifactSpecs
  .map(([label, filePath]) => readArtifactPreview(label, filePath))
  .filter(Boolean)
  .join('\n\n')

console.log(`<!-- auto-agent-status:${status.issue} -->
## Auto Agent Status

Issue: ${process.env.ISSUE_URL}
${prLine}
| Field | Value |
| --- | --- |
| Pipeline | \`${pipeline}\` |
| Current stage | \`${status.current_stage || ''}\` |
| Current owner | \`${status.current_owner || ''}\` |
| Updated at | \`${history.at(-1)?.ts || ''}\` |

### Recent History

| Time | Handoff | Stage | Artifact | Message |
| --- | --- | --- | --- | --- |
${rows.join('\n') || '| - | - | - | - | - |'}

### Intermediate Artifacts

${artifactPreviews || '_No PRD / QA report / decision file has been generated yet._'}
`)
NODE
}

if command -v gh >/dev/null 2>&1 && [[ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  COMMENT_BODY="$(render_comment)"
  PINNED_COMMENT_ID="$(STATUS_PATH="$STATUS_PATH" node --input-type=module <<'NODE'
import fs from 'node:fs'
const status = JSON.parse(fs.readFileSync(process.env.STATUS_PATH, 'utf8'))
console.log(status.pinned_comment_id || '')
NODE
)"

  if [[ -z "$PINNED_COMMENT_ID" || "$PINNED_COMMENT_ID" == "null" ]]; then
    PINNED_COMMENT_ID="$(gh api "repos/${REPO}/issues/${ISSUE_NUMBER}/comments" \
      -f body="$COMMENT_BODY" \
      --jq '.id')"

    STATUS_PATH="$STATUS_PATH" PINNED_COMMENT_ID="$PINNED_COMMENT_ID" node --input-type=module <<'NODE'
import fs from 'node:fs'
const status = JSON.parse(fs.readFileSync(process.env.STATUS_PATH, 'utf8'))
status.pinned_comment_id = Number(process.env.PINNED_COMMENT_ID)
fs.writeFileSync(process.env.STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`)
NODE
  else
    gh api -X PATCH "repos/${REPO}/issues/comments/${PINNED_COMMENT_ID}" \
      -f body="$COMMENT_BODY" >/dev/null
  fi
else
  echo "Skipping GitHub sticky comment update: gh or token is unavailable." >&2
fi
