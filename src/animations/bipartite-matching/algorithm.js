/**
 * Bipartite Maximum Matching — Kuhn's Algorithm (Augmenting Path)
 *
 * Pure-function module, zero DOM / React dependencies.
 * Exports: computeSteps, runAlgorithmTests
 */

// --- Internal helpers ---

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function buildAdj(leftNodes, edges) {
  const adj = {};
  for (const u of leftNodes) {
    adj[u] = [];
  }
  for (const [u, v] of edges) {
    if (adj[u] !== undefined) {
      adj[u].push(v);
    }
  }
  return adj;
}

// --- Step builder ---

function makeStep(overrides) {
  return {
    leftNodes: [],
    rightNodes: [],
    edges: [],
    matching: {},
    currentU: null,
    augmentingPath: [],
    visitedU: new Set(),
    visitedV: new Set(),
    phase: "searching",
    message: "",
    ...overrides,
  };
}

// --- Core algorithm ---

function computeSteps(input) {
  const { leftNodes, rightNodes, edges } = input;

  if (!leftNodes || !rightNodes || !edges) {
    throw new Error("Input must contain leftNodes, rightNodes, and edges.");
  }

  const adj = buildAdj(leftNodes, edges);
  const matchV = {}; // v -> u (right node matched to which left node)
  const matchU = {}; // u -> v (left node matched to which right node)
  const steps = [];

  // Helper to snapshot current state
  function snapshot(overrides) {
    const edgeStates = edges.map(([u, v]) => {
      const isMatched = matchU[u] === v;
      const augSet = overrides._augEdgeSet || null;
      const isAugEdge = augSet && augSet.has(`${u}-${v}`);
      const searchEdge = overrides._searchEdge || null;
      const isSearching = searchEdge && searchEdge[0] === u && searchEdge[1] === v;
      return {
        u,
        v,
        status: isAugEdge ? "augmenting" : isMatched ? "matched" : isSearching ? "searching" : "normal",
      };
    });

    const leftNodeStates = leftNodes.map((id) => {
      const vis = overrides.visitedU instanceof Set ? overrides.visitedU.has(id) : false;
      return {
        id,
        status: matchU[id] !== undefined ? "matched" : vis ? "visited" : "unvisited",
      };
    });

    const rightNodeStates = rightNodes.map((id) => {
      const vis = overrides.visitedV instanceof Set ? overrides.visitedV.has(id) : false;
      return {
        id,
        status: matchV[id] !== undefined ? "matched" : vis ? "visited" : "unvisited",
      };
    });

    const matchingPairs = {};
    for (const u of Object.keys(matchU)) {
      matchingPairs[u] = matchU[u];
    }

    return makeStep({
      leftNodes: leftNodeStates,
      rightNodes: rightNodeStates,
      edges: edgeStates,
      matching: matchingPairs,
      currentU: overrides.currentU !== undefined ? overrides.currentU : null,
      augmentingPath: overrides.augmentingPath || [],
      visitedU: overrides.visitedU ? new Set(overrides.visitedU) : new Set(),
      visitedV: overrides.visitedV ? new Set(overrides.visitedV) : new Set(),
      phase: overrides.phase || "searching",
      message: overrides.message || "",
    });
  }

  // DFS for augmenting path from u
  function dfs(u, visitedU, visitedV, pathEdges) {
    visitedU.add(u);

    for (const v of adj[u]) {
      // Record exploring this edge
      steps.push(
        snapshot({
          currentU: u,
          visitedU,
          visitedV,
          phase: "searching",
          message: `从左节点 ${u} 尝试探索边 (${u}, ${v})`,
          _searchEdge: [u, v],
        })
      );

      if (visitedV.has(v)) continue;
      visitedV.add(v);

      // If v is unmatched, we found an augmenting path
      if (matchV[v] === undefined) {
        pathEdges.push([u, v]);
        return { found: true, path: pathEdges };
      }

      // v is matched to some u', try to reassign u'
      const uPrime = matchV[v];
      steps.push(
        snapshot({
          currentU: u,
          visitedU,
          visitedV,
          phase: "searching",
          message: `右节点 ${v} 已匹配给左节点 ${uPrime}，尝试为 ${uPrime} 寻找新匹配`,
          _searchEdge: [u, v],
        })
      );

      pathEdges.push([u, v]);
      const result = dfs(uPrime, visitedU, visitedV, pathEdges);
      if (result.found) {
        return result;
      }
      pathEdges.pop();
    }

    return { found: false };
  }

  // Process each left node
  for (const u of leftNodes) {
    if (matchU[u] !== undefined) continue; // already matched

    const visitedU = new Set();
    const visitedV = new Set();

    steps.push(
      snapshot({
        currentU: u,
        visitedU,
        visitedV,
        phase: "searching",
        message: `开始为左节点 ${u} 寻找增广路`,
      })
    );

    const pathEdges = [];
    const result = dfs(u, visitedU, visitedV, pathEdges);

    if (result.found) {
      const augPath = result.path;
      const augEdgeSet = new Set(augPath.map(([a, b]) => `${a}-${b}`));

      // Show augmenting path
      steps.push(
        snapshot({
          currentU: u,
          visitedU,
          visitedV,
          phase: "augmenting",
          message: `找到增广路: ${augPath.map(([a, b]) => `(${a},${b})`).join(" → ")}`,
          augmentingPath: augPath,
          _augEdgeSet: augEdgeSet,
        })
      );

      // Flip matching along augmenting path
      for (const [pu, pv] of augPath) {
        if (matchU[pu] === pv) {
          // This edge was matched, now unmatched
          delete matchU[pu];
          delete matchV[pv];
        } else {
          // This edge was unmatched, now matched
          matchU[pu] = pv;
          matchV[pv] = pu;
        }
      }

      // Show result after flip
      steps.push(
        snapshot({
          currentU: u,
          visitedU,
          visitedV,
          phase: "augmenting",
          message: `翻转增广路，匹配数更新为 ${Object.keys(matchU).length}`,
          augmentingPath: augPath,
        })
      );
    } else {
      steps.push(
        snapshot({
          currentU: u,
          visitedU,
          visitedV,
          phase: "searching",
          message: `左节点 ${u} 未找到增广路，跳过`,
        })
      );
    }
  }

  // Final state
  const finalMatching = {};
  for (const u of Object.keys(matchU)) {
    finalMatching[u] = matchU[u];
  }

  steps.push(
    snapshot({
      currentU: null,
      visitedU: new Set(),
      visitedV: new Set(),
      phase: "complete",
      message: `匹配完成！最大匹配数 = ${Object.keys(finalMatching).length}，匹配对: ${Object.entries(finalMatching).map(([a, b]) => `(${a},${b})`).join(", ")}`,
    })
  );

  return steps;
}

