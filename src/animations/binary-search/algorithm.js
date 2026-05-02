/**
 * Binary search algorithm module — pure functions, zero DOM/React dependencies.
 *
 * Exports:
 *   computeSteps(array, target) – returns an array of step objects for visualization
 *   runAlgorithmTests()         – self-test using console.assert (Node ESM safe)
 */

/**
 * @typedef {Object} Step
 * @property {number} step          – step index (0 = initial)
 * @property {number[]} array       – sorted array (constant across steps)
 * @property {number} left          – left boundary index
 * @property {number} right         – right boundary index
 * @property {number|null} mid      – middle index (null on initial step)
 * @property {number|null} midValue – arr[mid] value (null on initial step)
 * @property {number} target        – target value
 * @property {'<'|'>'|'='|null} comparison – comparison result
 * @property {boolean} found        – whether target was found
 * @property {boolean} done         – whether search is finished
 * @property {number|null} foundIndex – index where target was found (null if not found)
 * @property {string} description   – human-readable explanation of this step
 */

/**
 * Generate the full sequence of visualization steps for binary search.
 *
 * @param {number[]} array – sorted integer array
 * @param {number} target  – value to search for
 * @returns {Step[]}
 */
export function computeSteps(array, target) {
  const arr = [...array];
  const n = arr.length;
  const steps = [];

  // Step 0: initial state
  steps.push({
    step: 0,
    array: [...arr],
    left: 0,
    right: n - 1,
    mid: null,
    midValue: null,
    target,
    comparison: null,
    found: false,
    done: n === 0,
    foundIndex: null,
    description: n === 0
      ? '数组为空，无法查找'
      : `初始状态：搜索范围 [0, ${n - 1}]，目标值 ${target}`,
  });

  if (n === 0) return steps;

  let left = 0;
  let right = n - 1;
  let stepIdx = 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = arr[mid];
    let comparison;
    let desc;

    if (midValue === target) {
      comparison = '=';
      desc = `arr[${mid}] = ${midValue} == ${target}，找到目标！`;
      steps.push({
        step: stepIdx,
        array: [...arr],
        left,
        right,
        mid,
        midValue,
        target,
        comparison,
        found: true,
        done: true,
        foundIndex: mid,
        description: desc,
      });
      return steps;
    } else if (midValue < target) {
      comparison = '<';
      desc = `arr[${mid}] = ${midValue} < ${target}，目标在右半部分，left = ${mid + 1}`;
      left = mid + 1;
    } else {
      comparison = '>';
      desc = `arr[${mid}] = ${midValue} > ${target}，目标在左半部分，right = ${mid - 1}`;
      right = mid - 1;
    }

    steps.push({
      step: stepIdx,
      array: [...arr],
      left,
      right,
      mid,
      midValue,
      target,
      comparison,
      found: false,
      done: left > right,
      foundIndex: null,
      description: desc,
    });

    stepIdx++;
  }

  // If we exit the loop without finding, add a final "not found" step
  const lastStep = steps[steps.length - 1];
  if (!lastStep.found) {
    steps.push({
      step: stepIdx,
      array: [...arr],
      left,
      right,
      mid: null,
      midValue: null,
      target,
      comparison: null,
      found: false,
      done: true,
      foundIndex: null,
      description: `搜索范围为空，未找到目标值 ${target}`,
    });
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Self-tests
// ---------------------------------------------------------------------------

export function runAlgorithmTests() {
  // 1. PRD example: find 12 in [-10,-3,0,5,8,12,25,37]
  {
    const arr = [-10, -3, 0, 5, 8, 12, 25, 37];
    const steps = computeSteps(arr, 12);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 12');
    console.assert(last.foundIndex === 5, '12 should be at index 5');
    console.assert(last.done === true, 'Should be done');
    console.assert(steps[0].mid === null, 'Initial step mid should be null');
    console.assert(steps[0].step === 0, 'Initial step index should be 0');
  }

  // 2. PRD example: find 5 (at index 3)
  {
    const arr = [-10, -3, 0, 5, 8, 12, 25, 37];
    const steps = computeSteps(arr, 5);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 5');
    console.assert(last.foundIndex === 3, '5 should be at index 3');
  }

  // 3. PRD example: search failure for 99
  {
    const arr = [-10, -3, 0, 5, 8, 12, 25, 37];
    const steps = computeSteps(arr, 99);
    const last = steps[steps.length - 1];
    console.assert(last.found === false, 'Should not find 99');
    console.assert(last.foundIndex === null, 'foundIndex should be null');
    console.assert(last.done === true, 'Should be done');
    // step 0 (initial) + up to floor(log2(n))+1 comparisons + final "not found" step
    console.assert(steps.length >= 2, 'Failure case should have at least 2 steps');
    console.assert(last.description.includes('未找到'), 'Last step should say not found');
  }

  // 4. Negative numbers
  {
    const arr = [-50, -20, -10, 0, 15, 30];
    const steps = computeSteps(arr, -20);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find -20');
    console.assert(last.foundIndex === 1, '-20 should be at index 1');
  }

  // 5. Negative target not in array
  {
    const arr = [-50, -20, -10, 0, 15, 30];
    const steps = computeSteps(arr, -15);
    const last = steps[steps.length - 1];
    console.assert(last.found === false, 'Should not find -15');
  }

  // 6. Single element array — found
  {
    const steps = computeSteps([42], 42);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 42 in single-element array');
    console.assert(last.foundIndex === 0, 'Should be at index 0');
  }

  // 7. Single element array — not found
  {
    const steps = computeSteps([42], 99);
    const last = steps[steps.length - 1];
    console.assert(last.found === false, 'Should not find 99 in [42]');
  }

  // 8. Empty array
  {
    const steps = computeSteps([], 5);
    console.assert(steps.length === 1, 'Empty array should have 1 step');
    console.assert(steps[0].done === true, 'Empty array should be done immediately');
    console.assert(steps[0].found === false, 'Empty array cannot find anything');
  }

  // 9. Two elements — found
  {
    const steps = computeSteps([1, 2], 2);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 2 in [1,2]');
    console.assert(last.foundIndex === 1, '2 should be at index 1');
  }

  // 10. Two elements — not found
  {
    const steps = computeSteps([1, 2], 3);
    const last = steps[steps.length - 1];
    console.assert(last.found === false, 'Should not find 3 in [1,2]');
  }

  // 11. Target at first position
  {
    const steps = computeSteps([1, 2, 3, 4, 5], 1);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 1');
    console.assert(last.foundIndex === 0, '1 should be at index 0');
  }

  // 12. Target at last position
  {
    const steps = computeSteps([1, 2, 3, 4, 5], 5);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 5');
    console.assert(last.foundIndex === 4, '5 should be at index 4');
  }

  // 13. Large array within PRD bounds (30 elements)
  {
    const arr = Array.from({ length: 30 }, (_, i) => i * 10 - 100);
    const steps = computeSteps(arr, 50);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 50');
    console.assert(last.foundIndex === 15, '50 should be at index 15');
    // Max steps for 30 elements: floor(log2(30)) + 1 ≈ 6
    console.assert(steps.length <= 7, `Steps for 30 elements should be ≤ 7, got ${steps.length}`);
  }

  // 14. Each step has valid left/right/mid
  {
    const arr = [-10, -3, 0, 5, 8, 12, 25, 37];
    const steps = computeSteps(arr, 5);
    for (const s of steps) {
      console.assert(s.left >= 0, 'left should be >= 0');
      console.assert(s.right < arr.length, 'right should be < array length');
      if (s.mid !== null) {
        console.assert(s.mid >= 0 && s.mid < arr.length, 'mid should be valid index');
      }
    }
  }

  // 15. Duplicate elements
  {
    const arr = [1, 2, 2, 2, 3];
    const steps = computeSteps(arr, 2);
    const last = steps[steps.length - 1];
    console.assert(last.found === true, 'Should find 2 in duplicates');
    // Should find one of the 2's
    console.assert(arr[last.foundIndex] === 2, 'Found index should contain 2');
  }

  // 16. PRD step structure completeness
  {
    const steps = computeSteps([1, 3, 5], 3);
    const requiredFields = [
      'step', 'array', 'left', 'right', 'mid', 'midValue',
      'target', 'comparison', 'found', 'done', 'foundIndex', 'description',
    ];
    for (const s of steps) {
      for (const field of requiredFields) {
        console.assert(field in s, `Step should have field: ${field}`);
      }
    }
  }

  // 17. Comparison values are correct
  {
    const steps = computeSteps([1, 5, 10], 5);
    const foundStep = steps.find((s) => s.comparison === '=');
    console.assert(foundStep !== undefined, 'Should have a step with comparison "="');
    console.assert(foundStep.midValue === 5, 'midValue should be 5');
  }

  console.log('✅ runAlgorithmTests: all assertions passed');
}
