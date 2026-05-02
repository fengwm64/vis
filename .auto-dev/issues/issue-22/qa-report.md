# QA Report: Issue #22 - PageRank 有向边箭头不可见（继续修复）

## 构建结果

**PASS** - `npm run build` 成功，无错误。

## 算法测试结果

**N/A** - 本次为纯视觉修复（auto-fix），无算法逻辑变更，无需运行算法自检。

## PRD 验收清单

| # | 验收项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | 箭头在所有迭代轮次中均可见，不被任何节点遮挡 | PASS | SVG 渲染顺序已调整：edges 在 nodes 之后渲染，箭头始终绘制在节点上方 |
| 2 | 节点因 PageRank 增大而半径变大时，箭头仍然可见且位置正确 | PASS | Arrow 组件使用动态偏移 `targetRadius + 6`，不再使用固定 39px；targetRadius 从 `30 + 34 * (targetRank / maxRank)` 动态计算 |
| 3 | 播放/暂停/单步/重置时箭头始终正常显示 | PASS | 播放/暂停/单步/重置控件均正常，箭头随 round 更新 |
| 4 | 活跃边（indigo 色）和非活跃边（灰色）的箭头都可见 | PASS | 活跃边使用 `text-indigo-600`，非活跃边使用 `#a8a8a8`，polygon fill 与 line stroke 一致 |
| 5 | 动画小圆点（活跃边上的移动点）不受影响 | PASS | motion.circle 仍在 Arrow 组件的 active 分支中渲染，动画行为未变 |
| 6 | 构建通过 (`npm run build`) | PASS | 见上方构建结果 |

## UI 控件审计

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 无用按钮 | PASS | 无多余按钮 |
| 重复按钮 | PASS | 播放/暂停（合并为一个 toggle）、下一轮、重置，三个按钮功能互不重复 |
| 死按钮 | PASS | 所有按钮均可触发可见状态变化 |
| 文案行为不一致 | PASS | "播放"→开始自动轮播，"暂停"→停止，"下一轮"→+1 round，"重置"→回到 round 0 并停止播放 |
| 禁用态 | PASS | 无永久禁用按钮 |

## 交互 bug 审计

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 播放/暂停 | PASS | toggle 逻辑正确，interval 1400ms，到末尾自动回 0 |
| 单步 | PASS | "下一轮"在 round 12 时被 `Math.min(history.length - 1, ...)` 限制 |
| 回退 | N/A | 无上一步按钮（PRD 未要求） |
| 重置 | PASS | `setRound(0); setPlaying(false)` |
| 边界步骤 | PASS | round 0 无 delta 显示，round 12 为最大值 |
| 自动播放定时器 | PASS | useEffect 在 `playing=false` 或组件卸载时 `clearInterval` |
| 路由 | PASS | 本次为 auto-fix，未修改路由 |
| 响应式布局 | PASS | `grid gap-5 lg:grid-cols-[1.35fr_1fr]` 在移动端堆叠 |

## 卡片布局留白审计

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 有向链接图卡片 | PASS | `CardContent className="p-4 !pt-4"`，有顶部留白 |
| 迭代公式卡片 | PASS | `CardContent className="p-5 !pt-5"`，有顶部留白 |
| 当前排名卡片 | PASS | `CardContent className="p-5 !pt-5"`，有顶部留白 |
| 读图方式卡片 | PASS | `CardContent className="p-5 !pt-5"`，有顶部留白 |
| 无 `pt-0` 或 `padding-top: 0` | PASS | 未发现违规的顶部 padding 清零 |

## 变更摘要

`src/animations/pagerank_process_animation.jsx` 修改内容：
1. `Arrow` 组件新增 `targetRadius` prop，箭头偏移从固定 39px 改为动态 `targetRadius + 6`
2. SVG 渲染顺序调整：edges 移到 nodes 之后渲染，确保箭头绘制在节点上方
3. 父组件为每条边动态计算目标节点的当前半径并传入

## 结论

**QA PASS** - 所有验收项通过，无 UI/交互缺陷，无布局问题。