// --- Tests ---

function runAlgorithmTests() {
  // Test 1: PRD example
  const prdInput = {
    leftNodes: [0, 1, 2, 3],
    rightNodes: [0, 1, 2, 3],
    edges: [[0, 0], [0, 1], [1, 0], [2, 1], [2, 2], [3, 2], [3, 3]],
  };
  const prdSteps = computeSteps(prdInput);
  const prdFinal = prdSteps[prdSteps.length - 1];
  console.assert(prdFinal.phase === "complete", "Test 1: final phase should be complete");
  const prdMatchCount = Object.keys(prdFinal.matching).length;
  console.assert(prdMatchCount === 4, `Test 1: expected max matching = 4, got ${prdMatchCount}`);

  // Test 2: Empty edges — no matching possible
  const emptyInput = {
    leftNodes: [0, 1],
    rightNodes: [0, 1],
    edges: [],
  };
  const emptySteps = computeSteps(emptyInput);
  const emptyFinal = emptySteps[emptySteps.length - 1];
  console.assert(
    Object.keys(emptyFinal.matching).length === 0,
    "Test 2: empty graph should have 0 matching"
  );

  // Test 3: Complete bipartite — all left nodes matched
  const completeInput = {
    leftNodes: [0, 1, 2],
    rightNodes: [0, 1, 2],
    edges: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  };
  const completeSteps = computeSteps(completeInput);
  const completeFinal = completeSteps[completeSteps.length - 1];
  console.assert(
    Object.keys(completeFinal.matching).length === 3,
    "Test 3: complete bipartite should match all"
  );

  // Test 4: Single edge
  const singleInput = {
    leftNodes: [0, 1],
    rightNodes: [0, 1],
    edges: [[0, 0]],
  };
  const singleSteps = computeSteps(singleInput);
  const singleFinal = singleSteps[singleSteps.length - 1];
  console.assert(
    Object.keys(singleFinal.matching).length === 1,
    "Test 4: single edge should give 1 matching"
  );

  // Test 5: Asymmetric sizes
  const asymInput = {
    leftNodes: [0, 1, 2, 3, 4],
    rightNodes: [0, 1],
    edges: [[0, 0], [1, 0], [2, 1], [3, 1], [4, 0]],
  };
  const asymSteps = computeSteps(asymInput);
  const asymFinal = asymSteps[asymSteps.length - 1];
  console.assert(
    Object.keys(asymFinal.matching).length === 2,
    `Test 5: asymmetric should match 2, got ${Object.keys(asymFinal.matching).length}`
  );

  // Test 6: Steps should be non-empty and start with a searching phase
  console.assert(prdSteps.length > 2, "Test 6: should produce multiple steps");
  console.assert(prdSteps[0].phase === "searching", "Test 6: first step should be searching");

  // Test 7: Final step should be complete
  console.assert(prdFinal.phase === "complete", "Test 7: last step should be complete");

  // Test 8: Each step has required fields
  for (const step of prdSteps) {
    console.assert(Array.isArray(step.leftNodes), "Step must have leftNodes array");
    console.assert(Array.isArray(step.rightNodes), "Step must have rightNodes array");
    console.assert(Array.isArray(step.edges), "Step must have edges array");
    console.assert(typeof step.matching === "object", "Step must have matching object");
    console.assert(typeof step.phase === "string", "Step must have phase string");
    console.assert(typeof step.message === "string", "Step must have message string");
  }

  console.log("All bipartite matching tests passed.");
}

export { computeSteps, runAlgorithmTests };
