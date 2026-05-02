# QA Report: Issue #38 — Insertion Sort Visual Insertion Fix

## Build Result

✅ `npm run build` — built in 1.89s, no errors.

## Algorithm Self-Tests

✅ `runAlgorithmTests()` — all 17 assertions passed (includes regression test #17 for shift step comparing index).

## PRD Acceptance Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Comparison steps show amber (比较中) | ✅ PASS | `barColor` condition order correct: `comparing` checked after `shifting` |
| 2 | Shift steps show blue (移位中) | ✅ PASS | Algorithm now sets `comparing=j+1` (destination), blue bar visible on shifted element |
| 3 | Insertion steps show purple (插入中) | ✅ PASS | `barColor` checks `inserting` first; target bar highlights purple |
| 4 | Key visually "lifted out" when picked | ✅ PASS | Algorithm nulls out key position; frontend shows ∅ placeholder with dashed border |
| 5 | Key shown in holding area during compare/shift | ✅ PASS | Rose pill with AnimatePresence shows keyValue above bar chart |
| 6 | Key visually slides to insertion position | ✅ PASS | Purple "插入" pill appears in holding area during insert step; exit animation conveys placement |
| 7 | Animation shows insertion (lift→shift→place), not swap | ✅ PASS | Flow: pick (key to holding) → compare (amber) → shift (blue) → insert (purple). Clearly distinct from swap |
| 8 | All legend items used and correspond to correct states | ✅ PASS | All 7 legend items verified reachable: amber, blue, purple, rose, emerald, slate, ∅ placeholder |
| 9 | Step descriptions match visual state | ✅ PASS | Descriptions accurately describe each operation |
| 10 | Playback controls work correctly | ✅ PASS | Play/pause, step forward/back, reset all work; auto-play stops at last step; timer cleanup correct |
| 11 | `npm run build` passes | ✅ PASS | |
| 12 | Algorithm self-tests pass | ✅ PASS | |

## UI Controls Audit

| Check | Result |
|-------|--------|
| Every button has clear purpose | ✅ Play/pause, step forward, step back, reset, random generate, confirm input |
| No unused/placeholder/dead buttons | ✅ |
| No duplicate semantic buttons | ✅ |
| Disabled states justified | ✅ Step-back/step-forward clamp at boundaries via callback logic |
| Label-text matches behavior | ✅ "播放" toggles to "暂停", "下一步"/"上一步" step correctly |
| Animation state consistency | ✅ Current step, description text, bar colors, key holding area, statistics all consistent |

## Interaction Bug Audit

| Check | Result |
|-------|--------|
| Play/pause toggle | ✅ |
| Step forward boundary | ✅ Clamps at last step via `Math.min` |
| Step backward boundary | ✅ Clamps at step 0 via `Math.max` |
| Reset | ✅ Returns to step 0, stops playing |
| Auto-play timer cleanup | ✅ Uses `setTimeout` with cleanup in `useEffect` return; stops at last step |
| Route and navigation | ✅ Animation accessible at `/animations/insertion-sort` |
| Responsive layout | ✅ `lg:grid-cols` splits to single column on mobile; buttons use `flex-wrap` |

## Card Layout Whitespace Audit

| Check | Result |
|-------|--------|
| CardContent uses proper padding | ✅ Visualization card uses `p-4`, all other cards use `p-5` |
| No `pt-0` or `padding-top: 0` | ✅ No `pt-0`, `!pt-0`, or `padding-top: 0` found in any CardContent |
| Top padding not overridden | ✅ Default Tailwind padding preserved |

## Verification of Previous Defect Fix

The previous QA round found that shift steps set `comparing=j` (source/null slot) instead of `comparing=j+1` (destination/shifted element), causing the blue bar to never appear on a visible bar. This has been fixed:

- Algorithm now sets `comparing: j + 1` during shift steps (line 107 of `algorithm.js`)
- Regression test #17 validates that shift step comparing index points to a non-null element
- Trace verification for `[38, 27, 43]`: Step 3 (shift) has `comparing=1`, `heldArray[1]=38` (non-null) → blue bar correctly visible

## Verdict

✅ **PASS** — All acceptance criteria met. All legend items used. No UI/interaction defects found. Ready for PR creation.
