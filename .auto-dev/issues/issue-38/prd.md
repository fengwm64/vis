# PRD: Insertion Sort — Fix Visual Insertion Feedback

**Issue**: #38
**Pipeline**: auto-fix
**Target Animation**: insertion-sort
**Target Path**: `/animations/insertion-sort`
**Existing Files**:
- `src/animations/insertion-sort/algorithm.js`
- `src/animations/insertion-sort/index.jsx`
- `src/animations/insertion-sort/meta.js`

## Problem Analysis

### User Report
动画没有体现出来插入，有点像交换一样；图例中的比较中、移位中、插入中都没有使用过。

### Root Cause

1. **Algorithm step data**: During compare/shift steps, the key value remains visible at its original array position. The array is mutated in-place (`arr[j+1] = arr[j]` then `arr[j+1] = key`), so the animation shows elements changing positions but not the conceptual "lift key out → shift elements → insert key" flow.

2. **Frontend `barColor` condition order bug**: The condition `if (current.shifting && index === current.comparing)` (blue) is checked BEFORE `if (current.comparing !== null && index === current.comparing)` (amber). During a shift step, `shifting=true` AND `comparing` is set, so the amber "comparing" color is unreachable during shifts. The amber color only shows during pure comparison steps where `shifting=false`.

3. **No visual "key held aside"**: The algorithm sets `current` to the key's original index, but the frontend renders it as a regular bar. There's no visual indicator that the key has been "picked up" from the array.

4. **No insertion animation**: When `inserting=true`, the key simply appears at its target position. There's no animation of the key sliding from the holding area to the insertion point.

## Changes Required

### Part 1: Algorithm Module (`algorithm.js`)

Add metadata fields to step objects to support the "key held aside" visualization:

- Add `keyValue: number | null` — the value of the element being inserted (null when idle)
- Add `insertTarget: number | null` — the target index where the key will be inserted (null when not applicable)
- During compare/shift steps (after the "pick" step), set the array to `null` at the key's original position to indicate it has been "removed" from the visual array
- The "pick" step should set `keyValue` and start showing the key in the holding area
- The "insert" step should clear `keyValue` and place the key at `insertTarget`
- Update self-tests to validate new fields

### Part 2: Frontend Component (`index.jsx`)

**A. Fix `barColor` condition order**:
- Check `inserting` first (purple)
- Then check `shifting` (blue)
- Then check `comparing` (amber)
- Then check `current` (rose)
- Then check sorted (emerald)
- Default: slate

**B. Add "key held aside" visual**:
- When `current.keyValue !== null` and `current.current !== null`, render the key value as an animated pill/badge in a "holding area" above the bar chart
- The holding area should be visually distinct (e.g., a floating card or highlighted zone)
- When the key is held, the bar at the key's original position should be dimmed or show as empty/placeholder

**C. Add insertion animation**:
- When `current.inserting` is true, animate the key pill from the holding area to the target bar position
- Use Framer Motion `layoutId` or explicit `animate` with position coordinates to create the slide effect
- The target bar should briefly highlight (purple) to show the insertion point

**D. Update legend labels to match actual states**:
- Ensure the legend colors correspond to the corrected `barColor` conditions
- All legend items (比较中, 移位中, 插入中) should now be visually distinguishable during animation playback

## Acceptance Criteria

1. [ ] During comparison steps, the compared bar shows amber (比较中)
2. [ ] During shift steps, the shifted bar shows blue (移位中)
3. [ ] During insertion steps, the target bar shows purple (插入中)
4. [ ] The key element is visually "lifted out" of the array when picked
5. [ ] The key is shown in a holding area above/during compare and shift steps
6. [ ] The key visually slides to its insertion position during the insert step
7. [ ] The animation clearly shows insertion (lift → shift → place), not swap
8. [ ] All legend items are used and correspond to correct visual states
9. [ ] Step descriptions match the visual state
10. [ ] Playback controls (play/pause/step/reset) work correctly with new animation
11. [ ] `npm run build` passes
12. [ ] Algorithm self-tests pass

## Handoff

This fix requires coordinated changes to both `algorithm.js` (metadata fields) and `index.jsx` (visualization). The algorithm engineer should add the `keyValue`/`insertTarget` fields and null-out the key position in the array during hold steps first. Then the frontend engineer implements the visual animation using the new fields.
