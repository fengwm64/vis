/**
 * Kruskal MST Algorithm - Pure computation module
 * Zero DOM / React dependencies
 *
 * Uses Union-Find (path compression + union by rank) to detect cycles.
 */

export const DEFAULT_GRAPH = {
  vertices: ["A", "B", "C", "D", "E", "F"],
  edges: [
    { u: "A", v: "B", w: 4 },
    { u: "A", v: "C", w: 2 },
    { u: "B", v: "C", w: 1 },
    { u: "B", v: "D", w: 5 },
    { u: "C", v: "D", w: 8 },
    { u: "C", v: "E", w: 10 },
    { u: "D", v: "E", w: 3 },
    { u: "D", v: "F", w: 6 },
    { u: "E", v: "F", w: 7 },
    { u: "B", v: "F", w: 9 },
  ],
};

/**
 * Union-Find with path compression and union by rank.
 */
function createUnionFind(vertices) {
  const parent = {};
  const rank = {};
  for (const v of vertices) {
    parent[v] = v;
    rank[v] = 0;
  }

  function find(x) {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  }

  function union(x, y) {
    const rx = find(x);
    const ry = find(y);
    if (rx === ry) return false;
    if (rank[rx] < rank[ry]) {
      parent[rx] = ry;
    } else if (rank[rx] > rank[ry]) {
      parent[ry] = rx;
    } else {
      parent[ry] = rx;
      rank[rx]++;
    }
    return true;
  }

  function getComponents() {
    const comps = {};
    for (const v of vertices) {
      const root = find(v);
      if (!comps[root]) comps[root] = [];
      comps[root].push(v);
    }
    return comps;
  }

  return { find, union, getComponents, parent: () => ({ ...parent }), rank: () => ({ ...rank }) };
}

/**
 * Compute Kruskal MST steps for visualization.
 *
 * @param {{ vertices: string[], edges: Array<{u:string,v:string,w:number}> }} graph
 * @returns {Array} array of step objects
 */
export function computeSteps(graph = DEFAULT_GRAPH) {
  const { vertices, edges } = graph;
  if (vertices.length === 0) return [];

  // Sort edges by weight
  const sortedEdges = [...edges].sort((a, b) => a.w - b.w || a.u.localeCompare(b.u));

  const uf = createUnionFind(vertices);
  const steps = [];
  const mstEdges = [];

  // Step 0: initial state - show graph and sorted edge list
  steps.push({
    step: 0,
    phase: "init",
    currentEdge: null,
    accepted: null,
    mstEdges: [],
    components: uf.getComponents(),
    sortedEdges: sortedEdges.map((e) => ({ ...e })),
    mstEdgeCount: 0,
    totalWeight: 0,
    description: `初始状态：图有 ${vertices.length} 个顶点、${edges.length} 条边。边已按权重排序。`,
  });

  // Process each edge
  for (let i = 0; i < sortedEdges.length; i++) {
    const edge = sortedEdges[i];
    const canAdd = uf.find(edge.u) !== uf.find(edge.v);

    if (canAdd) {
      uf.union(edge.u, edge.v);
      mstEdges.push({ ...edge });
    }

    const totalWeight = mstEdges.reduce((sum, e) => sum + e.w, 0);

    steps.push({
      step: i + 1,
      phase: "consider",
      currentEdge: { ...edge },
      accepted: canAdd,
      mstEdges: mstEdges.map((e) => ({ ...e })),
      components: uf.getComponents(),
      sortedEdges: sortedEdges.map((e) => ({ ...e })),
      mstEdgeCount: mstEdges.length,
      totalWeight,
      description: canAdd
        ? `考虑边 ${edge.u}-${edge.v}（权重 ${edge.w}）：${edge.u} 和 ${edge.v} 属于不同连通分量，接受。MST 边数: ${mstEdges.length}，总权重: ${totalWeight}。`
        : `考虑边 ${edge.u}-${edge.v}（权重 ${edge.w}）：${edge.u} 和 ${edge.v} 已在同一连通分量，跳过（会形成环）。`,
    });

    // Early exit if MST is complete
    if (mstEdges.length === vertices.length - 1) break;
  }

  // Final summary step
  const totalWeight = mstEdges.reduce((sum, e) => sum + e.w, 0);
  const complete = mstEdges.length === vertices.length - 1;

  steps.push({
    step: steps.length,
    phase: "done",
    currentEdge: null,
    accepted: null,
    mstEdges: mstEdges.map((e) => ({ ...e })),
    components: uf.getComponents(),
    sortedEdges: sortedEdges.map((e) => ({ ...e })),
    mstEdgeCount: mstEdges.length,
    totalWeight,
    description: complete
      ? `MST 构建完成！共 ${mstEdges.length} 条边，总权重 ${totalWeight}。`
      : `图不连通！仅找到 ${mstEdges.length} 条边，总权重 ${totalWeight}。`,
  });

  return steps;
}

