/**
 * Insertion sort algorithm module — pure functions, zero DOM/React dependencies.
 *
 * Exports:
 *   computeSteps(input)      – returns an array of step objects for visualization
 *   runAlgorithmTests()      – self-test using console.assert (Node ESM safe)
 */

/**
 * @typedef {Object} Step
 * @property {number[]} array          – current array state (null at key's original position when key is held aside)
 * @property {number} sortedEnd        – index where sorted portion ends (exclusive)
 * @property {number|null} current     – index of element being inserted (-1 when idle)
 * @property {number|null} comparing   – index being compared with key (-1 when idle)
 * @property {boolean} shifting        – whether a shift operation is happening
 * @property {boolean} inserting       – whether the key is being inserted into position
 * @property {string} description      – human-readable explanation of this step
 * @property {number} comparisons      – cumulative comparison count
 * @property {number} shifts           – cumulative shift count
 * @property {number|null} keyValue    – value of the key being held aside (null when idle)
 * @property {number|null} insertTarget – target index for insertion (null when not applicable)
 */

/**
 * Generate the full sequence of visualization steps for insertion sort.
 *
 * @param {number[]} input – integer array to sort
 * @returns {Step[]}
 */
export function computeSteps(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];

  // Initial state
  steps.push({
    array: [...arr],
    sortedEnd: 1,
    current: null,
    comparing: null,
    shifting: false,
    inserting: false,
    description: `初始数组：[${arr.join(", ")}]。索引 0 视为已排序区间。`,
    comparisons: 0,
    shifts: 0,
    keyValue: null,
    insertTarget: null,
  });

  let totalComparisons = 0;
  let totalShifts = 0;

  for (let i = 1; i < n; i++) {
    const key = arr[i];

    // Array with key position nulled out (key is "held aside")
    const heldArray = [...arr];
    heldArray[i] = null;

    // Announce picking the key
    steps.push({
      array: [...heldArray],
      sortedEnd: i,
      current: i,
      comparing: null,
      shifting: false,
      inserting: false,
      description: `取出 arr[${i}]=${key} 作为待插入元素（key）。`,
      comparisons: totalComparisons,
      shifts: totalShifts,
      keyValue: key,
      insertTarget: null,
    });

    let j = i - 1;

    // Compare and shift elements to the right
    while (j >= 0) {
      totalComparisons++;

      // Comparison step
      steps.push({
        array: [...heldArray],
        sortedEnd: i,
        current: i,
        comparing: j,
        shifting: false,
        inserting: false,
        description: `比较 arr[${j}]=${arr[j]} 与 key=${key}。`,
        comparisons: totalComparisons,
        shifts: totalShifts,
        keyValue: key,
        insertTarget: null,
      });

      if (arr[j] > key) {
        // Shift arr[j] to the right
        arr[j + 1] = arr[j];
        heldArray[j + 1] = arr[j + 1];
        heldArray[j] = null;
        totalShifts++;

        steps.push({
          array: [...heldArray],
          sortedEnd: i,
          current: i,
          comparing: j + 1,
          shifting: true,
          inserting: false,
          description: `arr[${j}]=${arr[j]} > key=${key}，将 arr[${j}] 右移到 arr[${j + 1}]。`,
          comparisons: totalComparisons,
          shifts: totalShifts,
          keyValue: key,
          insertTarget: null,
        });

        j--;
      } else {
        // Found the insertion point
        break;
      }
    }

    // Insert key at the correct position
    arr[j + 1] = key;

    steps.push({
      array: [...arr],
      sortedEnd: i + 1,
      current: j + 1,
      comparing: null,
      shifting: false,
      inserting: true,
      description: `将 key=${key} 插入到 arr[${j + 1}]。已排序区间扩展到 [0, ${i + 1})。`,
      comparisons: totalComparisons,
      shifts: totalShifts,
      keyValue: null,
      insertTarget: j + 1,
    });
  }

  // Final step
  steps.push({
    array: [...arr],
    sortedEnd: n,
    current: null,
    comparing: null,
    shifting: false,
    inserting: false,
    description: "排序完成。",
    comparisons: totalComparisons,
    shifts: totalShifts,
    keyValue: null,
    insertTarget: null,
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Self-tests
// ---------------------------------------------------------------------------

export function runAlgorithmTests() {
  // 1. PRD default example
  {
    const steps = computeSteps([38, 27, 43, 3, 9, 82, 10]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([3, 9, 10, 27, 38, 43, 82]),
      "PRD default array should be sorted correctly"
    );
    console.assert(last.sortedEnd === 7, "All 7 elements should be marked sorted");
    console.assert(last.shifts > 0, "Should record at least one shift");
  }

  // 2. Already sorted (best case O(n))
  {
    const steps = computeSteps([1, 2, 3, 4, 5]);
    const last = steps[steps.length - 1];
    console.assert(last.shifts === 0, "Already sorted array: zero shifts");
    console.assert(last.comparisons === 4, "Already sorted [1..5]: exactly 4 comparisons");
  }

  // 3. Reverse sorted (worst case)
  {
    const steps = computeSteps([5, 4, 3, 2, 1]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 2, 3, 4, 5]),
      "Reverse sorted should become ascending"
    );
    console.assert(last.shifts === 10, "Reverse [5,4,3,2,1] needs exactly 10 shifts");
    console.assert(last.comparisons === 10, "Reverse [5,4,3,2,1] needs exactly 10 comparisons");
  }

  // 4. Single element
  {
    const steps = computeSteps([42]);
    const last = steps[steps.length - 1];
    console.assert(JSON.stringify(last.array) === JSON.stringify([42]), "Single element");
    console.assert(last.shifts === 0, "Single element: zero shifts");
    console.assert(last.comparisons === 0, "Single element: zero comparisons");
  }

  // 5. Two elements sorted
  {
    const steps = computeSteps([1, 2]);
    const last = steps[steps.length - 1];
    console.assert(JSON.stringify(last.array) === JSON.stringify([1, 2]), "Two sorted elements");
    console.assert(last.shifts === 0, "Two sorted elements: zero shifts");
  }

  // 6. Two elements reversed
  {
    const steps = computeSteps([2, 1]);
    const last = steps[steps.length - 1];
    console.assert(JSON.stringify(last.array) === JSON.stringify([1, 2]), "Two reversed elements");
    console.assert(last.shifts === 1, "Two reversed elements: one shift");
  }

  // 7. Negative numbers
  {
    const steps = computeSteps([3, -1, 0, -5, 2]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([-5, -1, 0, 2, 3]),
      "Negative numbers should sort correctly"
    );
  }

  // 8. Duplicates (stability check)
  {
    const steps = computeSteps([3, 1, 3, 1, 2]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([1, 1, 2, 3, 3]),
      "Duplicates should sort correctly"
    );
  }

  // 9. Each step has valid indices
  {
    const steps = computeSteps([3, 1, 2]);
    for (const step of steps) {
      if (step.comparing !== null) {
        console.assert(
          step.comparing >= 0 && step.comparing < step.array.length,
          "Comparing index must be valid"
        );
      }
      if (step.current !== null) {
        console.assert(
          step.current >= 0 && step.current < step.array.length,
          "Current index must be valid"
        );
      }
    }
  }

  // 10. Step count is reasonable
  {
    const steps = computeSteps([4, 3, 2, 1]);
    console.assert(steps.length > 0, "Steps should not be empty");
    console.assert(steps[0].sortedEnd === 1, "First step has sortedEnd=1");
    console.assert(
      steps[steps.length - 1].description === "排序完成。",
      "Last step description should be '排序完成。'"
    );
  }

  // 11. All elements in range -999 to 999 (PRD constraint)
  {
    const steps = computeSteps([-999, 999, 0, -500, 500]);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify([-999, -500, 0, 500, 999]),
      "Boundary values should sort correctly"
    );
  }

  // 12. Maximum size (n=50) - just verify it doesn't crash
  {
    const bigInput = Array.from({ length: 50 }, (_, i) => 50 - i);
    const steps = computeSteps(bigInput);
    const last = steps[steps.length - 1];
    console.assert(
      JSON.stringify(last.array) === JSON.stringify(Array.from({ length: 50 }, (_, i) => i + 1)),
      "Max size reverse sorted should work"
    );
  }

  // 13. keyValue metadata: pick step sets keyValue, insert step clears it
  {
    const steps = computeSteps([3, 1, 2]);
    // Find pick steps (shifting=false, inserting=false, current!=null, comparing=null, keyValue!=null)
    const pickSteps = steps.filter(
      (s) => s.current !== null && s.comparing === null && !s.shifting && !s.inserting && s.keyValue !== null
    );
    console.assert(pickSteps.length === 2, `[3,1,2] should have 2 pick steps, got ${pickSteps.length}`);

    // Find insert steps (inserting=true)
    const insertSteps = steps.filter((s) => s.inserting);
    console.assert(insertSteps.length === 2, `[3,1,2] should have 2 insert steps, got ${insertSteps.length}`);
    for (const s of insertSteps) {
      console.assert(s.keyValue === null, "Insert step should have keyValue=null");
      console.assert(s.insertTarget !== null, "Insert step should have insertTarget set");
    }
  }

  // 14. keyValue during compare/shift steps: array has null at key position
  {
    const steps = computeSteps([5, 1, 3]);
    // Steps where keyValue is set and shifting or comparing
    const holdSteps = steps.filter(
      (s) => s.keyValue !== null && (s.shifting || s.comparing !== null)
    );
    console.assert(holdSteps.length > 0, "Should have hold steps with keyValue set");
    for (const s of holdSteps) {
      // The array should have null at the key's original position
      const nullCount = s.array.filter((v) => v === null).length;
      console.assert(nullCount === 1, `Hold step should have exactly 1 null in array, got ${nullCount}`);
    }
  }

  // 15. After insert, array has no nulls and keyValue is null
  {
    const steps = computeSteps([3, 1, 2]);
    for (const s of steps) {
      if (s.inserting) {
        const nullCount = s.array.filter((v) => v === null).length;
        console.assert(nullCount === 0, "Insert step array should have no nulls");
        console.assert(s.keyValue === null, "Insert step keyValue should be null");
      }
    }
    // Final step should have no nulls
    const final = steps[steps.length - 1];
    const nullCount = final.array.filter((v) => v === null).length;
    console.assert(nullCount === 0, "Final array should have no nulls");
    console.assert(final.keyValue === null, "Final keyValue should be null");
    console.assert(final.insertTarget === null, "Final insertTarget should be null");
  }

  // 16. insertTarget is the correct insertion index
  {
    const steps = computeSteps([3, 1, 2]);
    const insertSteps = steps.filter((s) => s.inserting);
    // First insert: key=1 goes to index 0 (before 3)
    console.assert(insertSteps[0].insertTarget === 0, `First insert target should be 0, got ${insertSteps[0].insertTarget}`);
    // Second insert: key=2 goes to index 1 (after 1, before 3)
    console.assert(insertSteps[1].insertTarget === 1, `Second insert target should be 1, got ${insertSteps[1].insertTarget}`);
  }

  // 17. Shift step comparing index points to a non-null element in heldArray
  {
    const steps = computeSteps([38, 27, 43]);
    const shiftSteps = steps.filter((s) => s.shifting);
    console.assert(shiftSteps.length > 0, `[38,27,43] should have shift steps, got ${shiftSteps.length}`);
    for (const s of shiftSteps) {
      console.assert(
        s.comparing !== null && s.array[s.comparing] !== null,
        `Shift step comparing=${s.comparing} must point to non-null element in heldArray, got ${s.array[s.comparing]}`
      );
    }
  }

  console.log("✅ runAlgorithmTests: all assertions passed");
}
