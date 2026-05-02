const REPO_OWNER = 'fengwm64'
const REPO_NAME = 'vis'
const ALLOWED_COMPLEXITY = new Set(['small', 'medium', 'large'])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

function cleanText(value, limit) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
    .slice(0, limit)
}

function withPrefix(title, prefix) {
  return title.startsWith(prefix) ? title : `${prefix} ${title}`
}

function formatRefs(value) {
  const lines = String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)

  if (lines.length === 0) return '- 无'
  return lines.map((line) => `- ${line}`).join('\n')
}

function buildIssueBody({ title, description, refs, expectedComplexity }) {
  return `## 自动开发需求

### 算法名称
${title}

### 问题描述
${description}

### 参考链接
${formatRefs(refs)}

### 期望复杂度
${expectedComplexity}

### 触发来源
网站 /submit 表单

---

创建后由 Cloudflare Pages Function 直接触发 \`Auto Dev Agents\` workflow，并启动 Claude Code Agent 团队自动开发。`
}

async function dispatchWorkflow({ token, issueNumber }) {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/auto-dev.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vis-auto-dev-dispatch',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          issue_number: String(issueNumber),
        },
      }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `workflow dispatch failed: ${response.status}`)
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function onRequestPost({ request, env }) {
  if (!env.GITHUB_TOKEN) {
    return json({ error: 'Server is missing GITHUB_TOKEN' }, { status: 500 })
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Request body must be JSON' }, { status: 400 })
  }

  const title = cleanText(payload.title, 80)
  const description = cleanText(payload.description, 5000)
  const refs = cleanText(payload.refs, 2000)
  const expectedComplexity = ALLOWED_COMPLEXITY.has(payload.expectedComplexity)
    ? payload.expectedComplexity
    : 'medium'

  if (title.length < 2) {
    return json({ error: '算法名称至少需要 2 个字符' }, { status: 400 })
  }

  if (description.length < 20) {
    return json({ error: '问题描述至少需要 20 个字符' }, { status: 400 })
  }

  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'vis-auto-dev-submit',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      title: withPrefix(title, '[auto-dev]'),
      body: buildIssueBody({ title, description, refs, expectedComplexity }),
      labels: ['auto-dev'],
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    return json(
      { error: data.message || 'GitHub Issue 创建失败' },
      { status: response.status },
    )
  }

  try {
    await dispatchWorkflow({ token: env.GITHUB_TOKEN, issueNumber: data.number })
  } catch (dispatchError) {
    return json(
      {
        error: `Issue 已创建，但 Auto Dev workflow 启动失败：${dispatchError.message}`,
        issueNumber: data.number,
        issueUrl: data.html_url,
      },
      { status: 502 },
    )
  }

  return json({
    issueNumber: data.number,
    issueUrl: data.html_url,
  })
}
