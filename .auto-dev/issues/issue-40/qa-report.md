# QA Report: Issue #40 — 插入排序移位步骤视觉优化

## 构建结果
✅ `npm run build` 通过，无错误、无警告。

## 算法测试结果
✅ `runAlgorithmTests()` 全部 17 组断言通过。算法模块未修改，无回归。

## PRD 验收清单

| # | 验收项 | 结果 |
|---|--------|------|
| 1 | 默认数组移位步骤中，用户能清楚区分 key 原位和移位元素 | ✅ 通过 — key 原位 (index 3) 显示 ∅ 虚线占位；移位源 (index 2) 高亮 cyan-500；移位目标 (index 3) 高亮 blue-500 |
| 2 | 移位步骤高亮的是移位源位置，而非仅高亮目标位置 | ✅ 通过 — `barColor` 新增 `comparing - 1` 条件返回 `bg-cyan-500`，源位置获得 cyan 高亮 |
| 3 | key 的"已取出"状态始终可见，不被移位高亮覆盖 | ✅ 通过 — key 原位为 null，显示 ∅ 占位；key 值通过上方 rose-100 悬浮标签显示，不受 bar 高亮影响 |
| 4 | 图例与实际颜色一致，无缺失或多余条目 | ✅ 通过 — 新增"移位源" cyan 图例，原"移位中"改为"移位目标"，与 barColor 逻辑一一对应 |
| 5 | 其他步骤（比较、插入、初始、完成）的视觉表现无回归 | ✅ 通过 — barColor 优先级链完整：inserting > shifting-source > shifting-dest > comparing > current > sorted > unsorted |
| 6 | `npm run build` 通过 | ✅ 通过 |

## UI 控件审计

| 项目 | 结果 |
|------|------|
| 播放/暂停按钮 | ✅ 有明确用途，文案与行为一致 |
| 上一步按钮 | ✅ step 0 时 clamp，不越界 |
| 下一步按钮 | ✅ 最后一步时 clamp，不越界 |
| 重置按钮 | ✅ 回到 step 0 并停止播放 |
| 随机生成按钮 | ✅ 生成新数组并重置 |
| 自定义数组输入 | ✅ Enter 和 blur 均触发确认 |
| 播放速度滑块 | ✅ 范围 100-1500ms，实时生效 |
| 无用/重复/死按钮 | ✅ 未发现 |

## 交互 Bug 审计

| 项目 | 结果 |
|------|------|
| 播放/暂停切换 | ✅ 正常 |
| 单步前进/后退 | ✅ 正常，边界正确 |
| 重置 | ✅ 回到初始状态 |
| 自动播放定时器 | ✅ 使用 setTimeout + cleanup，无泄漏 |
| 路由 | ✅ `/animations/insertion-sort` 通过 meta.js 自动注册 |
| 响应式布局 | ✅ lg:grid-cols 双栏，小屏单栏 |

## 卡片布局留白审计

| 项目 | 结果 |
|------|------|
| 可视化卡片 CardContent | ✅ `p-4`，无 `pt-0` |
| 输入控制卡片 CardContent | ✅ `p-5`，无 `pt-0` |
| 播放速度卡片 CardContent | ✅ `p-5`，无 `pt-0` |
| 当前步骤卡片 CardContent | ✅ `p-5`，无 `pt-0` |
| 统计信息卡片 CardContent | ✅ `p-5`，无 `pt-0` |
| 算法说明卡片 CardContent | ✅ `p-5`，无 `pt-0` |

## 代码变更摘要

仅修改 `src/animations/insertion-sort/index.jsx`：
- `barColor` 函数：移位步骤新增 cyan 高亮移位源（`comparing - 1`），保留 blue 高亮移位目标（`comparing`）
- 新增 `isShiftSource` 变量，用于移位源 bar 的缩放动画
- 图例：新增"移位源" cyan 条目，"移位中"改名为"移位目标"

## 结论

✅ QA 通过。所有验收项通过，无 UI/交互缺陷，无回归。
