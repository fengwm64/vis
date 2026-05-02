# PRD: Issue #34 - 快速排序随机生成数组不应允许负数

## 需求概述

快速排序可视化页面中，"随机生成"按钮产生的数组包含负数（范围 [-99, 98]），导致柱状图可视化出现布局异常。需要将随机数组的数值范围限制为正整数。

## 目标动画

- **ID**: quick-sort
- **路径**: `/animations/quick-sort`
- **现有文件**: `src/animations/quick-sort/index.jsx`

## 问题分析

### 根因

`src/animations/quick-sort/index.jsx` 第 26-28 行的 `randomArray` 函数：

```js
function randomArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 198) - 99);
}
```

生成范围为 `[-99, 98]` 的整数，包含负数。

### 影响

- 柱状图在处理负数时布局异常：负值柱条向下延伸，零线位置计算复杂，视觉效果混乱
- 算法本身能正确处理负数（测试用例 5 已验证），问题仅在可视化层

### 不涉及算法修改

`algorithm.js` 的 `computeSteps` 函数对正负数都能正确排序，无需修改。

## 修复方案

修改 `randomArray` 函数，使生成的随机数组只包含正整数：

```js
function randomArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 99) + 1);
}
```

生成范围变为 `[1, 99]`，保证所有值为正整数。

## 验收清单

1. [ ] 点击"随机生成"按钮后，数组中所有值均为正整数（≥ 1）
2. [ ] 柱状图正常显示，无向下延伸的异常柱条
3. [ ] 排序动画正常运行，步骤说明正确
4. [ ] 用户手动输入负数时仍可正常排序（保留现有 `parseInput` 逻辑不变）
5. [ ] `npm run build` 构建通过
6. [ ] 无新增按钮、无删除已有功能

## 交付角色

- **修复角色**: frontend（纯前端可视化修改，不涉及算法逻辑）
- **修改范围**: `src/animations/quick-sort/index.jsx` 中的 `randomArray` 函数
