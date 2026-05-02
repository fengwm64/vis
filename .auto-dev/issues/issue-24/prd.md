# PRD: Issue #24 - PageRank 箭头线条多出一截

## 问题概述

PageRank 过程动画中，有向边的箭头线条延伸进节点内部，视觉上"多出一截"。这是 issue #22 / PR #23 的继续修复。

## 继续修复来源

- 原 Issue: #22
- 原 PR: #23 (https://github.com/fengwm64/vis/pull/23)

### 上次修复失败原因假设

PR #23 的 `Arrow` 组件（`src/animations/pagerank_process_animation.jsx` 第 90-135 行）存在两个问题：

1. **箭头多边形越界**: 箭头多边形定义为 `"0,-5 10,0 0,5"`，其尖端从 transform 原点沿方向向量延伸 10 个单位。当前 `ex/ey` 既是线段终点又是箭头位置，箭头尖端实际到达 `end - ux * (39 - 10)` = `end - ux * 29`，即穿透节点约 29-30px（节点半径 30-64px），造成"戳进节点"的视觉。
2. **偏移量仍为硬编码值**: `sx` 使用 `+35`、`ex` 使用 `-39`，都是固定值。PR #23 的 QA 报告提到"动态偏移 `targetRadius + 6`"，但当前代码并未实现——仍然是 `end.x - ux * 39`。当节点因 PageRank 增大时（半径可达 64px），39px 偏移完全不够。

### 本次回归验证步骤

QA 必须重点验证：
1. 箭头尖端不穿透任何节点的圆形边界。
2. 在 PageRank 最大节点（半径约 64px）上，箭头末端仍然可见且不被节点覆盖。
3. 播放/暂停/单步/重置各状态下箭头均正常。

## 目标动画

- ID: pagerank
- 标题: PageRank 过程动画
- 路径: /animations/pagerank
- 文件: `src/animations/pagerank_process_animation.jsx`

## 问题类型

visual

## 修改范围

仅修改 `src/animations/pagerank_process_animation.jsx` 中的 `Arrow` 组件和其调用处。

## 根因分析

`Arrow` 组件（第 90-135 行）：

```
// 当前代码
const sx = start.x + ux * 35;   // 固定偏移
const sy = start.y + uy * 35;
const ex = end.x - ux * 39;     // 固定偏移
const ey = end.y - uy * 39;
```

箭头多边形 `"0,-5 10,0 0,5"` 在 `(ex, ey)` 处沿 `angle` 方向放置，尖端从 `(ex, ey)` 向目标节点方向延伸 10px。因此：
- 线段终点在 `end - 39px`
- 箭头尖端在 `end - 39px + 10px` = `end - 29px`
- 节点半径范围 30-64px
- → 箭头尖端穿透节点 1-35px

## 修复方案

1. **Arrow 组件增加 `sourceRadius` 和 `targetRadius` props**，从父组件的动态半径 `30 + 34 * (rank / maxRank)` 传入。

2. **动态计算偏移量**：
   ```
   const sx = start.x + ux * (sourceRadius + 4);
   const sy = start.y + uy * (sourceRadius + 4);
   const ex = end.x - ux * (targetRadius + 10 + 4);
   const ey = end.y - uy * (targetRadius + 10 + 4);
   ```
   其中 `10` 是箭头多边形长度，`4` 是安全间距。

3. **调用处传入半径**: 在 `edges.map` 中为每条边计算源节点和目标节点的当前半径。

## 输入规模和示例数据

固定 5 节点、8 条有向边的图。节点位置和边在文件顶部定义，不需要外部输入。

## 复杂度说明

纯前端视觉修复，无算法逻辑变更。

## 验收清单

1. 箭头尖端不穿透任何节点的圆形边界（重点验证最大半径节点）。
2. 线段起点紧贴源节点边缘外侧，不穿透源节点。
3. 箭头在所有迭代轮次中均可见，不被任何节点遮挡。
4. 当节点因 PageRank 增大而半径变大时，箭头仍然可见且位置正确。
5. 播放/暂停/单步/重置时箭头始终正常显示。
6. 活跃边（indigo 色）和非活跃边（灰色）的箭头都可见。
7. 动画小圆点（活跃边上的移动点）不受影响。
8. 构建通过 (`npm run build`)。

## 建议前端实现要点

- `Arrow` 组件签名改为 `Arrow({ from, to, active, sourceRadius, targetRadius })`。
- 父组件在 `edges.map` 中为每条边动态计算 `sourceRadius` 和 `targetRadius`：`30 + 34 * (current.rank[nodeId] / maxRank)`。
- 偏移量公式：`sourceRadius + 4`（起点）和 `targetRadius + 14`（终点，含箭头长度 10 + 间距 4）。
- 不修改算法逻辑、不新增文件、不修改路由。
