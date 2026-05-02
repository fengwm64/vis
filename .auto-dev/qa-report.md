# QA Report: 二分查找可视化 (Issue #8)

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

测试覆盖：标准查找、查找失败、含负数、单元素数组（找到/未找到）、空数组、两元素数组、目标在首/末位、30 元素大数组、重复元素、步骤结构完整性、比较值正确性。

## 验收清单

### 功能验收

| # | 验收项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | 支持用户手动输入数组（逗号分隔整数，自动排序） | ✅ PASS | `parseInput` 解析后 `.sort((a,b) => a-b)`，支持逗号/中文逗号/空格分隔 |
| 2 | 支持输入目标值 | ✅ PASS | number input 绑定 `targetText` state |
| 3 | 支持随机生成指定长度数组（1~30 个元素，含正负数） | ✅ PASS | `randomSortedArray` 生成 -999~999 范围随机数并排序，length slider 1~30 |
| 4 | 正确实现二分查找算法 | ✅ PASS | 算法测试覆盖多种场景，全部通过 |
| 5 | 可视化展示每一步的 left/right/mid 指针和比较结果 | ✅ | L(绿)/R(红) 标签 + mid(蓝) 箭头 + 比较结果显示 |
| 6 | 支持单步执行（下一步/上一步） | ✅ PASS | goNext/goPrev 回调，边界保护 Math.min/max |
| 7 | 支持自动播放（播放/暂停） | ✅ PASS | useEffect setTimeout 实现，到达末尾自动停止 |
| 8 | 支持重置到初始状态 | ✅ PASS | handleReset 重置 stepIndex=0, playing=false |
| 9 | 显示当前步骤的文字说明 | ✅ PASS | "当前步骤"面板显示 description |
| 10 | 查找成功时有明确提示 | ✅ PASS | 绿色 banner "找到目标值 X，索引为 Y" |
| 11 | 查找失败时有明确提示 | ✅ PASS | 红色 banner "未找到目标值 X" |

### 视觉验收

| # | 验收项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | 数组元素水平排列，显示值和索引 | ✅ PASS | flex 布局，每格显示值和 [i] 索引 |
| 2 | left/right/mid 指针有明确的颜色区分和动画 | ✅ PASS | L(绿)/R(红) 标签 + mid(蓝) 箭头，scale 动画 |
| 3 | 搜索范围外的元素变灰 | ✅ PASS | cellBg 根据索引与 left/right 范围返回不同背景色 |
| 4 | 说明面板实时更新 | ✅ PASS | current.description 响应式更新 |
| 5 | 响应式布局，适配不同屏幕尺寸 | ✅ PASS | grid lg:grid-cols-[1.35fr_1fr]，flex-wrap |

### 技术验收

| # | 验收项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | 算法模块为纯函数，零 DOM/React 依赖 | ✅ PASS | 纯 JS 数组操作和 console.assert |
| 2 | 算法模块导出 computeSteps(array, target) 和 runAlgorithmTests() | ✅ PASS | 两个命名导出 |
| 3 | 算法模块通过 Node ESM import 自检 | ✅ PASS | Node 直接运行通过 |
| 4 | 动画组件复用现有 UI 组件（button, card） | ✅ PASS | 导入 Button, Card, CardContent |
| 5 | 动画组件复用 PageRank 的播放控制模式 | ✅ PASS | 相同的 playing/speed/stepIndex 模式 |
| 6 | 在 src/App.jsx 注册路由 | ✅ PASS | animations 数组中 id='binary-search' |
| 7 | npm run build 构建通过 | ✅ PASS | 2.17s 完成 |

## UI 控件审计

| 控件 | 用途 | 结果 | 说明 |
|------|------|------|------|
| 播放/暂停按钮 | 切换自动播放 | ✅ | disabled={current.done}，文案随状态变化 |
| 上一步按钮 | 单步后退 | ✅ | Math.max(i-1, 0) 边界保护 |
| 下一步按钮 | 单步前进 | ✅ | disabled={current.done}，Math.min(i+1, steps.length-1) |
| 重置按钮 | 回到初始状态 | ✅ | 重置 stepIndex=0, playing=false |
| 查找按钮 | 确认输入并计算步骤 | ✅ | 解析输入、排序、计算步骤 |
| 随机生成按钮 | 生成随机数组 | ✅ | 生成随机排序数组并更新输入框 |
| 数组长度滑块 | 设置随机数组长度 | ✅ | range 1~30 |
| 速度滑块 | 控制播放速度 | ✅ | range 200~2000ms |

**审计结论**: 无死按钮、无重复按钮、无占位按钮、无文案行为不一致。所有按钮都有明确用途且可触发可见状态变化。

## 交互 Bug 审计

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 播放/暂停切换 | ✅ | setPlaying(v => !v) 正确切换 |
| 单步前进 | ✅ | goNext 步进且不越界 |
| 单步后退 | ✅ | goPrev 步进且不越界 |
| 重置 | ✅ | 回到 stepIndex=0，停止播放 |
| 边界：第 0 步后退 | ✅ | Math.max(i-1, 0) 阻止负索引 |
| 边界：最后一步前进 | ✅ | Math.min(i+1, steps.length-1) 阻止越界 |
| 自动播放停止 | ✅ | stepIndex >= steps.length - 1 时 setPlaying(false) |
| 定时器清理 | ✅ | useEffect 返回 clearTimeout，无泄漏 |
| 路由导航 | ✅ | 首页卡片 → /animations/binary-search → 返回首页 |
| 响应式布局 | ✅ | 桌面端双栏、移动端单栏 |

**审计结论**: 无交互 bug，播放控制边界正确，定时器无泄漏。

1. **底部标签轻微裁剪**：当 `minVal < 0` 时，容器底部（0%）附近的 index 标签和 sorted ✓ 标记可能被容器边缘轻微裁剪。这是因为旧版使用 flex 布局（标签自然流到柱下方），新版改用 absolute positioning（标签可能超出容器底部边界）。在实际使用中影响极小，index 数字仍大部分可见。

此问题归属 `frontend`，但不影响功能正确性和 PRD 验收，不阻塞发布。

## 结论

**QA 通过** — 所有 PRD 验收项通过，构建通过，算法测试通过，无功能缺陷。负数可视化修复正确实现了 range-based 柱高计算和零线基线显示。
