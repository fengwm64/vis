# QA Report: 插入排序 (Issue #36)

## 构建结果

`npm run build` 通过。Vite 5.4.21，418 modules transformed，2.31s 构建成功。

## 算法测试结果

`runAlgorithmTests()` 全部 assertions 通过。覆盖 12 组测试用例：

- PRD 默认数组 `[38, 27, 43, 3, 9, 82, 10]` 排序正确
- 已排序数组（最优 O(n)，零移位）
- 逆序数组（最坏情况，10 次比较/10 次移位）
- 单元素、两元素有序/逆序
- 负数排序
- 重复元素稳定性
- 边界值 [-999, 999]
- 最大长度 n=50 逆序数组

## PRD 验收清单

| # | 验收项 | 结果 |
|---|--------|------|
| 1 | 算法模块导出 `computeSteps(input)` 和 `runAlgorithmTests()` | PASS |
| 2 | 算法模块可用 Node ESM import 运行自检通过 | PASS |
| 3 | 可视化正确展示已排序/未排序区间 | PASS |
| 4 | 可视化正确展示元素比较和移位过程 | PASS |
| 5 | 播放/暂停功能正常 | PASS |
| 6 | 单步前进/后退功能正常 | PASS |
| 7 | 重置功能正常 | PASS |
| 8 | 自定义数组输入功能正常 | PASS |
| 9 | 随机生成功能正常 | PASS |
| 10 | 无多余/重复/死按钮 | PASS |
| 11 | 卡片内容区域有正常顶部留白（无 pt-0） | PASS |
| 12 | `npm run build` 通过 | PASS |
| 13 | meta.js category 设为 `sorting` | PASS |
| 14 | 路由由 Vite import.meta.glob 自动发现，无需修改 App.jsx | PASS |

## UI 控件审计

| 控件 | 用途 | 结果 |
|------|------|------|
| 播放/暂停按钮 | 切换自动播放状态 | PASS - 文案随状态切换，语义正确 |
| 上一步按钮 | stepIndex - 1，clamp 到 0 | PASS |
| 下一步按钮 | stepIndex + 1，clamp 到 max | PASS |
| 重置按钮 | 回到 stepIndex=0 并停止播放 | PASS |
| 自定义数组输入 | onBlur/Enter 确认，解析并重新计算步骤 | PASS |
| 随机生成按钮 | 按 slider 长度生成随机数组 | PASS |
| 数组长度 slider | 2-20 范围，影响随机生成 | PASS |
| 速度 slider | 100-1500ms，控制自动播放间隔 | PASS |

- 无无用按钮、重复按钮、占位按钮、死按钮
- 禁用态：按钮无显式 disabled，通过 clamp 逻辑和自动停止实现边界行为，合理
- 文案行为一致

## 交互 bug 审计

| 项目 | 结果 |
|------|------|
| 播放/暂停 | PASS - 单个按钮切换，自动播放到最后一步自动停止 |
| 单步前进 | PASS - Math.min clamp 防越界 |
| 单步后退 | PASS - Math.max(0) 防越界 |
| 重置 | PASS - stepIndex=0, playing=false |
| 边界步骤 | PASS - 第 0 步不能后退，最后一步不越界 |
| 自动播放定时器 | PASS - useEffect 返回 clear cleanup，组件卸载时清理；使用 setTimeout 递归模式，无多重 interval |
| 路由 | PASS - meta.js path=/animations/insertion-sort，App.jsx glob 自动发现 |
| 响应式布局 | PASS - grid 布局 lg:grid-cols-[1.35fr_1fr]，移动端自动堆叠 |

## 卡片布局留白审计

| 卡片 | padding 类 | pt-0 检查 | 结果 |
|------|-----------|-----------|------|
| 数组状态卡片 CardContent | `p-4` | 无 pt-0 | PASS |
| 输入控制卡片 CardContent | `p-5` | 无 pt-0 | PASS |
| 播放速度卡片 CardContent | `p-5` | 无 pt-0 | PASS |
| 当前步骤卡片 CardContent | `p-5` | 无 pt-0 | PASS |
| 统计信息卡片 CardContent | `p-5` | 无 pt-0 | PASS |
| 算法说明卡片 CardContent | `p-5` | 无 pt-0 | PASS |

所有卡片均有正常顶部留白，无 `pt-0` / `!pt-0` / `padding-top: 0`。

## 发现问题

无缺陷。所有验收项、UI 控件、交互逻辑和布局留白均通过。
