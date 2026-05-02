/**
 * Prim MST Algorithm - Pure computation module
 * Zero DOM / React dependencies
 */

export const DEFAULT_GRAPH = {
  A: { B: 4, C: 2 },
  B: { A: 4, C: 1, D: 5, F: 7 },
  C: { A: 2, B: 1, D: 8, E: 10 },
  D: { B: 5, C: 8, F: 2 },
  E: { C: 10, F: 3 },
  F: { B: 7, D: 2, E: 3 },
};

export const DEFAULT_START = "A";

const INF = Infinity;

/**
 * Compute Prim MST steps for visualization.
 * O(V²) simple-array implementation.
 *
 * @param {Record<string, Record<string, number>>} graph - adjacency map { node: { neighbor: weight } }
 * @param {string} start - starting node
 * @returns {Array} array of step objects
 */
export function computeSteps(graph = DEFAULT_GRAPH, start = DEFAULT_START) {
  const nodes = Object.keys(graph);
  if (nodes.length === 0) return [];

  const n = nodes.length;

  // key[v] = minimum weight edge connecting v to the MST
  const key = {};
  // parent[v] = the MST node that connects v via key[v]
  const parent = {};
  // inMST[v] = whether v is already in the MST
  const inMST = {};

  for (const v of nodes) {
    key[v] = INF;
    parent[v] = null;
    inMST[v] = false;
  }

  const steps = [];

  // Helper: build candidates list from current key state
  function buildCandidates() {
    const candidates = [];
    for (const v of nodes) {
      if (!inMST[v] && key[v] < INF) {
        candidates.push({ node: v, weight: key[v], from: parent[v] });
      }
    }
    candidates.sort((a, b) => a.weight - b.weight);
    return candidates;
  }

  // Step 0: initialize with start node
  key[start] = 0;
  parent[start] = null;
  inMST[start] = true;
  // Relax edges from start node
  for (const [neighbor, weight] of Object.entries(graph[start] || {})) {
    if (!inMST[neighbor] && weight < key[neighbor]) {
      key[neighbor] = weight;
      parent[neighbor] = start;
    }
  }

  const mstNodes = [start];
  const mstEdges = [];

  steps.push({
    step: 0,
    currentNode: start,
    addedEdge: null,
    mstNodes: [...mstNodes],
    mstEdges: mstEdges.map((e) => [...e]),
    key: { ...key },
    parent: { ...parent },
    candidates: buildCandidates(),
    description: `初始化：选择起始节点 ${start}，将其加入 MST 集合。`,
  });

  // Main loop: select n-1 more nodes
  for (let i = 1; i < n; i++) {
    // Find the non-MST node with minimum key
    let minKey = INF;
    let selected = null;
    for (const v of nodes) {
      if (!inMST[v] && key[v] < minKey) {
        minKey = key[v];
        selected = v;
      }
    }

    // If no reachable node, graph is disconnected
    if (selected === null) {
      break;
    }

    // Add selected node to MST
    inMST[selected] = true;
    const edge = parent[selected] ? [parent[selected], selected] : null;
    if (edge) {
      mstNodes.push(selected);
      mstEdges.push(edge);
    } else {
      // Shouldn't happen for i >= 1 but guard
      mstNodes.push(selected);
    }

    // Relax edges from newly added node
    for (const [neighbor, weight] of Object.entries(graph[selected] || {})) {
      if (!inMST[neighbor] && weight < key[neighbor]) {
        key[neighbor] = weight;
        parent[neighbor] = selected;
      }
    }

    const totalWeight = mstEdges.reduce(
      (sum, [u, v]) => sum + (graph[u]?.[v] ?? graph[v]?.[u] ?? 0),
      0
    );

    steps.push({
      step: i,
      currentNode: selected,
      addedEdge: edge ? [...edge] : null,
      mstNodes: [...mstNodes],
      mstEdges: mstEdges.map((e) => [...e]),
      key: { ...key },
      parent: { ...parent },
      candidates: buildCandidates(),
      description: `选择最小 key 节点 ${selected}（key=${minKey}），通过边 ${edge ? `${edge[0]}-${edge[1]}` : "—"} 加入 MST。总权重: ${totalWeight}。`,
    });
  }

  // Final summary step
  const totalWeight = mstEdges.reduce(
    (sum, [u, v]) => sum + (graph[u]?.[v] ?? graph[v]?.[u] ?? 0),
    0
  );
  const complete = mstNodes.length === n;

  steps.push({
    step: steps.length,
    currentNode: null,
    addedEdge: null,
    mstNodes: [...mstNodes],
    mstEdges: mstEdges.map((e) => [...e]),
    key: { ...key },
    parent: { ...parent },
    candidates: [],
    description: complete
      ? `MST 构建完成！共 ${mstNodes.length} 个节点，${mstEdges.length} 条边，总权重 ${totalWeight}。`
      : `图不连通！MST 仅包含 ${mstNodes.length}/${n} 个节点，${mstEdges.length} 条边，总权重 ${totalWeight}。`,
  });

  return steps;
}

