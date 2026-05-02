# QA Report: 二分图最大匹配 (Bipartite Maximum Matching)

Issue: #54
Pipeline: auto-dev
Slug: `bipartite-matching`
Date: 2026-05-02

## 1. Build Result

**PASS** — `npm run build` completed successfully in 2.35s. 427 modules transformed, no errors.

## 2. Algorithm Test Result

**PASS** — `runAlgorithmTests()` via Node ESM import succeeded. All 8 test cases passed:
- Test 1: PRD example (4×4, 7 edges) → max matching = 4
- Test 2: Empty edges → 0 matching
- Test 3: Complete bipartite (3×3) → all matched
- Test 4: Single edge → 1 matching
- Test 5: Asymmetric sizes (5 left, 2 right) → 2 matching
- Test 6: Multiple steps produced, first step phase = "searching"
- Test 7: Last step phase = "complete"
- Test 8: All step fields have correct types

## 3. PRD Acceptance Checklist

| # | Requirement | Result |
|---|-------------|--------|
| 1 | `algorithm.js` is pure function, zero DOM/React deps | PASS |
| 2 | Exports `computeSteps(input)` returning step array | PASS |
| 3 | Exports `runAlgorithmTests()` with ≥3 test cases (empty, complete, no-match) | PASS (8 tests) |
| 4 | Node ESM import self-test passes | PASS |
| 5 | `index.jsx` uses Framer Motion | PASS |
| 6 | `meta.js` exports `category: "graph"` | PASS |
| 7 | Playback controls: play/pause, step forward, step back, reset, speed slider | PASS |
| 8 | Each button has clear purpose, no duplicate/unused buttons | PASS |
| 9 | Card content has top padding (no `pt-0`) | PASS |
| 10 | Bipartite layout with left/right columns, distinguishable nodes/edges | PASS |
| 11 | Matched/searching/augmenting edges visually distinct | PASS (green/dashed amber/blue) |
| 12 | `npm run build` passes | PASS |
| 13 | `src/App.jsx` not modified | PASS |
| 14 | Responsive layout at common screen widths | PASS (grid stacks on mobile) |

## 4. UI Control Audit

| Control | Behavior | Result |
|---------|----------|--------|
| Play/Pause | Toggles animation; at end, resets to start and plays | PASS |
| Step Forward | Advances one step; disabled at last step | PASS |
| Step Back | Goes back one step; disabled at step 0 | PASS |
| Reset | Stops and returns to step 0 | PASS |
| Speed Slider | Left=慢(slowest, 2400ms), Right=快(fastest, 400ms) | PASS (fix verified) |

- No unused buttons
- No duplicate buttons
- No dead buttons
- All button labels match their behavior

## 5. Interaction Bug Audit

| Check | Result |
|-------|--------|
| Play/pause state consistency | PASS |
| Single-step forward/back | PASS |
| Reset returns to initial state | PASS |
| Boundary: step 0 back disabled | PASS |
| Boundary: last step forward disabled | PASS |
| Auto-play stops at last step | PASS |
| Timer cleanup on unmount (useEffect return) | PASS |
| No multiple intervals | PASS |
| Route accessible from homepage | PASS (meta.js auto-discovered) |
| Back navigation preserves app | PASS |

## 6. Layout & Padding Audit

| Check | Result |
|-------|--------|
| CardContent top padding | PASS (`p-4` on main card, `p-5` on side cards) |
| No `pt-0` / `!pt-0` / `padding-top: 0` | PASS |
| Controls not obscured on mobile | PASS (flex-wrap) |
| SVG scales within container | PASS (`w-full` on SVG) |

## 7. Previous QA Round Fix Verification

Previous QA found: speed slider labels swapped ("快"/"慢" reversed).

**Fix verified**: Frontend corrected labels — left="慢" (2400ms, slowest), right="快" (400ms, fastest). Behavior matches labels. **PASS**.

## 8. Observations (Non-blocking)

- `AnimatePresence` is imported from `framer-motion` but not used in the component. Minor unused import; does not affect functionality or build.

## 9. Conclusion

**All checks passed. No defects found.** Previous frontend fix (speed slider labels) has been correctly applied. Ready to proceed to PR creation.
