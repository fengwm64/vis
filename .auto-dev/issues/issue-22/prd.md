# PRD: Issue #22 - PageRank 有向边箭头不可见

## 问题概述

PageRank 过程动画中，有向边的箭头被节点遮挡，用户无法看到箭头。这是 issue #19 / PR #21 的继续修复。

## 继续修复来源

- 原 Issue: #19
- 原 PR: #21 (https://github.com/fengwm64/vis/pull/21)

### 上次修复失败原因假设

PR #21 将箭头偏移量设为固定值 39px（`ex = end.x - ux * 39`），但节点半径随 PageRank 动态变化：`radius = 30 + 34 * (rank / maxRank)`，最大可达 64px。固定 39px 偏移在节点变大时完全被覆盖。此外 SVG 渲染顺序是先画边再画节点，节点圆圈覆盖了箭头。

## 目标动画

- ID: pagerank
- 标题: PageRank 过程动画
- 路径: /animations/pagerank
- 文件: `src/animations/pagerank_process_animation.jsx`

## 问题类型

visual

## 修改范围

仅修改 `src/animations/pagerank_process_animation.jsx` 中的 `Arrow` 组件和 SVG 渲染顺序。

## 根因分析

1. **箭头偏移量固定但节点半径动态变化**: `Arrow` 组件的 `ex/ey` 使用固定偏移 39px，但节点半径范围是 30-64px，导致箭头被大节点覆盖。
2. **SVG 渲染顺序**: `<svg>` 中 edges 先于 nodes 渲染（第 202-239 行），节点绘制在箭头上方。

## 修复方案

1. **动态箭头偏移**: `Arrow` 组件需要接收目标节点的当前半径，将箭头终点偏移量改为 `radius + headLength/2 + margin`（建议 margin ≥ 4px），确保箭头始终在节点边缘之外。
2. **SVG 渲染顺序调整**: 将 edges 的渲染移到 nodes 之后，或使用 SVG `<defs>` + `<marker>` 方案，让箭头始终在最上层。推荐后者，因为 SVG marker 是标准做法且不需要改渲染顺序。

### 推荐实现: SVG marker 方案

- 在 `<svg>` 中添加 `<defs>` 定义 `<marker>`，包含箭头多边形。
- `Arrow` 组件改用 `<line marker-end="url(#arrowhead)">` 或 `<path>`。
- 箭头终点计算为 `end - ux * (radius + margin)`，需要知道目标节点当前半径。
- 传入方式：`Arrow` 组件增加 `targetRadius` prop，从父组件的 `radius` 计算传入。

## 输入规模和示例数据

固定 5 节点、8 条有向边的图。节点位置和边在文件顶部定义，不需要外部输入。

## 复杂度说明

纯前端视觉修复，无算法逻辑变更。

## 验收清单

1. 箭头在所有迭代轮次中均可见，不被任何节点遮挡。
2. 当节点因 PageRank 增大而半径变大时，箭头仍然可见且位置正确。
3. 播放/暂停/单步/重置时箭头始终正常显示。
4. 活跃边（indigo 色）和非活跃边（灰色）的箭头都可见。
5. 动画小圆点（活跃边上的移动点）不受影响。
6. 构建通过 (`npm run build`)。
