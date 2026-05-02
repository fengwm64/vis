# Auto Dev Team Charter

你在 `fengwm64/vis` React + Vite SPA 仓库内工作。所有 LLM 调用必须由 Claude Code 当前进程完成；不要直接调用 OpenAI、Anthropic 或 MiMo SDK/API。

每个 agent 开始工作或从其他 agent 接手时，都必须先读取：

- `.claude/context/team-charter.md`：协作协议、状态机、handoff、防死循环。
- `.claude/context/auto-dev-context.md`：项目背景、功能开发流程、文件契约、运行环境。

## 团队成员

| agent | 中文名 | 职责边界 |
| --- | --- | --- |
| `pm` | 产品经理 | 需求评估、PRD、拒绝不可行需求、补充澄清 |
| `algorithm` | 算法工程师 | 纯算法实现、自检用例、为前端暴露稳定 API |
| `frontend` | 前端可视化专家 | React/Framer Motion 可视化、路由接入、构建通过 |
| `qa` | 测试 + Reviewer | 构建、算法单测、验收清单、UI/交互审计、缺陷回调 |

没有中央 orchestrator agent。`scripts/start.sh` 是 shell supervisor，会根据 status JSON 的 `current_owner` 逐个启动 PM / algorithm / frontend / QA；agent 自己不要在 GitHub Actions 中使用 Task 拉起下一位。新算法开发由 `auto-dev` label / workflow 触发，现有动画修复由 `auto-fix` label / workflow 触发，两者通过 `AUTO_PIPELINE` 区分。

## 状态协议

每次阶段开始、阶段完成、handoff、回退、失败前必须更新三路状态：

1. 调 `bash scripts/update-status.sh ...` 更新 `.auto-dev/status/issue-${ISSUE_NUMBER}.json` 和 Issue sticky comment。
2. 调 `bash scripts/feishu.sh status ...` 或 `bash scripts/feishu.sh handoff ...` 发飞书消息。
3. 只有完成前两步后才能退出当前角色；下一位由 `scripts/start.sh` supervisor 根据 status JSON 启动。

Handoff 消息必须包含 issue 编号、状态文件路径、交付物路径、缺陷或交付摘要。不要只口头说“已交给下一位”，必须真实更新 status JSON 的 `current_owner`。

示例：

```bash
bash scripts/update-status.sh --stage algorithm_done --owner frontend --from algorithm --to frontend --artifact src/animations/example/algorithm.js --message "Algorithm API is ready."
bash scripts/feishu.sh handoff 算法工程师 前端可视化专家 src/animations/example/algorithm.js "  - API: computeSteps(input)\n  - Tests: runAlgorithmTests()"
```

## 状态机

允许的主路径：

`submitted -> pm_triage -> pm_drafting_prd -> prd_done -> algorithm_designing -> algorithm_coding -> algorithm_testing -> algorithm_done -> frontend_designing -> frontend_coding -> frontend_done -> qa_running -> qa_passed -> pr_opened`

`qa_passed -> pr_opened` 由 `scripts/start.sh` finalizer 在 Claude 进程退出后完成，不由 QA agent 直接执行 git 或 gh 命令。

终止路径：

`pm_triage -> rejected`

`qa_running -> aborted`

回退路径：

`qa_running -> qa_returned_to_algorithm -> algorithm_coding`

`qa_running -> qa_returned_to_frontend -> frontend_coding`

`frontend_coding -> algorithm_coding`，仅当算法 API 不足。

`algorithm_*` 或 `frontend_* -> pm_drafting_prd`，仅当 PRD 缺关键约束。

## 防死循环

回调前读取 `.auto-dev/status/issue-${ISSUE_NUMBER}.json` 的 `retry_count`。同一方向回调达到 3 次后禁止继续回调，改为：

```bash
bash scripts/update-status.sh --stage aborted --owner qa --from qa --to maintainer --message "Retry limit exceeded."
bash scripts/feishu.sh status aborted "超过回调重试上限，需要维护者介入。"
```

发生回调时给 `update-status.sh` 加 `--bump-retry`，例如：

```bash
bash scripts/update-status.sh --stage qa_returned_to_frontend --owner frontend --from qa --to frontend --bump-retry --message "UI acceptance failed."
```

## 工程约束

新增动画遵循现有结构：

- 算法纯函数放在 `src/animations/<slug>/algorithm.js`，零 DOM 依赖，导出计算函数和测试函数。
- 动画组件放在 `src/animations/<slug>/index.jsx`，元数据放在 `src/animations/<slug>/meta.js`；复用 `src/components/ui/button.jsx`、`src/components/ui/card.jsx`、Framer Motion 和 `pagerank_process_animation.jsx` 的播放控制模式。
- 不要为了新增动画修改 `src/App.jsx`；应用会通过 Vite `import.meta.glob` 自动发现动画目录，避免多个自动开发 PR 冲突。
- 卡片内容和 footer 必须保留顶部留白；不要在算法可视化页使用 `pt-0` 或 `padding-top: 0`，这类布局问题必须在 QA 阶段拦截。
- 运行 `npm run build`，算法自检使用 Node ESM import。
- QA 必须检查无用按钮、重复按钮、死按钮、文案行为不一致、播放控制边界 bug 和自动播放定时器泄漏；发现问题时回调 frontend。

不要改动无关文件，不要删除用户已有改动，不要使用破坏性 git 命令。
