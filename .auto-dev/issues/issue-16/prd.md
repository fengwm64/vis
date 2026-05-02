# PRD: [auto-fix] 冒泡排序 — 取消随机生成数组出现负数

## 目标动画

- ID: bubble-sort
- 路径: `/animations/bubble-sort`
- 现有文件:
  - `src/animations/bubble-sort.jsx` — 主组件，包含 `randomArray` 函数
  - `src/animations/bubble-sort/algorithm.js` — 纯算法模块（无需修改）
  - `src/animations/bubble-sort/index.jsx` — re-export（无需修改）
  - `src/animations/bubble-sort/meta.js` — 元数据（无需修改）

## 问题描述

`randomArray()` 函数（`src/animations/bubble-sort.jsx:26-28`）当前生成 [-99, 98] 范围的随机整数，包含负数。负数在柱状图可视化中导致以下问题：

1. 需要额外的零基线逻辑和负数柱体向下延伸，增加布局复杂度
2. 负数柱体的文字标签和柱体方向在动画过渡时容易出现错位
3. 负数在排序可视化中没有特殊教学价值，去掉不影响算法演示效果

## 修复方案

修改 `randomArray` 函数，将随机数范围从 `[-99, 98]` 改为 `[1, 99]`，只生成正整数。

### 具体变更

**文件**: `src/animations/bubble-sort.jsx`

**当前代码** (第 26-28 行):
```js
function randomArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 198) - 99);
}
```

**修改为**:
```js
function randomArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 99) + 1);
}
```

### 不需要修改的部分

- `algorithm.js`：算法本身正确处理负数，测试用例中保留负数测试（`[3, -1, 0, -5, 2]`）确保算法通用性，不需要修改。
- 负数相关的零基线渲染逻辑（第 188-195 行、第 209-211 行等）：保留不删除，因为用户仍可通过自定义数组输入负数，这些代码确保手动输入负数时可视化仍然正确。

## 验收清单

1. 点击"随机生成"按钮 10 次，生成的数组不包含任何负数（所有值 >= 1）
2. 随机生成的数组仍能正确排序和动画播放
3. 手动输入含负数的数组（如 `-3, 5, -1, 8`）仍能正常排序和可视化（零基线逻辑保留）
4. `npm run build` 通过
5. 无新增无用按钮、重复按钮或文案不一致
