# PRD: 普里姆（Prim）最小生成树算法可视化

## 算法定义

Prim 算法是一种贪心算法，用于在连通加权无向图中求最小生成树（MST）。算法从任意起始节点出发，每一步选择连接 MST 集合与非 MST 集合的最小权重边，将对应节点加入 MST，直到所有节点都被包含。

### 核心步骤

1. 初始化：选择起始节点，将其加入 MST 集合。
2. 维护一个候选边集合（或 key 数组），记录每个非 MST 节点到 MST 集合的最小连接边权重。
3. 每步选出 key 值最小的非 MST 节点，将其连同对应边加入 MST。
4. 用新加入节点的邻接边更新候选边集合（松弛操作）。
5. 重复直到所有节点加入 MST 或候选边集合为空（图不连通时提前终止）。

### 算法边界

- 输入：连通加权无向图（邻接表表示），起始节点。
- 输出：MST 的边集合和总权重。
- 不连通图：算法终止时若 MST 节点数 < 总节点数，说明图不连通，仅生成部分 MST。
- 自环和重边：忽略自环；多条边取最小权重。

## 输入规模与示例数据

默认示例图（6 节点、10 条边，参考 OI Wiki 风格的无向加权图）：

```
     4
 A ------ B
 |\     / |
 | 2  1  7 |
 |  \ /   |
 8   C   5
 |  / \   |
 | 10  8  |
 | /   \  |
 E ------ D
     3
```

邻接表：
```js
{
  A: { B: 4, C: 2 },
  B: { A: 4, C: 1, D: 5, F: 7 },
  C: { A: 2, B: 1, D: 8, E: 10 },
  D: { B: 5, C: 8, F: 2 },
  E: { C: 10, F: 3 },
  F: { B: 7, D: 2, E: 3 },
}
```

起始节点：A

预期 MST 边（按 Prim 选择顺序）：
- A-C (2)
- C-B (1)
- B-D (5)
- D-F (2)
- F-E (3)

MST 总权重：13

## 可视化步骤

每一步生成一个 step 对象，包含以下字段驱动动画：

| 字段 | 类型 | 说明 |
|------|------|------|
| `step` | number | 步骤编号 |
| `currentNode` | string | 本步加入 MST 的节点 |
| `addedEdge` | [string, string] \| null | 本步加入 MST 的边（首步为 null） |
| `mstNodes` | string[] | 已加入 MST 的节点集合 |
| `mstEdges` | Array<[string, string]> | 已加入 MST 的边集合 |
| `key` | Record<string, number> | 每个非 MST 节点到 MST 的最小边权重（Infinity 表示不可达） |
| `parent` | Record<string, string \| null> | 每个节点在 MST 中的父节点 |
| `candidates` | Array<{node, weight, from}> | 当前候选边列表，用于展示优先队列状态 |
| `description` | string | 本步操作的文字说明 |

### 步骤流程

1. **初始化**：选择 A，mstNodes=[A]，更新 key（A 的邻居 B=4, C=2）。
2. **选择最小 key**：C（key=2），加入 MST，边 A-C。
3. **松弛**：用 C 的邻接边更新 key（B: min(4,1)=1, D: min(∞,8)=8, E: min(∞,10)=10）。
4. **选择最小 key**：B（key=1），加入 MST，边 C-B。
5. **松弛**：用 B 的邻接边更新 key（D: min(8,5)=5, F: min(∞,7)=7）。
6. **选择最小 key**：D（key=5），加入 MST，边 B-D。
7. **松弛**：用 D 的邻接边更新 key（F: min(7,2)=2）。
8. **选择最小 key**：F（key=2），加入 MST，边 D-F。
9. **松弛**：用 F 的邻接边更新 key（E: min(10,3)=3）。
10. **选择最小 key**：E（key=3），加入 MST，边 F-E。
11. **结束**：所有节点加入 MST，总权重 13。

## 交互控件

复用 Dijkstra/PageRank 的播放控制模式：

- **播放/暂停**：自动逐步推进，间隔 1600ms。
- **下一步**：单步前进。
- **重置**：回到初始状态。
- 不需要"上一步"按钮（与 Dijkstra 保持一致）。

## 可视化面板布局

参考 Dijkstra 的双栏布局（左侧图、右侧信息面板）：

### 左栏：图可视化（SVG）

- 无向加权图，边显示权重。
- 节点状态：default（白色）、current（靛蓝色，本步加入 MST）、mst（绿色，已加入 MST）。
- 边状态：default（灰色）、added（靛蓝色，本步加入 MST 的边，带闪烁动画）、mst（绿色，已在 MST 中）。
- 节点圆圈内显示节点名，下方显示 key 值。

### 右栏：信息面板

1. **当前操作**：本步 description 文字。
2. **Key 表**：每个节点的 key 值和 parent，用颜色区分 MST/当前/候选状态。
3. **MST 边列表**：已选中的 MST 边及其权重，累计总权重。
4. **读图方式**：说明颜色含义。

## 复杂度说明

- 时间复杂度：O(V²)，使用简单数组实现（适合小规模图的可视化）。
- 空间复杂度：O(V + E)。
- 步骤数：约 2V 步（每节点选择 + 松弛），默认图约 11 步。

## 文件结构

建议 slug：`prim-mst`

```
src/animations/prim-mst/
  algorithm.js   # 纯算法模块：computeSteps, runAlgorithmTests, DEFAULT_GRAPH
  index.jsx      # React 可视化组件
  meta.js        # 元数据：title, description, path, category="graph"
```

## 验收清单

### 算法正确性

- [ ] 默认图的 MST 边集合为 {A-C, C-B, B-D, D-F, F-E}，总权重 13。
- [ ] 每步 key 值更新逻辑正确（松弛操作）。
- [ ] 不连通图场景：算法提前终止，MST 不完整。
- [ ] 单节点图：1 步完成，MST 为空。
- [ ] `runAlgorithmTests()` 通过 Node ESM import 自检。

### 可视化正确性

- [ ] 图的节点和边正确渲染，边权重可见。
- [ ] 节点颜色正确区分：default / current / mst。
- [ ] 边颜色正确区分：default / added（闪烁）/ mst。
- [ ] Key 表实时更新，数值与算法步骤一致。
- [ ] MST 边列表逐步增长，总权重正确。

### 交互与控件

- [ ] 播放/暂停按钮工作正常，自动播放间隔 ~1600ms。
- [ ] 单步前进按钮工作正常。
- [ ] 重置按钮回到初始状态。
- [ ] 到达最后一步后自动停止播放。
- [ ] 无无用、重复或死按钮。

### 布局与样式

- [ ] 卡片内容区域保留顶部留白（`p-4` 或 `p-5`），不使用 `pt-0`。
- [ ] 响应式布局：左右栏在桌面端并列，移动端堆叠。
- [ ] 复用 `src/components/ui/card.jsx` 和 `src/components/ui/button.jsx`。
- [ ] `npm run build` 通过。

### 自动发现

- [ ] `meta.js` 导出 `category = "graph"`。
- [ ] 不修改 `src/App.jsx`，由 Vite `import.meta.glob` 自动发现。
