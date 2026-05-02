# Auto Dev Shared Context

这是 `fengwm64/vis` 自动开发功能的所有 agent 共享上下文。每个 agent 开始工作或从其他 agent 接手时，都必须先读取本文件和 `.claude/context/team-charter.md`。

## 项目现状

- 仓库是 React 18 + Vite + Tailwind + Framer Motion SPA。
- 部署目标是 Cloudflare Pages，静态站点为主，无传统后端。
- Pages Functions 只负责轻量 API：创建 GitHub Issue、聚合自动开发状态。
- 当前已有动画是 PageRank：`src/animations/pagerank_process_animation.jsx`。
- 通用 UI 组件在 `src/components/ui/button.jsx` 和 `src/components/ui/card.jsx`。
- 首页和动画路由集中在 `src/App.jsx` 的 `animations` 数组。

## 自动开发目标

把“提交需求 -> 写 PRD -> 写算法 -> 做可视化 -> QA 验证 -> 发 PR”交给 Claude Code agent 团队执行。GitHub Actions 中由 `scripts/start.sh` shell supervisor 按 status JSON 启动各角色，避免依赖 Task 工具在非交互 CI 中递归拉起下一个 agent。

用户入口：

1. 用户在网站 `/submit` 填表。
2. `functions/api/submit.js` 调 GitHub API 创建 Issue。
3. Issue 自动带 `auto-dev` label。
4. GitHub Actions 的 `.github/workflows/auto-dev.yml` 监听该 label。
5. workflow 安装 Claude Code 和 npm 依赖，然后执行 `bash scripts/start.sh`。
6. `scripts/start.sh` 初始化 `.auto-dev/incoming/issue-N.md` 和 `.auto-dev/status/issue-N.json`，再启动 Claude Code，让 PM agent 接单。
7. QA agent 推进到 `qa_passed` 后退出；`scripts/start.sh` finalizer 从普通 shell 环境复核构建和算法测试，然后提交、推送并创建 PR。

## LLM 和运行环境

- 所有 LLM 调用只能通过 Claude Code 当前进程完成。
- 不要直接调用 OpenAI SDK、Anthropic SDK、MiMo SDK 或任何模型 HTTP API。
- workflow 通过以下环境变量接入 MiMo 网关：
  - `ANTHROPIC_BASE_URL`
  - `ANTHROPIC_API_KEY`
  - `ANTHROPIC_AUTH_TOKEN`
  - `ANTHROPIC_MODEL`
- MiMo 模型名必须使用接口 ID，例如 `mimo-v2.5-pro`，不要使用展示名 `MiMo-V2.5-Pro`。
- `scripts/start.sh` 会在 GitHub Actions 日志中打印安全诊断信息，并强制用 `claude -p --model "$ANTHROPIC_MODEL"` 启动，避免 Claude Code 默认别名回退到 Anthropic 官方模型。
- 飞书通知使用 `FEISHU_WEBHOOK`。
- GitHub 操作使用 workflow 内置 `GH_TOKEN`。

## 关键文件契约

输入与状态：

- `.auto-dev/incoming/issue-N.md`：原始 Issue 内容，只作为本次运行输入，不入仓库。
- `.auto-dev/status/issue-N.json`：本需求的状态机、当前 owner、history、retry_count、PR URL，必须入 PR。
- `.auto-dev/prd.md`：PM 输出的产品需求文档，必须入 PR。
- `.auto-dev/qa-report.md`：QA 输出的验收报告，必须入 PR。

脚本：

- `scripts/start.sh`：唯一入口，启动 PM，进程退出后检查终态。
- `.claude/context/team-charter.md`：团队章程，定义角色、状态协议、handoff、防死循环。
- `.claude/context/auto-dev-context.md`：本文件，定义项目和功能共享上下文。
- `scripts/update-status.sh`：更新 status JSON 和 Issue sticky comment。
- `scripts/feishu.sh`：发送飞书状态广播和 handoff 消息。

Cloudflare Pages Functions：

- `functions/api/submit.js`：接收网站表单，创建 `auto-dev` Issue。
- `functions/api/status.js`：聚合 Issue、status JSON、PR 分支状态和 sticky comment，供 `/status` 页面轮询。

