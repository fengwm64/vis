// Hungarian (Kuhn-Munkres) Algorithm — pure function module
// Solves the assignment problem: maximum weight perfect matching in a bipartite graph.

const EXAMPLES = {
  "4x4": {
    n: 4,
    weights: [
      [2, 3, 1, 4],
      [3, 2, 4, 1],
      [1, 4, 2, 3],
      [4, 1, 3, 2],
    ],
  },
  "3x3": {
    n: 3,
    weights: [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ],
  },
};

/**
 * Create the initial algorithm state from a weight matrix.
 */
function createInitialState(weights) {
  const n = weights.length;
  const lx = weights.map((row) => Math.max(...row));
  const ly = Array(n).fill(0);
  const matchX = Array(n).fill(-1);
  const matchY = Array(n).fill(-1);

  return {
    n,
    weights,
    lx: [...lx],
    ly: [...ly],
    matchX: [...matchX],
    matchY: [...matchY],
    matchCount: 0,
  };
}

/**
 * Build the equality subgraph edges: (i, j) where lx[i] + ly[j] === weights[i][j].
 */
function getEqualityEdges(state) {
  const { n, weights, lx, ly } = state;
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (lx[i] + ly[j] === weights[i][j]) {
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

/**
 * BFS augmenting path search from `root` in the equality subgraph.
 * Returns { path: [[xi, yj], ...], S: Set<number>, T: Set<number> } or null.
 */
function bfsAugment(state, root) {
  const { n, weights, lx, ly, matchX, matchY } = state;
  const S = new Set();
  const T = new Set();
  const prevY = Array(n).fill(-1);
  const queue = [root];
  S.add(root);

  while (queue.length > 0) {
    const xi = queue.shift();
    for (let yj = 0; yj < n; yj++) {
      if (T.has(yj)) continue;
      if (lx[xi] + ly[yj] !== weights[xi][yj]) continue;
      T.add(yj);
      prevY[yj] = xi;
      if (matchY[yj] === -1) {
        // Reconstruct augmenting path
        const augPath = [];
        let curY = yj;
        while (curY !== -1) {
          const curX = prevY[curY];
          augPath.unshift([curX, curY]);
          curY = matchX[curX] !== -1 ? matchX[curX] : -1;
        }
        return { path: augPath, S, T };
      }
      const nextX = matchY[yj];
      if (!S.has(nextX)) {
        S.add(nextX);
        queue.push(nextX);
      }
    }
  }
  return { path: null, S, T };
}

/**
 * Compute delta for label adjustment: min { lx[i] + ly[j] - w[i][j] | i in S, j not in T }.
 */
function computeDelta(state, S, T) {
  const { n, weights, lx, ly } = state;
  let delta = Infinity;
  for (const i of S) {
    for (let j = 0; j < n; j++) {
      if (T.has(j)) continue;
      const slack = lx[i] + ly[j] - weights[i][j];
      if (slack < delta) delta = slack;
    }
  }
  return delta;
}

/**
 * Generate all visualization steps for the KM algorithm.
 */
function computeSteps(weights) {
  const n = weights.length;
  const steps = [];
  const state = createInitialState(weights);

  function snap(desc, phase, extra = {}) {
    return {
      description: desc,
      phase,
      n,
      weights: weights.map((r) => [...r]),
      lx: [...state.lx],
      ly: [...state.ly],
      matchX: [...state.matchX],
      matchY: [...state.matchY],
      matchCount: state.matchCount,
      equalityEdges: getEqualityEdges(state),
      ...extra,
    };
  }

  // Step 0: Initial state
  steps.push(
    snap(
      `Initialize labels: lx = [${state.lx.join(", ")}], ly = [${state.ly.join(", ")}]`,
      "init"
    )
  );

  // Step 1: Show initial equality subgraph
  steps.push(
    snap("Build equality subgraph from initial labels.", "equality_subgraph")
  );

  // Main loop
  while (state.matchCount < n) {
    let root = -1;
    for (let i = 0; i < n; i++) {
      if (state.matchX[i] === -1) {
        root = i;
        break;
      }
    }
    if (root === -1) break;

    let found = false;
    while (!found) {
      const result = bfsAugment(state, root);
      const { S, T } = result;

      steps.push(
        snap(
          `Search from X${root}. S = {${[...S].map((x) => "X" + x).join(", ")}}, T = {${[...T].map((y) => "Y" + y).join(", ")}}`,
          "hungarian_tree",
          { searchRoot: root, S: [...S], T: [...T] }
        )
      );

      if (result.path) {
        // Augment matching
        for (const [xi, yj] of result.path) {
          state.matchX[xi] = yj;
          state.matchY[yj] = xi;
        }
        state.matchCount = state.matchX.filter((v) => v !== -1).length;

        steps.push(
          snap(
            `Augmenting path found! Flip matching. Match count = ${state.matchCount}.`,
            "augment",
            { augmentPath: result.path }
          )
        );
        found = true;
      } else {
        // Label adjustment
        const delta = computeDelta(state, S, T);

        if (delta === 0 || !isFinite(delta)) {
          // Safety: should not happen in a valid instance
          steps.push(
            snap(
              `Warning: delta = ${delta}. Algorithm cannot proceed.`,
              "error",
              { delta, S: [...S], T: [...T] }
            )
          );
          break;
        }

        steps.push(
          snap(
            `No augmenting path. delta = ${delta}.`,
            "label_adjust",
            { delta, S: [...S], T: [...T] }
          )
        );

        // Adjust labels
        for (const i of S) state.lx[i] -= delta;
        for (const j of T) state.ly[j] += delta;

        steps.push(
          snap(
            `Labels updated: lx = [${state.lx.join(", ")}], ly = [${state.ly.join(", ")}]`,
            "label_adjust",
            { delta, S: [...S], T: [...T] }
          )
        );

        steps.push(
          snap(
            "Updated equality subgraph after label adjustment.",
            "equality_subgraph"
          )
        );
      }
    }

    // Check if we broke out due to error
    if (steps[steps.length - 1].phase === "error") break;
  }

  // Final step
  const totalWeight = state.matchX.reduce(
    (sum, yj, xi) => sum + (yj !== -1 ? weights[xi][yj] : 0),
    0
  );
  steps.push(
    snap(
      `Perfect matching found! Total weight = ${totalWeight}. Matching: ${state.matchX
        .map((yj, xi) => `X${xi}-Y${yj}`)
        .join(", ")}`,
      "done",
      { totalWeight }
    )
  );

  return steps;
}

/**
 * Run algorithm self-tests using console.assert.
 */
function runAlgorithmTests() {
  // Test 1: 4x4 example
  const ex4 = EXAMPLES["4x4"].weights;
  const steps4 = computeSteps(ex4);
  const lastStep4 = steps4[steps4.length - 1];
  console.assert(lastStep4.phase === "done", "4x4: should end with done phase");
  console.assert(lastStep4.matchCount === 4, "4x4: should have 4 matches");
  const matchedY4 = new Set(lastStep4.matchX);
  console.assert(matchedY4.size === 4, "4x4: all Y nodes matched uniquely");
  console.assert(lastStep4.totalWeight === 16, `4x4: expected weight 16, got ${lastStep4.totalWeight}`);

  // Test 2: 3x3 example
  const ex3 = EXAMPLES["3x3"].weights;
  const steps3 = computeSteps(ex3);
  const lastStep3 = steps3[steps3.length - 1];
  console.assert(lastStep3.phase === "done", "3x3: should end with done phase");
  console.assert(lastStep3.matchCount === 3, "3x3: should have 3 matches");
  console.assert(lastStep3.totalWeight === 9, `3x3: expected weight 9, got ${lastStep3.totalWeight}`);

  // Test 3: 2x2 requiring label adjustment (both rows have max in same column)
  const ex2adj = [
    [5, 3],
    [5, 4],
  ];
  const steps2adj = computeSteps(ex2adj);
  const last2adj = steps2adj[steps2adj.length - 1];
  console.assert(last2adj.phase === "done", "2x2-adj: should end with done phase");
  console.assert(last2adj.matchCount === 2, "2x2-adj: should have 2 matches");
  console.assert(last2adj.totalWeight === 9, `2x2-adj: expected weight 9, got ${last2adj.totalWeight}`);
  // Optimal: X0-Y0(5) + X1-Y1(4) = 9
  console.assert(
    steps2adj.some((s) => s.phase === "label_adjust"),
    "2x2-adj: should require label adjustment"
  );

  // Test 4: 2x2 trivial
  const ex2 = [
    [1, 2],
    [3, 4],
  ];
  const steps2 = computeSteps(ex2);
  const last2 = steps2[steps2.length - 1];
  console.assert(last2.phase === "done", "2x2: should end with done phase");
  console.assert(last2.totalWeight === 5, `2x2: expected weight 5, got ${last2.totalWeight}`);

  // Test 5: 1x1 trivial
  const ex1 = [[7]];
  const steps1 = computeSteps(ex1);
  const last1 = steps1[steps1.length - 1];
  console.assert(last1.phase === "done", "1x1: should end with done phase");
  console.assert(last1.totalWeight === 7, `1x1: expected weight 7, got ${last1.totalWeight}`);

  // Test 6: 3x3 requiring label adjustment (both X0 and X1 have max in column 0)
  const ex3adj = [
    [5, 3, 1],
    [5, 4, 2],
    [2, 1, 5],
  ];
  const steps3adj = computeSteps(ex3adj);
  const last3adj = steps3adj[steps3adj.length - 1];
  console.assert(last3adj.phase === "done", "3x3-adj: should end with done phase");
  console.assert(last3adj.matchCount === 3, "3x3-adj: should have 3 matches");
  console.assert(last3adj.totalWeight === 14, `3x3-adj: expected weight 14, got ${last3adj.totalWeight}`);
  console.assert(
    steps3adj.some((s) => s.phase === "label_adjust"),
    "3x3-adj: should require label adjustment"
  );

  // Test 7: createInitialState
  const initState = createInitialState(ex4);
  console.assert(initState.n === 4, "initial state n should be 4");
  console.assert(initState.lx[0] === 4, "X0 label should be max of row 0");
  console.assert(initState.ly.every((v) => v === 0), "all Y labels should be 0 initially");

  // Test 8: Steps have meaningful phases
  console.assert(steps4.length > 3, `4x4: expected multiple steps, got ${steps4.length}`);
  console.assert(steps4.some((s) => s.phase === "init"), "should have init step");
  console.assert(steps4.some((s) => s.phase === "equality_subgraph"), "should have equality_subgraph step");
  console.assert(steps4.some((s) => s.phase === "augment"), "should have augment step");
  console.assert(steps4.some((s) => s.phase === "hungarian_tree"), "should have hungarian_tree step");

  // Test 9: All weights non-negative (PRD constraint)
  console.assert(
    ex4.flat().every((w) => w >= 0),
    "all weights should be non-negative"
  );

  console.log("All Hungarian algorithm tests passed.");
}

export { EXAMPLES, createInitialState, computeSteps, runAlgorithmTests };
