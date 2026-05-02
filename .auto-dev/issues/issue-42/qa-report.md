# QA Report: Issue #42 — DFS 遍历算法可视化

## 构建结果

- `npm run build` 通过，无编译错误。
- 输出：421 modules transformed，dist/index.html + CSS + JS 生成成功。

## 算法自检结果

- `node --input-type=module -e "const m = await import('./src/animations/dfs/algorithm.js'); m.runAlgorithmTests();"` 通过。
- 默认 7 节点图生成 20 步，遍历序列 A→C→D→G→F→E→B，6 条树边覆盖全部节点，2 条回边 (D-B, E-B)。
- 单节点图、线性图、非连通图、无回边树图测试均通过。

## PRD 验收清单

| # | 验收项 | 结果 |
|---|--------|------|
| 1 | 构建通过 | ✅ |
| 2 | 算法自检通过 | ✅ |
| 3 | 自动发现：首页 graph 分组、路由 /animations/dfs | ✅ meta.js category='graph', path='/animations/dfs'，App.jsx import.meta.glob 自动注册 |
| 4 | 可视化正确性 | ✅ 起始节点 A 压栈正确；每步栈/visited/traversalOrder 与算法一致；树边覆盖 7 节点；回边在遇已访问邻居时记录；最终步骤显示完整序列 |
| 5 | 交互控件 | ✅ Play/Pause 可切换（最后一步禁用）；Step Forward 最后一步禁用；Reset 回到第 0 步并停止播放；无死/重复/占位按钮 |
| 6 | 布局留白 | ✅ 所有 CardContent 使用 p-4 或 p-5，无 pt-0 |
| 7 | 响应式 | ✅ lg:grid-cols-[1.35fr_1fr] 两栏，移动端单栏堆叠 |

## UI 控件审计

- **Play/Pause 按钮**：文案随 playing 状态切换（"▶ 播放" ↔ "⏸ 暂停"），语义一致。最后一步且未播放时 disabled，合理。
- **Step Forward 按钮**：最后一步 disabled，防止越界。文案 "⏭ 前进" 与行为一致。
- **Reset 按钮**：始终可用，点击后 currentStep=0、playing=false，行为正确。
- **无用/重复/死按钮**：未发现。三个控件功能清晰不重复。

## 交互 Bug 审计

- **播放/暂停**：切换正常，自动播放间隔 1600ms（PRD 要求约 1.6s），到末尾自动停止。
- **单步前进**：每步 +1，最后一步不再前进。
- **回退**：无回退按钮（PRD 未要求），合理。
- **重置**：回到第 0 步，播放状态清除。
- **边界步骤**：第 0 步 Step Forward 可用（前进到 #1），最后一步 disabled。
- **自动播放定时器**：useEffect 依赖 [playing, steps.length]，playing=false 时 return undefined，playing=true 时设置 interval 并在 cleanup 中 clearInterval，无泄漏。
- **路由**：/animations/dfs 由 AnimationLayout 包裹，带返回首页链接和标题。
- **响应式**：移动端单栏堆叠，桌面端两栏，控件 flex-wrap 适配窄屏。

## 卡片布局留白审计

- 图结构 Card：`CardContent className="p-4"` — 正常。
- 当前步骤 Card：`CardContent className="p-5"` — 正常。
- 栈 Card：`CardContent className="p-5"` — 正常。
- 遍历结果 Card：`CardContent className="p-5"` — 正常。
- 读图方式 Card：`CardContent className="p-5"` — 正常。
- 无 `pt-0`、`!pt-0` 或 `padding-top: 0`。

## 发现的问题

### 问题 1：回边虚线样式可能未生效（minor）

- **位置**：`src/animations/dfs/index.jsx:49`，`getEdgeClass` 函数。
- **现象**：回边使用 `stroke-dasharray-[6 4]` 类名，Tailwind v3 可能无法将此生成为 `stroke-dasharray: 6 4` CSS 属性。回边将显示为实线而非虚线。
- **建议修复**：改为 Tailwind 的任意属性语法 `[stroke-dasharray:6_4]` 或使用 inline style。
- **影响**：仅影响回边视觉样式（虚线 vs 实线），不影响算法正确性或功能。
- **归属**：frontend。

## 结论

所有 PRD 验收项通过。发现 1 个 minor 视觉问题（回边虚线样式），不影响功能正确性和用户体验核心路径。QA 通过。
