# PRD: 二分图最大匹配 (Bipartite Maximum Matching)

Issue: #54
Pipeline: auto-dev
Slug: `bipartite-matching`

## 1. 算法定义

二分图最大匹配问题：给定一个二分图 G=(U,V,E)，其中 U 和 V 是两个不相交的节点集，E 是连接 U 和 V 中节点的边集。目标是找到一个最大基数的匹配 M，使得 M 中任意两条边不共享端点。

### 算法选择

采用 **增广路算法（Kuhn's Algorithm / Hungarian method for matching）**：

1. 初始化匹配 M 为空
2. 对 U 中每个未匹配节点 u，尝试寻找从 u 出发的增广路
3. 增广路：从未匹配的 u 出发，沿未匹配边 → 匹配边交替前进，到达 V 中一个未匹配节点 v
4. 找到增广路后，将路径上的边状态翻转（未匹配→匹配，匹配→未匹配），匹配数 +1
5. 重复直到找不到增广路，此时 M 为最大匹配（Berge 定理）

### 复杂度

- 时间：O(V * E)，V 为节点数，E 为边数（每次 DFS 最多访问所有边，最多进行 V 次 DFS）
- 空间：O(V + E)

## 2. 边界与输入规模

### 输入格式

```js
{
  leftNodes:  [0, 1, 2, ...],   // U 集，数值 ID
  rightNodes: [0, 1, 2, ...],   // V 集，数值 ID（内部编号，与 U 不重叠）
  edges: [[u, v], ...]          // u ∈ U, v ∈ V
}
```

### 规模约束

- 节点总数（|U| + |V|）：3 ~ 12（动画可读性）
- 边数：2 ~ 20
- 两个集合各至少 2 个节点

### 示例数据

```
leftNodes:  [0, 1, 2, 3]
rightNodes: [0, 1, 2, 3]
edges: [[0,0], [0,1], [1,0], [2,1], [2,2], [3,2], [3,3]]
最大匹配 = 4: {(0,1), (1,0), (2,2), (3,3)}
```

## 3. 可视化步骤

每一步是一个 state 对象，包含：

- `leftNodes` / `rightNodes`：节点列表及各自状态（未访问 / 正在搜索 / 已匹配）
- `edges`：边列表及状态（普通 / 当前搜索 / 匹配中 / 增广路）
- `matching`：当前匹配对 Map<u, v>
- `currentU`：正在尝试匹配的 U 节点（可为 null）
- `augmentingPath`：当前找到的增广路节点序列（可为空）
- `visitedU` / `visitedV`：本轮 DFS 已访问集合
- `phase`：`searching` | `augmenting` | `complete`
- `message`：当前步骤的中文说明

### 步骤粒度

1. **开始匹配**：高亮当前 U 节点
2. **DFS 搜索**：逐条探索邻接边，高亮当前尝试的边和目标 V 节点
3. **递归深入**：当 V 节点已匹配时，递归尝试让其匹配对象重新匹配
4. **找到增广路**：高亮整条增广路
5. **翻转匹配**：增广路上的边状态翻转，匹配数更新
6. **回溯**：DFS 回溯时标记已访问
7. **完成**：所有 U 节点处理完毕，显示最终匹配结果

## 4. 交互控件

### 播放控制（复用 PageRank 模式）

- 播放 / 暂停
- 单步前进
- 单步后退
- 重置
- 速度调节（滑块）

### 信息面板

- 当前步骤说明（message）
- 匹配数 / 最大匹配数
- 当前正在处理的节点高亮
- 已匹配边用粗线或特殊颜色标注

### 数据面板

- 匹配对列表
- 当前增广路路径（如有）

## 5. 布局设计

### 二分图布局

- 左侧一列：U 节点（纵向均匀分布）
- 右侧一列：V 节点（纵向均匀分布）
- 边用曲线或折线连接
- 匹配边用粗线或高亮颜色（如绿色）
- 当前搜索边用虚线或不同颜色（如橙色）
- 增广路用特殊颜色标注（如蓝色）

### 卡片结构

- 顶部：标题和简介
- 中间：SVG/Canvas 二分图可视化
- 底部左：播放控制
- 底部右：步骤说明和匹配统计

## 6. 验收清单

- [ ] 算法模块 `src/animations/bipartite-matching/algorithm.js` 是纯函数，零 DOM/React 依赖
- [ ] 导出 `computeSteps(input)` 函数，返回步骤数组
- [ ] 导出 `runAlgorithmTests()` 函数，包含至少 3 个测试用例（含边界：空图、完全匹配、无匹配边）
- [ ] `node --input-type=module -e "import('./src/animations/bipartite-matching/algorithm.js').then(m => { m.runAlgorithmTests(); console.log('All tests passed.') })"` 通过
- [ ] 动画组件 `src/animations/bipartite-matching/index.jsx` 使用 Framer Motion
- [ ] `meta.js` 导出 category 为 `graph`
- [ ] 播放控制包含：播放/暂停、单步前进、单步后退、重置、速度调节
- [ ] 每个按钮有明确用途，无重复或无用按钮
- [ ] 卡片内容区域保留顶部留白（无 `pt-0`）
- [ ] 二分图左右布局清晰，节点和边可区分
- [ ] 匹配边、搜索边、增广路有明确视觉区分
- [ ] `npm run build` 通过
- [ ] 不修改 `src/App.jsx`
- [ ] 响应式布局在常见屏幕宽度下可用

## 7. 文件结构

```
src/animations/bipartite-matching/
├── algorithm.js   # 纯算法模块
├── index.jsx      # React 动画组件
└── meta.js        # 元数据（title, description, path, category: "graph"）
```
