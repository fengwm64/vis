# PRD: Issue #26 — PageRank 过程动画允许用户自定义

## 需求来源

- Issue: https://github.com/fengwm64/vis/issues/26
- 类型: auto-fix（交互增强）
- 触发: 动画页面 Auto-Fix 表单

## 目标动画

- ID: pagerank
- 标题: PageRank 过程动画
- 路径: `/animations/pagerank`
- 现有文件:
  - `src/animations/pagerank_process_animation.jsx`（主实现）
  - `src/animations/pagerank/index.jsx`（re-export）
  - `src/animations/pagerank/meta.js`（元数据）

## 问题描述

当前 PageRank 动画的节点、边和权重全部硬编码在 `pagerank_process_animation.jsx` 顶部。用户无法自定义图结构，只能观察一个固定的 5 节点示例。

用户希望：
1. 自定义节点（添加/删除节点）
2. 自定义节点之间的边（添加/删除有向边）
3. 自定义节点的权重（初始 PageRank 值或阻尼系数）

## 实现方案

### 第一步：算法模块抽取（algorithm）

将 PageRank 计算逻辑抽取到 `src/animations/pagerank/algorithm.js`：

- 导出 `computePageRank(nodes, edges, options)` 函数
  - `nodes`: `[{ id: string }]`
  - `edges`: `[{ from: string, to: string }]`
  - `options`: `{ damping?: number, rounds?: number }`
  - 返回: `{ history: Array<{ round, rank }>, nodeMap, outLinks, inLinks }`
- 导出 `runAlgorithmTests()` 用于自检
- 保持纯函数，零 DOM/React 依赖
- 默认 damping = 0.85，rounds = 12，与现有行为一致

### 第二步：前端交互（frontend）

修改 `src/animations/pagerank_process_animation.jsx`：

1. **图编辑面板**：在动画下方或侧边添加可折叠的"编辑图结构"面板
2. **节点管理**：
   - 显示当前节点列表，支持添加新节点（自动分配 ID 如 F、G…）和删除节点
   - 删除节点时自动清理相关边
3. **边管理**：
   - 显示当前边列表，支持通过下拉选择源/目标节点添加新边
   - 支持删除边
   - 防止重复边和自环
4. **参数调整**：
   - 阻尼系数滑块（0.01 ~ 0.99，默认 0.85）
   - 迭代轮数输入（5 ~ 30，默认 12）
5. **应用/重置**：
   - 修改后点击"应用"重新计算并重置动画
   - 提供"恢复默认"按钮回到初始 5 节点图
6. **布局要求**：
   - 图编辑面板不遮挡主可视化区域
   - 卡片内容保留顶部留白（`p-4` / `p-5` / `p-6`），不得使用 `pt-0`
   - 响应式：移动端编辑面板折叠在可视化下方

### 复用与约束

- 复用 `Button`、`Card` 组件和播放控制模式
- 不修改 `src/App.jsx`，不新增路由
- `npm run build` 必须通过

## 输入规模

- 节点数：1 ~ 10（超出时给出提示）
- 边数：0 ~ 节点数 × (节点数 - 1)（完全有向图上限）
- 阻尼系数：0.01 ~ 0.99
- 迭代轮数：5 ~ 30

## 验收清单

- [ ] `src/animations/pagerank/algorithm.js` 存在，导出 `computePageRank` 和 `runAlgorithmTests`
- [ ] 算法模块可通过 Node ESM import 运行自检
- [ ] 页面加载时默认图与修改前行为一致（5 节点、8 条边、damping=0.85、12 轮）
- [ ] 用户可添加节点（ID 自动分配，位置自动布局）
- [ ] 用户可删除节点，相关边自动清除
- [ ] 用户可添加有向边（不重复、不自环）
- [ ] 用户可删除边
- [ ] 用户可调整阻尼系数（滑块或输入框）
- [ ] 用户可调整迭代轮数
- [ ] 点击"应用"后动画重新计算并从第 0 轮开始
- [ ] 点击"恢复默认"回到初始 5 节点图
- [ ] 播放/暂停/单步/重置功能正常
- [ ] 无无用按钮、重复按钮、死按钮
- [ ] 卡片内容有正常顶部留白，无 `pt-0`
- [ ] `npm run build` 通过
- [ ] 移动端布局可用，编辑面板不遮挡可视化

## 流程

1. algorithm: 抽取 `src/animations/pagerank/algorithm.js`
2. frontend: 重构 `pagerank_process_animation.jsx`，接入算法模块，添加图编辑 UI
3. qa: 构建验证 + UI 验收
