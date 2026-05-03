# PRD: Tarjan 强连通分量可视化

## Issue

#52 — [auto-dev] Tarjan 强连通分量

## 算法定义

Tarjan 算法在一次 DFS 中找出有向图的所有强连通分量（SCC）。核心思想：维护一个栈和每个节点的 `dfn`（DFS 访问序号）与 `low`（通过后代和回边能到达的最小 dfn），当 `dfn[u] == low[u]` 时，栈中 u 及以上节点构成一个 SCC。

### 伪代码

```
index = 0
stack = empty
for each node v:
  if v not visited:
    DFS(v)

DFS(v):
  dfn[v] = low[v] = index++
  push v onto stack
  onStack[v] = true
  for each edge (v, w):
    if w not visited:
      DFS(w)
      low[v] = min(low[v], low[w])
    else if onStack[w]:
      low[v] = min(low[v], dfn[w])
  if dfn[v] == low[v]:
    // v is root of an SCC
    pop stack until v is popped → these nodes form one SCC
```

### 边界条件

- 空图（0 节点）：无 SCC，直接返回空结果。
- 单节点无边图：1 个 SCC（自身）。
- 单个大环：1 个 SCC 包含所有节点。
- DAG（无环有向图）：每个节点自成一个 SCC。
- 多个不连通分量：DFS 遍历所有未访问节点。

## 输入规模与示例数据

### 默认示例图（5 节点）

节点：A, B, C, D, E

有向边：
- A → B
- B → C
- C → A （形成 SCC: {A, B, C}）
- C → D
- D → E
- E → D （形成 SCC: {D, E}）

预期 SCC：`[{A, B, C}, {D, E}]`

### 可选附加图

提供 1-2 个额外示例供用户切换：
1. DAG：A→B, B→C, A→C → SCC: [{A}, {B}, {C}]
2. 大环：A→B→C→D→A → SCC: [{A, B, C, D}]

## 可视化步骤

### 数据结构展示

- **图**：有向图，节点显示标签。
- **状态标注**：每个节点旁显示 `dfn / low` 值（未访问时显示 `?`）。
- **栈**：右侧或下方显示当前栈内容，栈底在下、栈顶在上。
- **SCC 结果**：每发现一个 SCC，用相同颜色高亮该分量的节点。
- **说明面板**：当前步骤的文字说明。

### 步骤拆分（每步为动画的一帧）

1. **初始化**：显示完整有向图，所有节点为未访问状态（灰色），栈为空。
2. **选择起始节点**：高亮当前 DFS 根节点（如果图不连通，会在后续选择新的根）。
3. **访问节点 u**：设置 `dfn[u] = low[u] = index`，将 u 压栈，节点变为"在栈中"状态（蓝色）。
4. **遍历邻居 w（未访问）**：高亮边 u→w，递归进入 w。
5. **遍历邻居 w（已在栈中，回边）**：高亮回边 u→w，更新 `low[u] = min(low[u], dfn[w])`。
6. **递归返回**：从 w 回溯到 u，更新 `low[u] = min(low[u], low[w])`，高亮受影响的节点。
7. **发现 SCC 根**：当 `dfn[u] == low[u]` 时，从栈中弹出直到 u，弹出的节点用相同颜色标记为一个 SCC。
8. **重复**：直到所有节点都被访问。

### 交互控件

| 控件 | 说明 |
| --- | --- |
| Play / Pause | 自动播放/暂停动画 |
| Prev / Next | 单步前进/后退 |
| Reset | 回到初始状态 |
| Speed 调节 | 动画播放速度（可选，参考 PageRank） |

### 颜色方案（建议）

- 未访问：灰色
- 在栈中（正在探索）：蓝色
- 已确定 SCC：绿色/橙色/紫色等循环色（每个 SCC 一种颜色）
- 当前正在处理的节点：黄色高亮
- 当前正在遍历的边：红色高亮

## 复杂度说明

- 时间复杂度：O(V + E)，每个节点和每条边各访问一次。
- 空间复杂度：O(V)，用于 dfn、low 数组和栈。

## 验收清单

### 算法正确性

- [ ] 默认示例图（A→B→C→A, C→D→E→D）输出 SCC: [{A, B, C}, {D, E}]
- [ ] DAG 示例输出每个节点自成 SCC
- [ ] 单个大环示例输出一个 SCC 包含所有节点
- [ ] 空图返回空 SCC 列表
- [ ] `runAlgorithmTests()` 通过所有断言

### 可视化与交互

- [ ] 页面能正常渲染有向图，节点和边清晰可见
- [ ] 每个节点旁显示 `dfn / low` 值
- [ ] 栈的当前状态可见
- [ ] 每个 SCC 被发现时用统一颜色高亮
- [ ] Play / Pause 控制动画自动播放
- [ ] Prev / Next 单步前进后退
- [ ] Reset 回到初始状态
- [ ] 所有按钮有明确功能，无死按钮、无重复按钮、无占位按钮
- [ ] 卡片内容区域有正常顶部留白（不用 `pt-0`）

### 工程质量

- [ ] `npm run build` 通过
- [ ] `runAlgorithmTests()` 通过（Node ESM import）
- [ ] 动画目录自包含：`src/animations/tarjan-scc/algorithm.js`、`index.jsx`、`meta.js`
- [ ] `meta.js` 导出 `category: "graph"`
- [ ] 不修改 `src/App.jsx`
- [ ] 自动播放无定时器泄漏

## 建议文件路径

```
src/animations/tarjan-scc/
├── algorithm.js   # 纯算法：computeSteps(graph), runAlgorithmTests()
├── index.jsx      # React 动画组件
└── meta.js        # { title, description, path, category: "graph" }
```

Slug：`tarjan-scc`

## 分类

`graph` — 图算法