/**
 * Self-test function - runs via Node ESM import
 */
export function runAlgorithmTests() {
  // Test 1: Default graph - correct MST
  const steps = computeSteps();
  const finalStep = steps[steps.length - 1];

  console.assert(
    finalStep.mstEdges.length === 5,
    `Default graph MST should have 5 edges, got ${finalStep.mstEdges.length}`
  );
  console.assert(
    finalStep.totalWeight === 17,
    `Default graph MST weight should be 17, got ${finalStep.totalWeight}`
  );

  // Check MST edges (order-independent)
  const edgeSet = new Set(
    finalStep.mstEdges.map((e) => {
      const a = e.u < e.v ? e.u : e.v;
      const b = e.u < e.v ? e.v : e.u;
      return `${a}-${b}`;
    })
  );
  const expectedEdges = ["A-C", "B-C", "B-D", "D-E", "D-F"];
  for (const e of expectedEdges) {
    console.assert(edgeSet.has(e), `MST should contain edge ${e}`);
  }

  // Test 2: First step is init
  console.assert(steps[0].step === 0, "First step should be 0");
  console.assert(steps[0].phase === "init", "First phase should be init");
  console.assert(steps[0].currentEdge === null, "Init step currentEdge should be null");
  console.assert(steps[0].mstEdges.length === 0, "Init step should have 0 MST edges");

  // Test 3: Sorted edge order
  const firstConsider = steps[1];
  console.assert(
    firstConsider.currentEdge.u === "B" && firstConsider.currentEdge.v === "C" && firstConsider.currentEdge.w === 1,
    `First considered edge should be B-C(1), got ${firstConsider.currentEdge.u}-${firstConsider.currentEdge.v}(${firstConsider.currentEdge.w})`
  );
  console.assert(firstConsider.accepted === true, "First edge B-C should be accepted");

  // Test 4: Second edge A-C(2) accepted
  const secondConsider = steps[2];
  console.assert(
    secondConsider.currentEdge.u === "A" && secondConsider.currentEdge.v === "C" && secondConsider.currentEdge.w === 2,
    `Second edge should be A-C(2)`
  );
  console.assert(secondConsider.accepted === true, "A-C should be accepted");

  // Test 5: Third edge D-E(3) accepted
  const thirdConsider = steps[3];
  console.assert(
    thirdConsider.currentEdge.u === "D" && thirdConsider.currentEdge.v === "E" && thirdConsider.currentEdge.w === 3,
    `Third edge should be D-E(3)`
  );
  console.assert(thirdConsider.accepted === true, "D-E should be accepted");

  // Test 6: Fourth edge A-B(4) - A and B already in same component (via A-C-B), rejected
  const fourthConsider = steps[4];
  console.assert(
    fourthConsider.currentEdge.u === "A" && fourthConsider.currentEdge.v === "B" && fourthConsider.currentEdge.w === 4,
    `Fourth edge should be A-B(4)`
  );
  console.assert(fourthConsider.accepted === false, "A-B should be rejected (A and B already connected via A-C-B)");

  // Test 7: Fifth edge B-D(5) accepted - connects {A,B,C} to {D,E}
  const fifthConsider = steps[5];
  console.assert(
    fifthConsider.currentEdge.u === "B" && fifthConsider.currentEdge.v === "D" && fifthConsider.currentEdge.w === 5,
    `Fifth edge should be B-D(5)`
  );
  console.assert(fifthConsider.accepted === true, "B-D should be accepted");

  // Test 8: Sixth edge D-F(6) accepted - completes MST
  const sixthConsider = steps[6];
  console.assert(
    sixthConsider.currentEdge.u === "D" && sixthConsider.currentEdge.v === "F" && sixthConsider.currentEdge.w === 6,
    `Sixth edge should be D-F(6)`
  );
  console.assert(sixthConsider.accepted === true, "D-F should be accepted");

  // Test 9: After D-F accepted, MST is complete (5 edges for 6 vertices)
  console.assert(sixthConsider.mstEdges.length === 5, "After D-F, MST should have 5 edges");
  console.assert(sixthConsider.totalWeight === 17, "After D-F, total weight should be 17");

  // Test 10: Final step is done phase
  console.assert(finalStep.phase === "done", "Final step phase should be done");

  // Test 11: Two-node graph
  const twoNodeGraph = {
    vertices: ["X", "Y"],
    edges: [{ u: "X", v: "Y", w: 5 }],
  };
  const twoNodeSteps = computeSteps(twoNodeGraph);
  const twoNodeFinal = twoNodeSteps[twoNodeSteps.length - 1];
  console.assert(
    twoNodeFinal.mstEdges.length === 1,
    `Two node MST should have 1 edge, got ${twoNodeFinal.mstEdges.length}`
  );
  console.assert(
    twoNodeFinal.totalWeight === 5,
    `Two node MST weight should be 5, got ${twoNodeFinal.totalWeight}`
  );

  // Test 12: Disconnected graph
  const disconnectedGraph = {
    vertices: ["A", "B", "C", "D"],
    edges: [
      { u: "A", v: "B", w: 3 },
      { u: "C", v: "D", w: 2 },
    ],
  };
  const disconnectedSteps = computeSteps(disconnectedGraph);
  const disconnectedFinal = disconnectedSteps[disconnectedSteps.length - 1];
  console.assert(
    disconnectedFinal.mstEdges.length === 2,
    `Disconnected graph MST should have 2 edges, got ${disconnectedFinal.mstEdges.length}`
  );

  // Test 13: Steps have all required fields
  for (const step of steps) {
    console.assert(typeof step.step === "number", "step.step should be number");
    console.assert(typeof step.phase === "string", "step.phase should be string");
    console.assert(
      step.currentEdge === null || (typeof step.currentEdge.u === "string" && typeof step.currentEdge.v === "string"),
      "step.currentEdge should be null or have u,v strings"
    );
    console.assert(typeof step.accepted === "boolean" || step.accepted === null, "step.accepted should be boolean or null");
    console.assert(Array.isArray(step.mstEdges), "step.mstEdges should be array");
    console.assert(typeof step.components === "object", "step.components should be object");
    console.assert(Array.isArray(step.sortedEdges), "step.sortedEdges should be array");
    console.assert(typeof step.mstEdgeCount === "number", "step.mstEdgeCount should be number");
    console.assert(typeof step.totalWeight === "number", "step.totalWeight should be number");
    console.assert(typeof step.description === "string", "step.description should be string");
  }

  // Test 14: Four-node complete graph
  const completeGraph = {
    vertices: ["A", "B", "C", "D"],
    edges: [
      { u: "A", v: "B", w: 1 },
      { u: "A", v: "C", w: 4 },
      { u: "A", v: "D", w: 3 },
      { u: "B", v: "C", w: 2 },
      { u: "B", v: "D", w: 5 },
      { u: "C", v: "D", w: 6 },
    ],
  };
  const completeSteps = computeSteps(completeGraph);
  const completeFinal = completeSteps[completeSteps.length - 1];
  console.assert(
    completeFinal.mstEdges.length === 3,
    `Complete 4-node MST should have 3 edges, got ${completeFinal.mstEdges.length}`
  );
  console.assert(
    completeFinal.totalWeight === 6,
    `Complete 4-node MST weight should be 6 (1+2+3), got ${completeFinal.totalWeight}`
  );

  console.log("All Kruskal MST algorithm tests passed!");
}
