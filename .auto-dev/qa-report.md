# QA Report: Issue #9 — 冒泡排序负数可视化修复

## 构建结果

- `npm run build` — **通过** (2.15s, 398 modules)

## 算法测试结果

- `runAlgorithmTests()` — **通过** (10 assertions, 0 failures)
- 注意：本次为 auto-fix，PRD 明确说明"算法无需修改"，前端仅修改可视化部分。

## PRD 验收清单

| # | 验收项 | 结果 |
|---|--------|------|
| 1 | 输入 `[90, -90, 5, 3]`，-90 的柱子应明显不同于 90 的柱子 | **通过** — 使用 range-based 计算，正数柱从零线向上延伸，负数柱从零线向下延伸，零线标注 "0" |
| 2 | 含负数数组排序结果正确 | **通过** — 算法未修改，可视化不影响正确性 |
| 3 | 零值柱子有合理视觉表现 | **通过** — `isNegative=false`，不向下延伸，高度为最小 2% |
| 4 | 随机生成含负数数组能正常可视化 | **通过** — `randomArray` 生成 -99~98，range-based 计算覆盖完整范围 |
| 5 | 不含负数数组可视化效果不变 | **通过** — `minVal=0` 时 `zeroBottom=0`，行为与修改前一致 |
| 6 | 播放/暂停/单步/回退/重置功能正常 | **通过** — 代码逻辑未变，仅修改柱状图渲染方式 |
| 7 | 步骤描述中数值显示正确（含负号） | **通过** — 算法 description 使用模板字面量直接输出原始值 |
| 8 | `npm run build` 通过 | **通过** |

## UI 控件审计

| 控件 | 用途 | 可见 | 可交互 | 结果 |
|------|------|------|--------|------|
| 播放/暂停 | 切换自动播放 | 是 | 是 | **通过** — 单按钮切换，文案和图标随状态变化 |
| 上一步 | 后退一步 | 是 | 是 | **通过** — 第 0 步时 `Math.max(i-1, 0)` 防止越界 |
| 下一步 | 前进一步 | 是 | 是 | **通过** — 最后一步时 `Math.min(i+1, len-1)` 防止越界 |
| 重置 | 回到初始状态 | 是 | 是 | **通过** — `setStepIndex(0); setPlaying(false)` |
| 随机生成 | 生成随机数组 | 是 | 是 | **通过** — 重新计算 steps 并重置播放 |
| 确认输入 | 应用手动输入 | 是 | 是 | **通过** — Enter 键和 onBlur 触发 |
| 速度滑块 | 调整播放速度 | 是 | 是 | **通过** — 100ms~1500ms 范围 |

- 无重复按钮
- 无占位按钮
- 无死按钮
- 所有控件文案与行为一致

## 交互 Bug 审计

| 检查项 | 结果 |
|--------|------|
| 播放/暂停切换 | **通过** — `setPlaying(v => !v)` |
| 单步前进/后退 | **通过** — `goNext`/`goPrev` 边界保护 |
| 回退到第 0 步 | **通过** — `Math.max(i-1, 0)` |
| 最后一步越界 | **通过** — `Math.min(i+1, steps.length-1)` |
| 重置后状态 | **通过** — stepIndex=0, playing=false |
| 自动播放定时器 | **通过** — `useEffect` 返回 `clearTimeout`，`playing=false` 时返回 `undefined`；最后一步自动停止 |
| 多重 interval | **通过** — 使用 `setTimeout` 而非 `setInterval`，每次 render 只有一个 timer |
| 组件卸载定时器泄漏 | **通过** — cleanup 函数在 `playing` 变为 false 时清除 timer |
| 路由 | **通过** — `bubble-sort` 已在 `App.jsx` 的 `animations` 数组中注册 |
| 返回首页 | **通过** — 使用 `Link to="/"` |

## 代码变更审查

修改文件：`src/animations/bubble-sort.jsx`

核心变更：
1. **值域计算**：从 `Math.abs` + 单一 `maxVal` 改为 `minVal`/`maxVal`/`range` 三元组
2. **零线基线**：`minVal < 0` 时在容器中间位置绘制虚线零线，标注 "0"
3. **柱高计算**：从 `(Math.abs(value) / maxVal) * 100` 改为 `(Math.abs(value) / range) * 92`
4. **柱位置**：正数从零线向上延伸，负数从零线向下延伸
5. **标签定位**：从 flex flow 布局改为 absolute positioning，正数标签在柱上方，负数标签在柱下方
6. **圆角方向**：正数柱 `rounded-t-md`，负数柱 `rounded-b-md`

未修改文件：
- `src/animations/bubble-sort/algorithm.js` — 算法无需修改
- `src/App.jsx` — 路由已存在

## 发现的问题

**轻微视觉问题（不阻塞发布）：**

1. **底部标签轻微裁剪**：当 `minVal < 0` 时，容器底部（0%）附近的 index 标签和 sorted ✓ 标记可能被容器边缘轻微裁剪。这是因为旧版使用 flex 布局（标签自然流到柱下方），新版改用 absolute positioning（标签可能超出容器底部边界）。在实际使用中影响极小，index 数字仍大部分可见。

此问题归属 `frontend`，但不影响功能正确性和 PRD 验收，不阻塞发布。

## 结论

**QA 通过** — 所有 PRD 验收项通过，构建通过，算法测试通过，无功能缺陷。负数可视化修复正确实现了 range-based 柱高计算和零线基线显示。
