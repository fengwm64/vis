# QA Report: Issue #24 - PageRank 箭头线条多出一截

## 构建结果

- `npm run build` ✅ 通过（2.15s，409 modules）

## 算法测试结果

- 纯视觉修复，无算法变更。`computeIterations` 和 `runPageRankTests` 未修改，算法正确性通过代码审查确认 ✅

## PRD 验收清单

| # | 验收项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | 箭头尖端不穿透任何节点的圆形边界 | ✅ | `ex = end.x - ux * (targetRadius + 14)`，箭头多边形尖端延伸 10px，到达 `targetRadius + 4` 处，节点边界在 `targetRadius`，间距 4px。最大半径 64px 时尖端在 68px，不穿透。 |
| 2 | 线段起点紧贴源节点边缘外侧 | ✅ | `sx = start.x + ux * (sourceRadius + 4)`，起点在源节点边界外 4px。 |
| 3 | 箭头在所有迭代轮次中均可见，不被节点遮挡 | ✅ | SVG 中 edges 先于 nodes 渲染，箭头尖端在节点边界外 4px，不被遮挡。 |
| 4 | 节点半径增大时箭头位置正确 | ✅ | 动态半径 `30 + 34 * (rank / maxRank)`（30-64px），偏移量随半径动态计算。 |
| 5 | 播放/暂停/单步/重置时箭头正常 | ✅ | 箭头通过 `current.rank` 驱动，`round` 状态变化时自动更新。 |
| 6 | 活跃边和非活跃边箭头均可见 | ✅ | 活跃: indigo-600, opacity 0.95; 非活跃: #a8a8a8, opacity 0.55。 |
| 7 | 动画小圆点不受影响 | ✅ | `motion.circle` 使用相同的 sx/sy/ex/ey 坐标，偏移量计算已更新。 |
| 8 | 构建通过 | ✅ | `npm run build` 成功。 |

## UI 控件审计

| 控件 | 用途 | 结果 |
|------|------|------|
| 播放/暂停按钮 | 切换 `playing` 状态 | ✅ 文案和图标随状态变化 |
| "下一轮"按钮 | 递增 round（有上限） | ✅ `Math.min(history.length - 1, value + 1)` |
| "重置"按钮 | round 归零，停止播放 | ✅ `setRound(0); setPlaying(false)` |

- 无用按钮：无 ✅
- 重复按钮：无 ✅
- 死按钮：无 ✅
- 文案行为一致性：所有按钮文案与行为匹配 ✅
- 禁用态：无永久禁用按钮 ✅

## 交互 Bug 审计

| 项目 | 结果 | 说明 |
|------|------|------|
| 播放/暂停 | ✅ | `setPlaying(v => !v)` 正确切换 |
| 单步前进 | ✅ | 到达最后一步后不再前进 |
| 重置 | ✅ | 回到第 0 轮并停止播放 |
| 自动播放定时器 | ✅ | 1400ms interval，useEffect 清理函数正确清除 |
| 定时器泄漏 | ✅ | 组件卸载时 `window.clearInterval(timer)` |
| 边界步骤 | ✅ | 第 0 步无后退操作，最后一步自动回到第 0 步 |
| 路由 | ✅ | 未修改路由，auto-fix 仅改现有文件 |
| 响应式布局 | ✅ | `lg:grid-cols-[1.35fr_1fr]` 响应式网格 |

## 卡片布局留白审计

| 卡片 | className | 结果 |
|------|-----------|------|
| 有向链接图 | `p-4 !pt-4` | ✅ 顶部有留白 |
| 迭代公式 | `p-5 !pt-5` | ✅ 顶部有留白 |
| 当前排名 | `p-5 !pt-5` | ✅ 顶部有留白 |
| 读图方式 | `p-5 !pt-5` | ✅ 顶部有留白 |

- 无 `pt-0` 问题 ✅

## 代码变更审查

变更文件：`src/animations/pagerank_process_animation.jsx`

变更内容：
1. **Arrow 组件签名**（第 90 行）：新增 `sourceRadius` 和 `targetRadius` props，默认值 30。
2. **动态偏移量**（第 98-101 行）：`sourceRadius + 4`（起点）和 `targetRadius + 14`（终点，含箭头长度 10 + 间距 4）。
3. **父组件传入半径**（第 203-204 行）：在 `edges.map` 中为每条边动态计算源和目标节点的当前半径。
4. **Arrow 调用处**（第 210-211 行）：传入 `sourceRadius` 和 `targetRadius`。

修复正确实现了 PRD 方案，无多余变更。

## 结论

所有验收项通过，无 UI/交互缺陷。QA 通过。
