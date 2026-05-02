/**
 * Quick Sort algorithm module - pure functions, zero DOM/React dependencies.
 *
 * Exports:
 *   computeSteps(input)      - returns an array of step objects for visualization
 *   runAlgorithmTests()      - self-test using console.assert (Node ESM safe)
 */

/**
 * Generate the full sequence of visualization steps for quick sort.
 * Uses Lomuto partition scheme with first element as pivot.
 *
 * @param {number[]} input - integer array to sort
 * @returns {object[]} steps
 */
export function computeSteps(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sorted = new Set();
  let totalComparisons = 0;
  let totalSwaps = 0;

  steps.push({
    array: [...arr],
    pivot: null,
    range: [0, n - 1],
    comparing: null,
    swapping: null,
    partitioned: [],
    sorted: [...sorted],
    description: `初始数组：[${arr.join(", ")}]`,
    comparisons: 0,
    swaps: 0,
    recursionDepth: 0,
  });

  if (n <= 1) {
    for (let i = 0; i < n; i++) sorted.add(i);
    steps.push({
      array: [...arr],
      pivot: null,
      range: [0, n - 1],
      comparing: null,
      swapping: null,
      partitioned: [],
      sorted: [...sorted],
      description: n === 0 ? "空数组，无需排序" : "单元素数组，已有序",
      comparisons: 0,
      swaps: 0,
      recursionDepth: 0,
    });
    return steps;
  }

  // Use explicit stack to simulate recursion for step generation
  const stack = [{ lo: 0, hi: n - 1, depth: 0 }];

  while (stack.length > 0) {
    const { lo, hi, depth } = stack.pop();

    if (lo >= hi) {
      if (lo === hi) {
        sorted.add(lo);
        steps.push({
          array: [...arr],
          pivot: null,
          range: [lo, hi],
          comparing: null,
          swapping: null,
          partitioned: [],
          sorted: [...sorted],
          description: `子数组 [${lo}] 只有一个元素 ${arr[lo]}，标记为已排序`,
          comparisons: totalComparisons,
          swaps: totalSwaps,
          recursionDepth: depth,
        });
      }
      continue;
    }

    // Choose pivot (first element)
    const pivotIdx = lo;
    const pivotVal = arr[pivotIdx];

    steps.push({
      array: [...arr],
      pivot: pivotIdx,
      range: [lo, hi],
      comparing: null,
      swapping: null,
      partitioned: [],
      sorted: [...sorted],
      description: `选择 pivot = arr[${lo}] = ${pivotVal}，处理范围 [${lo}..${hi}]`,
      comparisons: totalComparisons,
      swaps: totalSwaps,
      recursionDepth: depth,
    });

    // Lomuto partition
    let i = lo + 1; // boundary for elements <= pivot

    for (let j = lo + 1; j <= hi; j++) {
      totalComparisons++;

      steps.push({
        array: [...arr],
        pivot: pivotIdx,
        range: [lo, hi],
        comparing: j,
        swapping: null,
        partitioned: [],
        sorted: [...sorted],
        description: `比较 arr[${j}]=${arr[j]} 与 pivot=${pivotVal}`,
        comparisons: totalComparisons,
        swaps: totalSwaps,
        recursionDepth: depth,
      });

      if (arr[j] <= pivotVal) {
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          totalSwaps++;

          steps.push({
            array: [...arr],
            pivot: pivotIdx,
            range: [lo, hi],
            comparing: null,
            swapping: [i, j],
            partitioned: [],
            sorted: [...sorted],
            description: `交换 arr[${i}]=${arr[j]} 和 arr[${j}]=${arr[i]}`,
            comparisons: totalComparisons,
            swaps: totalSwaps,
            recursionDepth: depth,
          });
        }
        i++;
      }
    }

    // Place pivot in its final position
    const finalPivotPos = i - 1;
    if (finalPivotPos !== pivotIdx) {
      [arr[pivotIdx], arr[finalPivotPos]] = [arr[finalPivotPos], arr[pivotIdx]];
      totalSwaps++;

      steps.push({
        array: [...arr],
        pivot: finalPivotPos,
        range: [lo, hi],
        comparing: null,
        swapping: [pivotIdx, finalPivotPos],
        partitioned: [finalPivotPos],
        sorted: [...sorted],
        description: `将 pivot ${pivotVal} 放到最终位置 arr[${finalPivotPos}]`,
        comparisons: totalComparisons,
        swaps: totalSwaps,
        recursionDepth: depth,
      });
    }

    sorted.add(finalPivotPos);

    steps.push({
      array: [...arr],
      pivot: finalPivotPos,
      range: [lo, hi],
      comparing: null,
      swapping: null,
      partitioned: [finalPivotPos],
      sorted: [...sorted],
      description: `分区完成：pivot ${pivotVal} 在位置 ${finalPivotPos}，左侧 [${lo}..${finalPivotPos - 1}] ≤ ${pivotVal}，右侧 [${finalPivotPos + 1}..${hi}] > ${pivotVal}`,
      comparisons: totalComparisons,
      swaps: totalSwaps,
      recursionDepth: depth,
    });

    // Push right subarray first (so left is processed first - stack is LIFO)
    if (finalPivotPos + 1 < hi) {
      stack.push({ lo: finalPivotPos + 1, hi, depth: depth + 1 });
    } else if (finalPivotPos + 1 === hi) {
      sorted.add(finalPivotPos + 1);
    }

    if (lo < finalPivotPos - 1) {
      stack.push({ lo, hi: finalPivotPos - 1, depth: depth + 1 });
    } else if (lo === finalPivotPos - 1) {
      sorted.add(lo);
    }
  }

  // Final step
  for (let i = 0; i < n; i++) sorted.add(i);
  steps.push({
    array: [...arr],
    pivot: null,
    range: [0, n - 1],
    comparing: null,
    swapping: null,
    partitioned: [],
    sorted: [...sorted],
    description: "排序完成",
    comparisons: totalComparisons,
    swaps: totalSwaps,
    recursionDepth: 0,
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Self-tests
// ---------------------------------------------------------------------------

export function runAlgorithmTests() {
  // 1. Default array from PRD
  {
    const steps = computeSteps([64, 34, 25, 12, 22, 11, 90, 1]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 11, 12, 22, 25, 34, 64, 90]),
      "Default array should be sorted correctly"
    );
    console.assert(last.sorted.length === 8, "All 8 elements should be marked sorted");
  }

  // 2. Already sorted
  {
    const steps = computeSteps([1, 2, 3, 4, 5]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 2, 3, 4, 5]),
      "Already sorted array stays sorted"
    );
    console.assert(last.sorted.length === 5, "All elements marked sorted");
  }

  // 3. Reverse sorted
  {
    const steps = computeSteps([5, 4, 3, 2, 1]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 2, 3, 4, 5]),
      "Reverse sorted should become ascending"
    );
  }

  // 4. Duplicate values
  {
    const steps = computeSteps([3, 1, 3, 1, 2]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 1, 2, 3, 3]),
      "Duplicates should sort correctly"
    );
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

  // 6. Single element
  {
    const steps = computeSteps([42]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([42]),
      "Single element array"
    );
    console.assert(last.sorted.length === 1, "Single element marked sorted");
  }

  // 7. Empty array
  {
    const steps = computeSteps([]);
    const last = steps[steps.length - 1];
    console.assert(last.array.length === 0, "Empty array remains empty");
  }

  // 8. Two elements
  {
    const steps = computeSteps([9, 1]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 9]),
      "Two elements"
    );
  }

  // 9. All equal elements
  {
    const steps = computeSteps([5, 5, 5, 5]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([5, 5, 5, 5]),
      "All equal elements remain unchanged"
    );
  }

  // 10. Step structure validation
  {
    const steps = computeSteps([3, 1, 2]);
    for (const step of steps) {
      console.assert(typeof step.array !== "undefined", "Step must have array");
      console.assert(typeof step.description === "string", "Step must have description");
      console.assert(typeof step.comparisons === "number", "Step must have comparisons count");
      console.assert(typeof step.swaps === "number", "Step must have swaps count");
      console.assert(typeof step.recursionDepth === "number", "Step must have recursionDepth");
      console.assert(Array.isArray(step.range), "Step must have range array");
      if (step.comparing !== null) {
        console.assert(
          step.comparing >= 0 && step.comparing < step.array.length,
          "Comparing index must be valid"
        );
      }
      if (step.swapping !== null) {
        console.assert(
          step.swapping.length === 2 &&
            step.swapping[0] >= 0 &&
            step.swapping[1] < step.array.length,
          "Swapping indices must be valid"
        );
      }
    }
  }

  // 11. Steps track comparisons and swaps
  {
    const steps = computeSteps([64, 34, 25, 12, 22, 11, 90, 1]);
    const last = steps[steps.length - 1];
    console.assert(last.comparisons > 0, "Should record comparisons");
    console.assert(last.swaps > 0, "Should record swaps");
  }

  // 12. Pivot selection and partitioning steps exist
  {
    const steps = computeSteps([4, 2, 7, 1, 3]);
    const pivotSteps = steps.filter((s) => s.description && s.description.includes("选择 pivot"));
    console.assert(pivotSteps.length > 0, "Should have pivot selection steps");
    const partitionSteps = steps.filter(
      (s) => s.description && s.description.includes("分区完成")
    );
    console.assert(partitionSteps.length > 0, "Should have partition completion steps");
  }

  console.log("✅ runAlgorithmTests: all assertions passed");
}