Claude agents：

- `.claude/agents/pm.md`
- `.claude/agents/algorithm.md`
- `.claude/agents/frontend.md`
- `.claude/agents/qa.md`

## 角色产物契约

PM 必须产出：

- `.auto-dev/prd.md`，包含算法定义、边界、输入规模、可视化步骤、复杂度、验收清单、建议 slug。
- 如果拒绝，产出 `.auto-dev/decision.md`，状态进入 `rejected`，不再交给其他 agent。

算法工程师必须产出：

- `src/animations/<slug>/algorithm.js`。
- 算法模块必须是纯函数，零 DOM、零 React 依赖。
- 至少导出步骤生成函数和 `runAlgorithmTests`。
- 必须能用 Node ESM import 运行自检。

前端可视化专家必须产出：

- `src/animations/<slug>.jsx`。
- 更新 `src/App.jsx` 的 import 和 `animations` 数组。
- 使用算法模块生成步骤，不把核心算法硬编码在 React 组件里。
- 复用现有 UI 组件和 PageRank 的播放控制模式。
- 每个按钮和交互控件都必须有明确用途、可触发可见状态变化，并和文案一致；不要添加占位、重复、无用或不可达按钮。
- `npm run build` 必须通过。

QA 必须产出：

- `.auto-dev/qa-report.md`。
- 构建结果、算法测试结果、PRD 验收项逐项结论。
- UI 控件审计结果：逐项说明是否存在无用按钮、重复按钮、死按钮、文案行为不一致、禁用态错误。
- 交互 bug 审计结果：逐项说明播放/暂停、单步、回退、重置、边界步骤、自动播放定时器、路由和响应式布局是否通过。
- 通过后只把状态推进到 `qa_passed`；不要直接执行 git 或 gh 命令。
- `scripts/start.sh` finalizer 负责创建 `auto-dev/issue-N` 分支和 PR，并把 `pr_opened`、`pr_url` 写回 status JSON 后推送。

## 状态与可观测性

每次状态变化必须保持三路一致：

1. `.auto-dev/status/issue-N.json`
2. GitHub Issue sticky status comment
3. 飞书群消息

网站 `/status` 是总览页，依次尝试读取：

1. main 分支 `.auto-dev/status/issue-N.json`
2. `auto-dev/issue-N` 分支 `.auto-dev/status/issue-N.json`
3. Issue sticky status comment

因此 PR 打开但未合并时，`/status` 仍应能看到 PR 分支上的最新状态。

## 动画开发约定

- 文件 slug 使用小写短横线或小写单词，避免中文文件名。
- 算法步骤数据结构应足够驱动单步、回退、自动播放和说明面板。
- 可视化应展示“当前步骤做了什么”和“关键数据结构如何变化”。
- 控件数量宁少勿滥；按钮必须对应真实能力，不能为了“看起来完整”添加无功能或重复功能的按钮。
- 不要新增后端服务、数据库或持久化依赖。
- 不要引入新的大型 UI 库，除非需求无法用现有栈实现。
- 不要删除或重构 PageRank 范例，除非是必要且低风险的兼容性修改。

## Git 和 PR 约定

- 自动开发分支名：`auto-dev/issue-${ISSUE_NUMBER}`。
- PR 标题：`Auto-dev: ${ISSUE_TITLE}`。
- PR body 至少包含 `Closes #${ISSUE_NUMBER}`。
- status JSON、PRD、QA report、代码变更都应进入 PR。
- 不要使用 `git reset --hard`、`git checkout --` 等破坏性命令。
- 如果没有实际代码变更，不要创建空 PR，状态改为 `aborted` 并说明原因。

## 常见回退判断

- PRD 缺算法边界、输入规模或验收定义：回调 PM。
- 算法步骤数据不足以驱动动画：frontend 回调 algorithm。
- 算法不变量失败、边界输入失败：QA 回调 algorithm。
- 构建失败、路由缺失、交互控件缺失、无用/冗余按钮、死按钮、文案行为不一致、播放控制 bug、视觉验收失败：QA 回调 frontend。
- 同一方向回调达到 3 次：停止，状态进入 `aborted`，飞书通知维护者介入。
