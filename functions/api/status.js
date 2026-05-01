const REPO_OWNER = 'fengwm64'
const REPO_NAME = 'vis'
const DEFAULT_BRANCH = 'main'

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
      'User-Agent': 'vis-auto-dev-status',
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
  if (!body?.includes('<!-- auto-dev-status:')) return null

  const stage = body.match(/\| Current stage \| `([^`]+)` \|/)?.[1]
  const owner = body.match(/\| Current owner \| `([^`]+)` \|/)?.[1]
  const updatedAt = body.match(/\| Updated at \| `([^`]+)` \|/)?.[1]
  const prUrl = body.match(/\nPR:\s*(https?:\/\/\S+)/)?.[1]

  if (!stage && !owner) return null

  return {
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

async function loadIssueStatus(issueNumber, headers = {}) {
  return (
    (await fetchStatusFile(issueNumber, DEFAULT_BRANCH, headers)) ||
    (await fetchStatusFile(issueNumber, `auto-dev/issue-${issueNumber}`, headers)) ||
    (await fetchStatusComment(issueNumber, headers))
  )
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
    const issues = await fetchJson(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&labels=auto-dev&per_page=50`,
      {
        ...authHeaders,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    )

    const issueItems = (issues || []).filter((issue) => !issue.pull_request)
    const statuses = await Promise.all(
      issueItems.map(async (issue) => {
        const status = await loadIssueStatus(issue.number, authHeaders).catch(() => null)

        return {
          issueNumber: issue.number,
          title: issue.title,
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
