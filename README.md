# 算法可视化 | Algorithm Visualizations

一个多 Agent 驱动的算法可视化项目：网站提供交互式算法动画，也提供需求入口，让 PM、算法工程师、前端可视化专家、QA 四个 Claude Code Agent 自动完成“接需求 -> 写 PRD -> 写算法 -> 做可视化 -> 测试 -> 发 PR”的开发流程。

🔗 **在线预览**: [https://alg.102465.xyz/](https://alg.102465.xyz/)

---

## 多 Agent 自动开发

自动开发链路：

```text
/submit 表单
  -> Cloudflare Pages Function 创建 auto-dev Issue
  -> Cloudflare Pages Function dispatch Auto Dev Agents workflow
  -> scripts/start.sh 启动 Claude Code
  -> PM / algorithm / frontend / QA 四个 agent 点对点协作
  -> QA 通过后创建 auto-dev/issue-N 分支和 PR
```

现有动画修复链路：

```text
动画页 Auto-Fix 表单
  -> /api/fix 创建 auto-fix Issue
  -> Cloudflare Pages Function dispatch Auto Fix Agents workflow
  -> PM 判断是否直接交给 frontend 或先交给 algorithm
  -> Agent 修改现有动画页面
  -> QA 检查交互 bug 和冗余控件
  -> QA 通过后创建 auto-fix/issue-N 分支和 PR
```

关键设计：

- **无后端服务**：网站仍是 Cloudflare Pages SPA，API 只用 Pages Functions。
- **无中央 orchestrator agent**：`scripts/start.sh` 是 shell supervisor，按 status JSON 启动各角色；agent 只负责产物和 handoff 状态，PR 创建由 finalizer 统一收口。
- **分离入口**：新算法开发使用 `auto-dev` label 和 `Auto Dev Agents` workflow；现有动画修复使用 `auto-fix` label 和 `Auto Fix Agents` workflow。两个 workflow 都由 Pages Function 精确 dispatch，不再监听同一个 `issues.labeled` 事件。
- **降低 PR 冲突**：两个 workflow 共用同一个 GitHub Actions concurrency group，因此 auto-dev / auto-fix 任务会排队串行执行；新动画通过 `src/animations/<slug>/meta.js` 和 `index.jsx` 自动注册，不需要改 `src/App.jsx`。
- **三路可观测性**：`.auto-dev/status/issue-N.json`、Issue sticky comment、网站 `/status` 页面。
- **实时通知**：阶段切换、handoff、失败会通过飞书机器人广播。
- **QA 交互审计**：QA 会检查无用/冗余按钮、死按钮、播放控制边界、文案行为一致性和潜在交互 bug。
- **Auto-Fix 入口**：每个算法动画页底部都可以提交对当前动画的修复或优化建议。
- **LLM 调用统一入口**：所有模型调用都由 Claude Code 完成，workflow 通过 MiMo Anthropic 兼容网关注入 `ANTHROPIC_BASE_URL`。

---

## 技术栈

- **框架**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **路由**: [React Router v6](https://reactrouter.com/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **部署**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **自动开发**: GitHub Actions + Claude Code Agents + Cloudflare Pages Functions

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动，支持热更新。

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览构建产物

```bash
npm run preview
```

---

## 项目结构

```
├── public/                        # 静态资源
│   └── _redirects                 # Cloudflare Pages SPA 路由回退规则
├── functions/
│   └── api/                       # Cloudflare Pages Functions
│       ├── submit.js              # 自动开发需求提交接口
│       ├── fix.js                 # 现有动画 auto-fix 提交接口
│       └── status.js              # 自动开发状态聚合接口
├── .claude/
│   ├── agents/                    # Claude Code 子 agent 定义
│   └── context/                   # 自动开发团队共享上下文
├── .github/
│   └── workflows/
│       ├── auto-dev.yml           # auto-dev Issue 触发的新算法开发 workflow
│       └── auto-fix.yml           # auto-fix Issue 触发的现有动画修复 workflow
├── .auto-dev/
│   └── status/                    # 自动开发状态 JSON，随 PR 入仓
├── scripts/
│   ├── start.sh                   # 自动开发入口，启动 PM agent
│   ├── update-status.sh           # 更新 status JSON 和 Issue sticky comment
│   └── feishu.sh                  # 飞书状态与 handoff 通知
├── src/
│   ├── main.jsx                   # 应用入口
│   ├── App.jsx                    # 根组件（首页 + 路由配置）
│   ├── index.css                  # Tailwind 基础样式
│   ├── pages/                     # 站点页面
│   │   ├── Submit.jsx             # 自动开发需求入口
│   │   └── Status.jsx             # 自动开发状态总览
│   ├── components/ui/             # 通用 UI 组件
│   │   ├── button.jsx             # Button 组件
│   │   └── card.jsx               # Card 组件
│   └── animations/                # 算法动画页面
│       ├── pagerank_process_animation.jsx
│       └── pagerank/
│           ├── index.jsx          # 动画入口组件
│           └── meta.js            # 首页卡片与路由元数据
├── index.html                     # HTML 入口
├── vite.config.js                 # Vite 配置
├── tailwind.config.js             # Tailwind CSS 配置
├── wrangler.toml                  # Cloudflare Pages 部署配置
└── package.json
```

---

## 添加新的算法动画

1. **创建动画目录**

   在 `src/animations/` 下创建独立目录，例如：

   ```jsx
   // src/animations/dijkstra/index.jsx
   export default function DijkstraAnimation() {
     return (
       <div className="min-h-screen bg-slate-50 p-6">
         <h1 className="text-3xl font-bold">Dijkstra 最短路径</h1>
         {/* 你的可视化逻辑 */}
       </div>
     )
   }
   ```

2. **添加元数据**

   在同一目录添加 `meta.js`：

   ```js
   // src/animations/dijkstra/meta.js
   export const title = 'Dijkstra 最短路径'
   export const description = '可视化贪心策略下的单源最短路径求解过程。'
   export const path = '/animations/dijkstra'
   export const category = 'graph'
   ```

3. **完成**

   `src/App.jsx` 会通过 Vite `import.meta.glob` 自动发现动画，不需要手动改共享入口文件。首页会自动按 `category` 分组展示新卡片，路由和导航栏均已配置完毕。

   当前支持的分类 key：

   - `sorting`：排序算法
   - `search`：查找算法
   - `graph`：图算法
   - `dynamic`：动态规划
   - `dataStructure`：数据结构
   - `other`：其他算法

---

## 部署教程

### 1. GitHub 仓库准备

1. 确认仓库已推送到 GitHub，例如 `fengwm64/vis`。
2. 创建 Issue label：`auto-dev` 和 `auto-fix`。
3. 在仓库设置中启用 Actions：
   - `Settings -> Actions -> General`
   - 确认允许 workflow 运行。
   - `Workflow permissions` 选择 `Read and write permissions`，并允许 GitHub Actions 创建 PR。

### 2. 配置 GitHub Actions Secrets

进入 `Settings -> Secrets and variables -> Actions -> New repository secret`，添加：

| Secret | 说明 |
| --- | --- |
| `ANTHROPIC_BASE_URL` | MiMo Anthropic 兼容网关地址，例如 `https://token-plan-cn.xiaomimimo.com/anthropic` |
| `ANTHROPIC_API_KEY` | MiMo 网关 API Key |
| `ANTHROPIC_MODEL` | MiMo 模型 ID，推荐填 `mimo-v2.5-pro`。注意这是接口 ID，不是展示名 `MiMo-V2.5-Pro` |
| `FEISHU_WEBHOOK` | 飞书自定义机器人 webhook |

`GH_TOKEN` 不需要手动配置，workflow 使用 GitHub Actions 内置 token。workflow 会把 `ANTHROPIC_API_KEY` 同时映射成 Claude Code 使用的 `ANTHROPIC_AUTH_TOKEN`。`scripts/start.sh` 会把 Sonnet / Opus / Haiku / Subagent 默认模型都指向同一个 MiMo 模型，并在日志中打印安全诊断信息。

### 3. 创建 GitHub Token 给 Cloudflare Pages Function

`/api/submit` 需要从网站创建 GitHub Issue，因此 Cloudflare 侧需要一个 GitHub fine-grained token：

1. 打开 GitHub `Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens`。
2. 选择目标仓库 `fengwm64/vis`。
3. Repository permissions 至少开启：
   - `Issues: Read and write`
   - `Actions: Read and write`
   - `Metadata: Read-only`
4. 生成 token，后续填到 Cloudflare Pages 环境变量 `GITHUB_TOKEN`。

### 4. 部署 Cloudflare Pages

推荐使用 Git 集成：

1. 登录 Cloudflare Dashboard。
2. 进入 `Workers & Pages -> Pages -> Create a project`。
3. 连接 GitHub 仓库。
4. 构建设置：
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: 留空
5. 环境变量添加：

| Variable | 作用 |
| --- | --- |
| `GITHUB_TOKEN` | Pages Function 创建 Issue 使用的 fine-grained token |

6. 保存并部署。

Cloudflare Pages 会自动识别 `functions/api/submit.js`、`functions/api/fix.js` 和 `functions/api/status.js`：

- `POST /api/submit`：创建带 `auto-dev` label 的 GitHub Issue。
- `POST /api/fix`：为现有动画创建带 `auto-fix` label 的修复/优化 Issue。
- `GET /api/status`：聚合 `auto-dev` 和 `auto-fix` 状态供 `/status` 页面轮询。

`/api/submit` 和 `/api/fix` 创建 Issue 后会直接调用 GitHub Actions workflow dispatch API。不要再依赖手动给 Issue 加 label 来启动 workflow；label 只用于任务分类、筛选和状态展示。

Issue 标题约定：

- 新算法需求：`[auto-dev] <算法名称>`
- 现有动画修复：`[auto-fix] <动画标题>: <修改标题>`

> `public/_redirects` 已配置 SPA 路由回退规则，确保刷新页面不会 404；Cloudflare Pages Functions 的 `/api/*` 路径优先级高于 SPA fallback。

### 5. 验证普通站点部署

本地先跑：

```bash
npm ci
npm run build
```

部署后检查：

- 首页能打开。
- `/animations/pagerank` 能打开。
- `/submit` 能打开表单。
- `/status` 能打开总览页。

### 6. 验证自动开发链路

1. 访问 `/submit`。
2. 提交一个小需求，例如“二分查找可视化”。
3. 确认 GitHub 出现新 Issue，并带 `auto-dev` label。
4. 确认 GitHub Actions 自动启动 `Auto Dev Agents` workflow。
5. 在飞书群里确认收到 `[#issue]` 前缀的状态消息。
6. 等待 workflow 结束后检查：
   - Issue sticky comment 有状态表。
   - PR 分支名类似 `auto-dev/issue-N`。
   - PR 中包含 `.auto-dev/status/issue-N.json`、`.auto-dev/prd.md`、`.auto-dev/qa-report.md` 和动画代码。
   - `/status` 页面能看到当前阶段和 PR 链接。

### 7. 验证 Auto-Fix 链路

1. 打开任意动画页面，例如 `/animations/pagerank`。
2. 在页面底部 Auto-Fix 表单提交一个具体修复建议。
3. 确认 GitHub 出现新 Issue，并带 `auto-fix` label。
4. 确认 GitHub Actions 自动启动 `Auto Fix Agents` workflow。
5. workflow 结束后检查：
   - PR 分支名类似 `auto-fix/issue-N`。
   - PR 只修改目标现有动画或必要的共享文件。
   - `/status` 页面能区分显示“新算法”和“修复优化”。

### 8. 常见问题

- 如果 `/api/submit` 或 `/api/fix` 返回 GitHub 错误，先确认 Cloudflare Pages 的 `GITHUB_TOKEN` 是否存在，且 token 对目标仓库有 `Issues: Read and write` 和 `Actions: Read and write` 权限。
- 如果 Issue 创建失败并提示 label 相关错误，确认仓库中已存在 `auto-dev` 和 `auto-fix` 两个 label。
- 如果 workflow 没启动，确认 Cloudflare `GITHUB_TOKEN` 有 `Actions: Read and write` 权限，且 `.github/workflows/auto-dev.yml` / `.github/workflows/auto-fix.yml` 已在默认分支。
- 如果多个 auto-dev / auto-fix Issue 同时提交，后提交的 workflow 会排队等待前一个完成；这是为了减少自动生成 PR 之间的入口文件冲突。
- 如果 Claude Code 报 `Not supported model ***`，把 GitHub Secret `ANTHROPIC_MODEL` 改成小写接口 ID，例如 `mimo-v2.5-pro`。`MiMo-V2.5-Pro` 是展示名，网关会拒绝。
- 如果 Claude Code 报 sandbox 阻止 `npm` 或 `git`，确认 workflow 已更新到使用 `--permission-mode bypassPermissions`，并且 QA agent 不再直接执行 git；最终 PR 应由 `scripts/start.sh` finalizer 创建。
- 如果日志里没有 `Claude Code environment diagnostics` 分组，说明 workflow 还没有运行到包含诊断逻辑的最新提交。
- `Claude Code environment diagnostics` 只打印 `ANTHROPIC_BASE_URL` 的 protocol / host / path，以及 token 是否存在，不会打印 API Key。
- 如果 Claude Code 无法调用模型，确认 GitHub Secrets 中的 `ANTHROPIC_BASE_URL`、`ANTHROPIC_API_KEY`、`ANTHROPIC_MODEL` 已配置；Token Plan 用户的 Base URL 以订阅控制台显示为准。
- 如果没有飞书消息，确认 `FEISHU_WEBHOOK` 是 GitHub Actions Secret，而不是 Cloudflare Pages 环境变量。
- 如果 `/status` 暂时看不到 PR 状态，先看 Issue sticky comment；`/status` 会依次尝试 main 分支、对应 pipeline 分支（`auto-dev/issue-N` 或 `auto-fix/issue-N`）和 sticky comment。

### 9. Wrangler 手动部署

如需不用 Git 集成，也可以手动部署：

```bash
npm ci
npm run build
npm install -g wrangler
wrangler login
wrangler pages deploy dist
```

手动部署后仍需在 Cloudflare Pages 项目里配置 `GITHUB_TOKEN`，否则 `/api/submit` 和 `/api/fix` 无法创建 Issue。

## 已有可视化

| 算法 | 路径 | 说明 |
|------|------|------|
| PageRank | `/animations/pagerank` | 有向图上的 PageRank 迭代传播与收敛过程 |

---

## 贡献

欢迎提交 Issue 或 PR 来添加新的算法可视化！

---

## License

[MIT](LICENSE)