/**
 * Self-test function - runs via Node ESM import
 */
export function runAlgorithmTests() {
  // Test 1: Default graph - correct MST edges and total weight
  const steps = computeSteps();
  const finalStep = steps[steps.length - 1];
  console.assert(
    finalStep.mstEdges.length === 5,
    `Default graph MST should have 5 edges, got ${finalStep.mstEdges.length}`
  );
  console.assert(
    finalStep.mstNodes.length === 6,
    `Default graph MST should have 6 nodes, got ${finalStep.mstNodes.length}`
  );

  // Check total weight = 13
  const totalWeight = finalStep.mstEdges.reduce(
    (sum, [u, v]) => sum + (DEFAULT_GRAPH[u]?.[v] ?? DEFAULT_GRAPH[v]?.[u] ?? 0),
    0
  );
  console.assert(
    totalWeight === 13,
    `Default graph MST weight should be 13, got ${totalWeight}`
  );

  // Check MST edges (order-independent)
  const edgeSet = new Set(
    finalStep.mstEdges.map(([u, v]) => (u < v ? `${u}-${v}` : `${v}-${u}`))
  );
  const expectedEdges = ["A-C", "B-C", "B-D", "D-F", "E-F"];
  for (const e of expectedEdges) {
    console.assert(edgeSet.has(e), `MST should contain edge ${e}`);
  }

  // Test 2: First step is initialization with start node
  console.assert(steps[0].step === 0, "First step should be 0");
  console.assert(
    steps[0].currentNode === "A",
    `First step currentNode should be A, got ${steps[0].currentNode}`
  );
  console.assert(
    steps[0].addedEdge === null,
    "First step addedEdge should be null"
  );
  console.assert(
    steps[0].mstNodes.length === 1,
    "First step should have 1 MST node"
  );

  // Test 3: Steps should select nodes in correct Prim order
  // A -> C -> B -> D -> F -> E
  const expectedOrder = ["A", "C", "B", "D", "F", "E"];
  for (let i = 0; i < expectedOrder.length; i++) {
    console.assert(
      steps[i].currentNode === expectedOrder[i],
      `Step ${i} should select ${expectedOrder[i]}, got ${steps[i].currentNode}`
    );
  }

  // Test 4: Key values after initialization
  console.assert(
    steps[0].key.B === 4,
    `After init, key[B] should be 4, got ${steps[0].key.B}`
  );
  console.assert(
    steps[0].key.C === 2,
    `After init, key[C] should be 2, got ${steps[0].key.C}`
  );
  console.assert(
    steps[0].key.D === INF,
    `After init, key[D] should be Infinity, got ${steps[0].key.D}`
  );

  // Test 5: Key relaxation after step 1 (C selected)
  console.assert(
    steps[1].key.B === 1,
    `After C selected, key[B] should be 1, got ${steps[1].key.B}`
  );
  console.assert(
    steps[1].key.D === 8,
    `After C selected, key[D] should be 8, got ${steps[1].key.D}`
  );
  console.assert(
    steps[1].key.E === 10,
    `After C selected, key[E] should be 10, got ${steps[1].key.E}`
  );

  // Test 6: Key relaxation after step 2 (B selected)
  console.assert(
    steps[2].key.D === 5,
    `After B selected, key[D] should be 5, got ${steps[2].key.D}`
  );
  console.assert(
    steps[2].key.F === 7,
    `After B selected, key[F] should be 7, got ${steps[2].key.F}`
  );

  // Test 7: Key relaxation after step 3 (D selected)
  console.assert(
    steps[3].key.F === 2,
    `After D selected, key[F] should be 2, got ${steps[3].key.F}`
  );

  // Test 8: Single node graph
  const singleNodeSteps = computeSteps({ X: {} }, "X");
  console.assert(
    singleNodeSteps.length === 2,
    `Single node should produce 2 steps (init + final), got ${singleNodeSteps.length}`
  );
  console.assert(
    singleNodeSteps[0].currentNode === "X",
    "Single node step 0 currentNode should be X"
  );
  console.assert(
    singleNodeSteps[0].mstEdges.length === 0,
    "Single node MST should have 0 edges"
  );

  // Test 9: Disconnected graph
  const disconnectedGraph = {
    A: { B: 3 },
    B: { A: 3 },
    C: { D: 2 },
    D: { C: 2 },
  };
  const disconnectedSteps = computeSteps(disconnectedGraph, "A");
  const disconnectedFinal =
    disconnectedSteps[disconnectedSteps.length - 1];
  console.assert(
    disconnectedFinal.mstNodes.length === 2,
    `Disconnected graph MST should have 2 nodes, got ${disconnectedFinal.mstNodes.length}`
  );
  console.assert(
    disconnectedFinal.mstEdges.length === 1,
    `Disconnected graph MST should have 1 edge, got ${disconnectedFinal.mstEdges.length}`
  );

  // Test 10: Two-node graph
  const twoNodeSteps = computeSteps({ A: { B: 5 }, B: { A: 5 } }, "A");
  const twoNodeFinal = twoNodeSteps[twoNodeSteps.length - 1];
  console.assert(
    twoNodeFinal.mstEdges.length === 1,
    `Two node MST should have 1 edge, got ${twoNodeFinal.mstEdges.length}`
  );
  console.assert(
    twoNodeFinal.mstEdges[0][0] === "A" && twoNodeFinal.mstEdges[0][1] === "B",
    `Two node MST edge should be A-B, got ${twoNodeFinal.mstEdges[0]}`
  );

  // Test 11: Self-loops are ignored (graph has no self-loop entries)
  const selfLoopGraph = {
    A: { A: 10, B: 2 },
    B: { A: 2, B: 5 },
  };
  const selfLoopSteps = computeSteps(selfLoopGraph, "A");
  const selfLoopFinal = selfLoopSteps[selfLoopSteps.length - 1];
  console.assert(
    selfLoopFinal.mstNodes.length === 2,
    `Self-loop graph should include both nodes, got ${selfLoopFinal.mstNodes.length}`
  );
  console.assert(
    selfLoopFinal.mstEdges.length === 1,
    `Self-loop graph MST should have 1 edge, got ${selfLoopFinal.mstEdges.length}`
  );

  // Test 12: Steps have all required fields
  for (const step of steps) {
    console.assert(typeof step.step === "number", "step.step should be number");
    console.assert(
      typeof step.currentNode === "string" || step.currentNode === null,
      "step.currentNode should be string or null"
    );
    console.assert(
      Array.isArray(step.mstNodes),
      "step.mstNodes should be array"
    );
    console.assert(
      Array.isArray(step.mstEdges),
      "step.mstEdges should be array"
    );
    console.assert(
      typeof step.key === "object",
      "step.key should be object"
    );
    console.assert(
      typeof step.parent === "object",
      "step.parent should be object"
    );
    console.assert(
      Array.isArray(step.candidates),
      "step.candidates should be array"
    );
    console.assert(
      typeof step.description === "string",
      "step.description should be string"
    );
  }

  console.log("All Prim MST algorithm tests passed!");
}
