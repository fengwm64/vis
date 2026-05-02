const REPO_OWNER = 'fengwm64'
const REPO_NAME = 'vis'
const ALLOWED_AREAS = new Set(['interaction', 'visual', 'content', 'algorithm', 'performance'])

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

function issueRef(number, url) {
  if (number) return `#${number}`
  return url || '未提供'
}

function pullRequestRef(url) {
  const number = String(url || '').match(/\/pull\/(\d+)/)?.[1]
  if (number) return `#${number}`
  return url || '未提供'
}

function numberFromUrl(url, type) {
  return String(url || '').match(new RegExp(`/${type}/(\\d+)`))?.[1] || ''
}

function buildFollowUpSection({ previousIssueNumber, previousIssueUrl, previousPrUrl }) {
  if (!previousIssueNumber && !previousIssueUrl && !previousPrUrl) return ''

  return `
### 继续修复来源
- 原 Issue: ${issueRef(previousIssueNumber, previousIssueUrl)}
- 原 PR: ${pullRequestRef(previousPrUrl)}

### 继续修复要求
- 先阅读原 Issue、原 PR 和本次说明，判断为什么上次修复没有完全解决。
- QA 必须重点验证本次描述的复现步骤，不能只验证构建通过。
`
}

async function createIssueComment({ token, issueNumber, body }) {
  if (!issueNumber || !body) return

  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vis-auto-fix-follow-up',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ body }),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `comment failed: ${response.status}`)
  }
}

async function notifySupersededTargets({
  token,
  previousIssueNumber,
  previousIssueUrl,
  previousPrUrl,
  newIssueNumber,
  newIssueUrl,
}) {
  const issueNumber = previousIssueNumber || numberFromUrl(previousIssueUrl, 'issues')
  const prNumber = numberFromUrl(previousPrUrl, 'pull')
  const body = `后续修复已创建：#${newIssueNumber}\n\n这个任务将继续处理当前问题，请后续以 #${newIssueNumber} 为准。`

  if (issueNumber) {
    await createIssueComment({ token, issueNumber, body })
  }

  if (prNumber && prNumber !== issueNumber) {
    await createIssueComment({
      token,
      issueNumber: prNumber,
      body: `后续修复已创建：#${newIssueNumber}\n\n如果这个 PR 仍未合并，请不要再合并它；后续变更会由 ${newIssueUrl} 对应的新 PR 接管。`,
    })
  }
}

function buildIssueBody({
  animationId,
  animationTitle,
  animationPath,
  area,
  title,
  description,
  previousIssueNumber,
  previousIssueUrl,
  previousPrUrl,
}) {
  return `## 自动修复/优化需求

### 目标动画
- ID: ${animationId}
- 标题: ${animationTitle}
- 路径: ${animationPath}

### 问题类型
${area}

### 修改标题
${title}

### 具体说明
${description}
${buildFollowUpSection({ previousIssueNumber, previousIssueUrl, previousPrUrl })}

### 处理要求
- 这是针对现有算法可视化页面的 auto-fix 请求，优先修改现有文件，不要默认新增算法页面。
- 如果是交互/视觉/文案问题，PM 可直接交给 frontend。
- 如果是算法逻辑或步骤数据问题，再交给 algorithm。
- QA 必须检查是否存在无用按钮、重复按钮、死按钮、文案行为不一致和交互 bug。

### 触发来源
动画页面 Auto-Fix 表单

---

创建后由 Cloudflare Pages Function 直接触发 \`Auto Fix Agents\` workflow，并启动 Claude Code Agent 团队自动修复。`
}

async function dispatchWorkflow({ token, issueNumber }) {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/auto-fix.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vis-auto-fix-dispatch',
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

  const animationId = cleanText(payload.animationId, 80)
  const animationTitle = cleanText(payload.animationTitle, 120)
  const animationPath = cleanText(payload.animationPath, 160)
  const title = cleanText(payload.title, 100)
  const description = cleanText(payload.description, 3000)
  const area = ALLOWED_AREAS.has(payload.area) ? payload.area : 'interaction'
  const previousIssueNumber = cleanText(payload.previousIssueNumber, 20)
  const previousIssueUrl = cleanText(payload.previousIssueUrl, 220)
  const previousPrUrl = cleanText(payload.previousPrUrl, 220)

  if (!animationId || !animationPath.startsWith('/animations/')) {
    return json({ error: '目标动画无效' }, { status: 400 })
  }

  if (title.length < 2) {
    return json({ error: '标题至少需要 2 个字符' }, { status: 400 })
  }

  if (description.length < 10) {
    return json({ error: '具体说明至少需要 10 个字符' }, { status: 400 })
  }

  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'vis-auto-fix-submit',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      title: withPrefix(`${animationTitle}: ${previousIssueNumber ? '继续修复 - ' : ''}${title}`, '[auto-fix]'),
      body: buildIssueBody({
        animationId,
        animationTitle,
        animationPath,
        area,
        title,
        description,
        previousIssueNumber,
        previousIssueUrl,
        previousPrUrl,
      }),
      labels: ['auto-fix'],
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
    await notifySupersededTargets({
      token: env.GITHUB_TOKEN,
      previousIssueNumber,
      previousIssueUrl,
      previousPrUrl,
      newIssueNumber: data.number,
      newIssueUrl: data.html_url,
    })
    await dispatchWorkflow({ token: env.GITHUB_TOKEN, issueNumber: data.number })
  } catch (dispatchError) {
    return json(
      {
        error: `Issue 已创建，但 Auto Fix workflow 启动失败：${dispatchError.message}`,
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
