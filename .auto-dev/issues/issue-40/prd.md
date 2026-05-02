# PRD: 插入排序动画移位步骤视觉优化

## 目标动画
- **ID**: insertion-sort
- **路径**: `/animations/insertion-sort`
- **现有文件**:
  - `src/animations/insertion-sort/algorithm.js`
  - `src/animations/insertion-sort/index.jsx`
  - `src/animations/insertion-sort/meta.js`

## 问题类型
交互/视觉 (interaction)

## 问题描述

用户在插入排序动画中发现移位步骤的视觉呈现存在混淆。具体场景：

处理 `arr[3]=3` 作为 key 时：
1. 取出 key=3，index 3 变为 null（虚线占位）
2. 比较 arr[2]=43 > key=3
3. **移位步骤**：arr[2]=43 右移到 arr[3]

在第 3 步中，index 3 的位置显示 43 并被高亮为蓝色（bg-blue-500），但用户将其误解为"当前取出的 key"变红。原因分析：

- 移位步骤中 `comparing: 3` 指向移位目标位置，恰好与 key 原始位置重合
- `barColor` 函数中 `shifting && comparing` 优先级高于 `current` 判断，导致视觉上无法区分"key 原位"和"移位目标"
- 移位步骤高亮了目标位置而非源位置，用户难以理解元素从哪里移到了哪里

## 复现方式

1. 打开 `/animations/insertion-sort`
2. 使用默认数组 `[38, 27, 43, 3, 9, 82, 10]`
3. 逐步播放到 "取出 arr[3]=3" 后的比较和移位步骤
4. 观察移位步骤中 index 3 的高亮颜色和视觉含义

## 修改范围

仅修改前端文件 `src/animations/insertion-sort/index.jsx`，算法步骤数据结构 `algorithm.js` 无需变更。

### 具体修改点

1. **`barColor` 函数优化**（`index.jsx:101-112`）:
   - 移位步骤中，高亮移位**源位置**（`j`）而非目标位置（`comparing`），帮助用户看到"元素从哪里被取走"
   - 或者：移位步骤中同时高亮源和目标，用不同颜色区分
   - 确保 key 原位（`current`）始终有明确的视觉标识（如 rose 色），不被其他状态覆盖

2. **图例更新**（`index.jsx:309-338`）:
   - 如果新增了"移位源"颜色，需在图例中添加对应说明
   - 确保图例与实际颜色一一对应

3. **可选优化**:
   - 移位步骤中在源位置显示箭头或动画，指向目标位置，使移位方向更直观

## 验收清单

- [ ] 默认数组 `[38, 27, 43, 3, 9, 82, 10]` 的移位步骤中，用户能清楚区分 key 原位和移位元素
- [ ] 移位步骤高亮的是移位源位置（被取走元素的位置），而非仅高亮目标位置
- [ ] key 的"已取出"状态（null 占位 + rose 色 key 标签）始终可见，不被移位高亮覆盖
- [ ] 图例与实际颜色一致，无缺失或多余条目
- [ ] 其他步骤（比较、插入、初始、完成）的视觉表现无回归
- [ ] `npm run build` 通过

## 目标角色
**frontend** — 这是纯视觉/交互问题，不涉及算法逻辑变更。
