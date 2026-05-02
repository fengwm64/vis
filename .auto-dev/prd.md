# PRD: Issue #6 — 冒泡排序"排序"按钮无效

## 需求概述

用户在冒泡排序动画页面 (`/animations/bubble-sort`) 提交 Auto-Fix：输入控制区域的"排序"按钮点击后无效且本身冗余。

## 目标动画

- **ID**: `bubble-sort`
- **路径**: `/animations/bubble-sort`
- **现有文件**: `src/animations/bubble-sort.jsx`

## 问题分析

"排序"按钮位于自定义数组输入框右侧（`bubble-sort.jsx:290-295`），绑定 `handleConfirm` 回调。该回调仅做两件事：

1. 解析输入框文本为数组
2. 调用 `computeSteps` 重算步骤并 `setStepIndex(0)`

**核心问题**：

- 按钮文案"排序"暗示会启动排序动画，但实际只是"确认输入"，行为与文案不一致。
- 重置到 step 0 后视觉上与初始状态无异，用户感觉"什么都没发生"。
- "随机生成"按钮已自带确认+重置逻辑（`handleRandom`），无需单独确认。
- 该按钮功能完全可以被输入框的 `onBlur` 或 `onKeyDown`（Enter）替代，属于冗余控件。

## 修复方案

**移除"排序"按钮**，改为输入框失焦（`onBlur`）或按回车时自动确认输入：

1. 删除"排序"按钮 JSX（line 290-295）。
2. 在 `<input>` 上添加 `onBlur={handleConfirm}` 和 `onKeyDown`（Enter 触发 `handleConfirm`）。
3. 保留 `handleConfirm` 回调逻辑不变，只是触发方式从按钮点击改为输入框交互。

## 验收清单

- [ ] "排序"按钮已从 UI 中移除
- [ ] 输入框失焦时自动解析输入并更新可视化
- [ ] 输入框按回车时自动解析输入并更新可视化
- [ ] "随机生成"按钮功能不受影响
- [ ] 播放/暂停/单步/回退/重置控件不受影响
- [ ] `npm run build` 通过
- [ ] 不存在无用按钮、重复按钮、死按钮或文案行为不一致

## 复杂度说明

纯前端 UI 调整，不涉及算法变更。改动集中在 `src/animations/bubble-sort.jsx` 一个文件。

## 交付路径

- **Target file**: `src/animations/bubble-sort.jsx`
- **Handoff**: 直接交给 `frontend`（交互/按钮冗余问题，无需算法改动）
