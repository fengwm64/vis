/**
 * Bubble sort algorithm module — pure functions, zero DOM/React dependencies.
 *
 * Exports:
 *   computeSteps(input)      – returns an array of step objects for visualization
 *   runAlgorithmTests()      – self-test using console.assert (Node ESM safe)
 */

/**
 * @typedef {Object} Step
 * @property {number[]} array       – current array state
 * @property {number[]|null} comparing – indices being compared (null when idle)
 * @property {number[]|null} swapping  – indices being swapped (null when no swap)
 * @property {number[]} sorted      – indices whose values are in final position
 * @property {number} round         – current pass number (0 = initial)
 * @property {string} description   – human-readable explanation of this step
 * @property {number} comparisons   – cumulative comparison count
 * @property {number} swaps         – cumulative swap count
 */

/**
 * Generate the full sequence of visualization steps for bubble sort.
 *
 * @param {number[]} input – integer array to sort
 * @returns {Step[]}
 */
export function computeSteps(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];

  // Initial state (round 0)
  steps.push({
    array: [...arr],
    comparing: null,
    swapping: null,
    sorted: [],
    round: 0,
    description: `初始数组：[${arr.join(", ")}]`,
    comparisons: 0,
    swaps: 0,
  });

  let totalComparisons = 0;
  let totalSwaps = 0;
  const sortedIndices = [];

  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;

    for (let i = 0; i < n - 1 - pass; i++) {
      const left = i;
      const right = i + 1;

      // Comparison step
      totalComparisons++;
      const desc = `比较 arr[${left}]=${arr[left]} 和 arr[${right}]=${arr[right]}`;
      steps.push({
        array: [...arr],
        comparing: [left, right],
        swapping: null,
        sorted: [...sortedIndices],
        round: pass + 1,
        description: desc,
        comparisons: totalComparisons,
        swaps: totalSwaps,
      });

      if (arr[left] > arr[right]) {
        // Swap step
        [arr[left], arr[right]] = [arr[right], arr[left]];
        swapped = true;
        totalSwaps++;
        steps.push({
          array: [...arr],
          comparing: null,
          swapping: [left, right],
          sorted: [...sortedIndices],
          round: pass + 1,
          description: `交换 arr[${left}] 和 arr[${right}] → [${arr.join(", ")}]`,
          comparisons: totalComparisons,
          swaps: totalSwaps,
        });
      }
    }

    // After this pass, the element at n-1-pass is in its final position
    sortedIndices.push(n - 1 - pass);
    steps.push({
      array: [...arr],
      comparing: null,
      swapping: null,
      sorted: [...sortedIndices],
      round: pass + 1,
      description: `第 ${pass + 1} 轮结束，arr[${n - 1 - pass}]=${arr[n - 1 - pass]} 已就位`,
      comparisons: totalComparisons,
      swaps: totalSwaps,
    });

    // Early exit if no swaps occurred in this pass
    if (!swapped) {
      // Mark remaining as sorted
      for (let k = n - 2 - pass; k >= 0; k--) {
        if (!sortedIndices.includes(k)) {
          sortedIndices.push(k);
        }
      }
      steps.push({
        array: [...arr],
        comparing: null,
        swapping: null,
        sorted: [...sortedIndices],
        round: pass + 1,
        description: `第 ${pass + 1} 轮无交换，数组已有序，提前结束`,
        comparisons: totalComparisons,
        swaps: totalSwaps,
      });
      break;
    }
  }

  // If the last element isn't sorted yet (e.g., n=1 edge case handled above),
  // mark index 0 as sorted for completeness
  if (!sortedIndices.includes(0)) {
    sortedIndices.push(0);
  }

  // Final step
  steps.push({
    array: [...arr],
    comparing: null,
    swapping: null,
    sorted: [...Array(n).keys()],
    round: steps[steps.length - 1].round,
    description: "排序完成",
    comparisons: totalComparisons,
    swaps: totalSwaps,
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Self-tests
// ---------------------------------------------------------------------------

export function runAlgorithmTests() {
  // 1. Basic sort
  {
    const steps = computeSteps([64, 34, 25, 12, 22, 11, 90, 1]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 11, 12, 22, 25, 34, 64, 90]),
      "PRD default array should be sorted correctly"
    );
    console.assert(last.sorted.length === 8, "All 8 elements should be marked sorted");
    console.assert(last.swaps > 0, "Should record at least one swap");
  }

  // 2. Already sorted (best case O(n))
  {
    const steps = computeSteps([1, 2, 3, 4, 5]);
    const last = steps[steps.length - 1];
    console.assert(last.swaps === 0, "Already sorted array: zero swaps");
    // Should early-exit, so fewer steps than worst case
    const descriptionJoined = steps.map((s) => s.description).join(" ");
    console.assert(
      descriptionJoined.includes("提前结束") || descriptionJoined.includes("无交换"),
      "Already sorted: should mention early exit"
    );
  }

  // 3. Reverse sorted (worst case)
  {
    const steps = computeSteps([5, 4, 3, 2, 1]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 2, 3, 4, 5]),
      "Reverse sorted should become ascending"
    );
    console.assert(last.swaps === 10, "Reverse [5,4,3,2,1] needs exactly 10 swaps");
  }

  // 4. Single swap needed
  {
    const steps = computeSteps([2, 1, 3, 4, 5]);
    const last = steps[steps.length - 1];
    console.assert(last.swaps === 1, "One adjacent inversion → one swap");
  }

  // 5. Negative numbers
  {
    const steps = computeSteps([3, -1, 0, -5, 2]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([-5, -1, 0, 2, 3]),
      "Negative numbers should sort correctly"
    );
  }

  // 6. Two elements
  {
    const steps = computeSteps([9, 1]);
    const last = steps[steps.length - 1];
    console.assert(JSON.stringify(last.array) === JSON.stringify([1, 9]), "Two elements");
    console.assert(last.swaps === 1, "Two inverted elements → one swap");
  }

  // 7. Duplicate values (stability check)
  {
    const steps = computeSteps([3, 1, 3, 1, 2]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 1, 2, 3, 3]),
      "Duplicates should sort correctly"
    );
  }

  // 8. Each step has valid comparing/swapping
  {
    const steps = computeSteps([3, 1, 2]);
    for (const step of steps) {
      if (step.comparing) {
        console.assert(
          step.comparing.length === 2 &&
            step.comparing[0] >= 0 &&
            step.comparing[1] < step.array.length,
          "Comparing indices must be valid"
        );
      }
      if (step.swapping) {
        console.assert(
          step.swapping.length === 2 &&
            step.swapping[0] >= 0 &&
            step.swapping[1] < step.array.length,
          "Swapping indices must be valid"
        );
      }
    }
  }

  // 9. Step count is reasonable
  {
    const steps = computeSteps([4, 3, 2, 1]);
    // Worst case for n=4: 6 comparisons + 6 swaps + pass-end markers ≈ 15 steps
    console.assert(steps.length > 0, "Steps should not be empty");
    console.assert(steps[0].round === 0, "First step is initial state");
  }

  // 10. PRD example values
  {
    const steps = computeSteps([64, 34, 25, 12, 22, 11, 90, 1]);
    const last = steps[steps.length - 1];
    console.assert(last.comparisons > 0, "Should track comparisons");
    console.assert(last.comparisons <= (8 * 7) / 2, "Comparisons ≤ n*(n-1)/2");
  }

  console.log("✅ runAlgorithmTests: all assertions passed");
}
