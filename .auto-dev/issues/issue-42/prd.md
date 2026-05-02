# PRD: DFS 遍历算法可视化

## 需求来源

Issue #42 — 用户通过 /submit 表单提交，要求实现 DFS（深度优先搜索）算法可视化。

## 算法定义

深度优先搜索（DFS）是一种用于遍历或搜索图/树的算法。从起始节点出发，沿着一条路径尽可能深地探索，直到无法继续时回溯，再探索下一条未访问的路径。

### 算法步骤（基于显式栈的迭代实现）

1. 初始化：将起始节点压入栈，标记为已访问。
2. 循环：弹出栈顶节点作为当前节点。
3. 对当前节点的每个邻居：
   - 如果邻居未访问，压入栈并标记已访问，记录树边。
   - 如果邻居已在栈中，记录回边（非树边）。
4. 重复直到栈为空。

### 算法边界

- 图为无向连通图，节点用单字母标识（A-H）。
- 邻接表表示，每条边权重可选（DFS 不使用权重，但保留以兼容图数据结构）。
- 起始节点默认为 A。
- 遍历模式：完整遍历（遍历所有可达节点）。
- 时间复杂度 O(V + E)，空间复杂度 O(V)。

## 输入规模与示例数据

默认图包含 7 个节点、10 条边，足以展示 DFS 的深度优先特性和回溯行为：

```
A -- B -- E
|    |    |
C -- D -- F
     |
     G
```

邻接表：
```js
{
  A: { B: 1, C: 1 },
  B: { A: 1, D: 1, E: 1 },
  C: { A: 1, D: 1 },
  D: { B: 1, C: 1, F: 1, G: 1 },
  E: { B: 1, F: 1 },
  F: { D: 1, E: 1 },
  G: { D: 1 }
}
```

## 可视化步骤

每一步包含以下信息：

| 字段 | 说明 |
|------|------|
| `step` | 步骤编号 |
| `stack` | 当前栈内容（从底到顶） |
| `currentNode` | 当前正在探索的节点 |
| `visited` | 已访问节点集合 |
| `traversalOrder` | DFS 遍历序列（访问顺序） |
| `treeEdges` | 生成树的边 `[[u, v], ...]` |
| `backEdges` | 回边 `[[u, v], ...]` |
| `lastEdge` | 本步涉及的边 `[u, v]` 或 null |
| `phase` | `'explore'`（探索）或 `'backtrack'`（回溯） |
| `description` | 本步的人类可读说明 |

### 典型步骤序列

1. 初始化：压入 A，visited = {A}
2. 弹出 A，探索邻居 B → 压入 B，treeEdge A-B
3. 弹出 B，探索邻居 D → 压入 D，treeEdge B-D
4. 弹出 D，探索邻居 C → 压入 C，treeEdge D-C
5. C 的邻居均已访问，回溯
6. 弹出 D，探索邻居 F → 压入 F，treeEdge D-F
7. ...继续直到栈为空

## 交互控件

- **Play / Pause**：自动播放 / 暂停。
- **Step Forward**：单步前进。
- **Reset**：回到第 0 步。
- 步骤说明面板：显示当前步骤描述。
- 栈状态面板：可视化栈的内容。
- 遍历结果面板：显示遍历序列和生成树边。

## 文件结构

- slug：`dfs`
- 目录：`src/animations/dfs/`
- 文件：
  - `algorithm.js` — 纯计算模块，导出 `DEFAULT_GRAPH`、`DEFAULT_START`、`computeSteps(graph, start)`、`runAlgorithmTests()`
  - `index.jsx` — React 动画组件，复用 Card/Button/Framer Motion
  - `meta.js` — 元数据：`title`、`description`、`path`、`category='graph'`、`order=30`

## 复杂度说明

- 算法时间复杂度：O(V + E)
- 算法空间复杂度：O(V)
- 步骤数上限：O(V + E)，对默认 7 节点图约 20-30 步

## 验收清单

1. **构建**：`npm run build` 通过，无编译错误。
2. **算法自检**：`node --input-type=module -e "import('./src/animations/dfs/algorithm.js').then(m => m.runAlgorithmTests())"` 通过。
3. **自动发现**：首页自动出现 DFS 卡片（category=graph 分组），路由 `/animations/dfs` 可访问。
4. **可视化正确性**：
   - 起始节点 A 被正确标记和压栈。
   - 每一步栈内容、visited 集合、traversalOrder 与算法逻辑一致。
   - 树边覆盖所有可达节点。
   - 回边在遇到已访问邻居时正确记录。
   - 最终步骤显示完整遍历序列。
5. **交互控件**：
   - Play/Pause 按钮可切换状态，自动播放间隔约 1.6 秒。
   - Step Forward 在最后一步时不再前进。
   - Reset 回到第 0 步，播放状态重置。
   - 无死按钮、无重复按钮、无占位按钮。
6. **布局留白**：卡片内容区域有正常顶部 padding（p-4/p-5/p-6），无 `pt-0`。
7. **响应式**：两栏布局在 lg 断点以上生效，移动端单栏堆叠。
