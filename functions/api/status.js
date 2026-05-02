const REPO_OWNER = 'fengwm64'
const REPO_NAME = 'vis'
const DEFAULT_BRANCH = 'main'
const PIPELINE_LABELS = ['auto-dev', 'auto-fix']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...(init.headers || {}),
    },
  })
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'vis-auto-agent-status',
      ...headers,
    },
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`)
  }

  return response.json()
}

async function fetchStatusFile(issueNumber, ref, headers = {}) {
  const data = await fetchJson(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/.auto-dev/status/issue-${issueNumber}.json?ref=${encodeURIComponent(ref)}`,
    {
      ...headers,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  )

  if (!data?.content) return null

  try {
    const raw = atob(data.content.replace(/\n/g, ''))
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function parseStatusComment(body) {
  if (!body?.includes('<!-- auto-dev-status:') && !body?.includes('<!-- auto-agent-status:')) {
    return null
  }

  const pipeline = body.match(/\| Pipeline \| `([^`]+)` \|/)?.[1]
  const stage = body.match(/\| Current stage \| `([^`]+)` \|/)?.[1]
  const owner = body.match(/\| Current owner \| `([^`]+)` \|/)?.[1]
  const updatedAt = body.match(/\| Updated at \| `([^`]+)` \|/)?.[1]
  const prUrl = body.match(/\nPR:\s*(https?:\/\/\S+)/)?.[1]

  if (!stage && !owner) return null

  return {
    pipeline: pipeline || null,
    current_stage: stage || 'submitted',
    current_owner: owner || 'pm',
    pr_url: prUrl || null,
    history: updatedAt ? [{ ts: updatedAt }] : [],
  }
}

async function fetchStatusComment(issueNumber, headers = {}) {
  const comments = await fetchJson(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/comments?per_page=100`,
    {
      ...headers,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  )

  if (!Array.isArray(comments)) return null

  return comments
    .map((comment) => parseStatusComment(comment.body))
    .filter(Boolean)
    .at(-1) || null
}

async function loadIssueStatus(issueNumber, pipeline = 'auto-dev', headers = {}) {
  const branchRefs = [
    `${pipeline}/issue-${issueNumber}`,
    `auto-dev/issue-${issueNumber}`,
    `auto-fix/issue-${issueNumber}`,
  ]

  return (
    (await fetchStatusFile(issueNumber, DEFAULT_BRANCH, headers)) ||
    (await Promise.all(branchRefs.map((ref) => fetchStatusFile(issueNumber, ref, headers).catch(() => null))))
      .find(Boolean) ||
    (await fetchStatusComment(issueNumber, headers))
  )
}

function getPipelineFromIssue(issue) {
  const labels = Array.isArray(issue.labels) ? issue.labels : []
  const names = labels.map((label) => typeof label === 'string' ? label : label.name)

  if (names.includes('auto-fix')) return 'auto-fix'
  return 'auto-dev'
}

function latestHistoryTs(status, fallback) {
  const history = Array.isArray(status?.history) ? status.history : []
  const latest = history[history.length - 1]
  return latest?.ts || fallback
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function onRequestGet({ env }) {
  const authHeaders = env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` }
    : {}

  try {
    const issueGroups = await Promise.all(
      PIPELINE_LABELS.map((label) => fetchJson(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&labels=${label}&per_page=50`,
        {
          ...authHeaders,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      )),
    )

    const issueItems = Array.from(
      new Map(
        issueGroups
          .flat()
          .filter((issue) => issue && !issue.pull_request)
          .map((issue) => [issue.number, issue]),
      ).values(),
    )

    const statuses = await Promise.all(
      issueItems.map(async (issue) => {
        const pipeline = getPipelineFromIssue(issue)
        const status = await loadIssueStatus(issue.number, pipeline, authHeaders).catch(() => null)

        return {
          issueNumber: issue.number,
          title: issue.title,
          pipeline: status?.pipeline || pipeline,
          currentStage: status?.current_stage || 'submitted',
          currentOwner: status?.current_owner || 'pm',
          lastActivityAt: latestHistoryTs(status, issue.updated_at),
          issueUrl: issue.html_url,
          prUrl: status?.pr_url || null,
          status,
        }
      }),
    )

    return json({
      generatedAt: new Date().toISOString(),
      items: statuses.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt)),
    })
  } catch (error) {
    return json({ error: error.message || '状态加载失败' }, { status: 502 })
  }
}
