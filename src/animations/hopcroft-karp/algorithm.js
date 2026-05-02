// Hopcroft-Karp bipartite maximum matching - pure computation module
// Zero DOM, zero React dependency

const DEFAULT_INPUT = {
  leftNodes: ["U1", "U2", "U3", "U4"],
  rightNodes: ["V1", "V2", "V3", "V4"],
  edges: [
    ["U1", "V1"],
    ["U1", "V2"],
    ["U2", "V1"],
    ["U2", "V3"],
    ["U3", "V2"],
    ["U3", "V4"],
    ["U4", "V3"],
  ],
};

function createInitialState(input) {
  const { leftNodes, rightNodes, edges } = input;
  const adj = {};
  for (const u of leftNodes) {
    adj[u] = [];
  }
  for (const [u, v] of edges) {
    adj[u].push(v);
  }
  return {
    leftNodes: [...leftNodes],
    rightNodes: [...rightNodes],
    edges: edges.map(([u, v]) => [u, v]),
    adj,
  };
}

function buildMatchingArray(leftNodes, matchU) {
  const matching = [];
  for (const u of leftNodes) {
    if (matchU[u] !== null) {
      matching.push([u, matchU[u]]);
    }
  }
  return matching;
}

function computeSteps(input) {
  const { leftNodes, rightNodes, edges } = input;
  const { adj } = createInitialState(input);

  const matchU = {};
  const matchV = {};
  for (const u of leftNodes) matchU[u] = null;
  for (const v of rightNodes) matchV[v] = null;

  const steps = [];
  let stepNum = 0;

  steps.push({
    phase: "init",
    step: stepNum++,
    bfsLayer: {},
    currentNode: null,
    exploringEdge: null,
    matching: [],
    dist: {},
    augmentingPath: [],
    foundAugmenting: false,
    description: "初始化：所有节点未匹配，开始 Hopcroft-Karp 算法",
  });

  let iteration = 0;

  while (true) {
    iteration++;

    // === BFS Phase: build layered graph ===
    const dist = {};
    for (const u of leftNodes) dist[u] = Infinity;
    for (const v of rightNodes) dist[v] = Infinity;

    const queue = [];
    for (const u of leftNodes) {
      if (matchU[u] === null) {
        dist[u] = 0;
        queue.push(u);
      }
    }

    const bfsLayer = {};
    for (const u of queue) bfsLayer[u] = 0;

    const currentMatching = buildMatchingArray(leftNodes, matchU);

    steps.push({
      phase: "bfs",
      step: stepNum++,
      bfsLayer: { ...bfsLayer },
      currentNode: null,
      exploringEdge: null,
      matching: [...currentMatching],
      dist: { ...dist },
      augmentingPath: [],
      foundAugmenting: false,
      description: `第 ${iteration} 轮 BFS：从左集未匹配点 ${queue.join(", ")} 出发`,
    });

    // Level-by-level BFS
    let foundAugmenting = false;
    const INF = Infinity;

    while (queue.length > 0) {
      const u = queue.shift();

      // From left node u, explore via non-matching edges to right nodes
      for (const v of (adj[u] || [])) {
        if (dist[v] === INF) {
          dist[v] = dist[u] + 1;
          bfsLayer[v] = dist[v];

          steps.push({
            phase: "bfs",
            step: stepNum++,
            bfsLayer: { ...bfsLayer },
            currentNode: u,
            exploringEdge: [u, v],
            matching: [...currentMatching],
            dist: { ...dist },
            augmentingPath: [],
            foundAugmenting: false,
            description: `BFS 探索：${u} → ${v}（非匹配边），dist[${v}] = ${dist[v]}`,
          });

          // If v is unmatched, we found shortest augmenting path length
          if (matchV[v] === null) {
            foundAugmenting = true;
          } else {
            // Follow matching edge from v back to its matched left node
            const matchedU = matchV[v];
            if (dist[matchedU] === INF) {
              dist[matchedU] = dist[v] + 1;
              bfsLayer[matchedU] = dist[matchedU];
              queue.push(matchedU);

              steps.push({
                phase: "bfs",
                step: stepNum++,
                bfsLayer: { ...bfsLayer },
                currentNode: v,
                exploringEdge: [v, matchedU],
                matching: [...currentMatching],
                dist: { ...dist },
                augmentingPath: [],
                foundAugmenting: false,
                description: `BFS 沿匹配边：${v} → ${matchedU}，dist[${matchedU}] = ${dist[matchedU]}`,
              });
            }
          }
        }
      }
    }

    if (!foundAugmenting) {
      steps.push({
        phase: "bfs",
        step: stepNum++,
        bfsLayer: { ...bfsLayer },
        currentNode: null,
        exploringEdge: null,
        matching: [...currentMatching],
        dist: { ...dist },
        augmentingPath: [],
        foundAugmenting: false,
        description: `第 ${iteration} 轮 BFS 未找到增广路，算法终止`,
      });
      break;
    }

    // === DFS Phase: find augmenting paths along layered graph ===
    const used = new Set();
    let phaseAugmentCount = 0;

    function dfs(u) {
      for (const v of (adj[u] || [])) {
        if (used.has(v)) continue;

        // Only follow edges to the next BFS layer
        if (dist[v] !== dist[u] + 1) continue;

        steps.push({
          phase: "dfs",
          step: stepNum++,
          bfsLayer: { ...bfsLayer },
          currentNode: u,
          exploringEdge: [u, v],
          matching: buildMatchingArray(leftNodes, matchU),
          dist: { ...dist },
          augmentingPath: [],
          foundAugmenting: false,
          description: `DFS 探索：${u} → ${v}，检查是否沿分层图前进`,
        });

        if (matchV[v] === null) {
          // Found augmenting path endpoint - flip matching
          matchU[u] = v;
          matchV[v] = u;
          used.add(v);
          phaseAugmentCount++;

          const augMatching = buildMatchingArray(leftNodes, matchU);
          steps.push({
            phase: "dfs",
            step: stepNum++,
            bfsLayer: { ...bfsLayer },
            currentNode: v,
            exploringEdge: [u, v],
            matching: [...augMatching],
            dist: { ...dist },
            augmentingPath: [u, v],
            foundAugmenting: true,
            description: `找到增广路！翻转匹配：${u} ↔ ${v}，当前匹配数: ${augMatching.length}`,
          });

          return true;
        }

        const nextU = matchV[v];
        used.add(v);

        steps.push({
          phase: "dfs",
          step: stepNum++,
          bfsLayer: { ...bfsLayer },
          currentNode: nextU,
          exploringEdge: [v, nextU],
          matching: buildMatchingArray(leftNodes, matchU),
          dist: { ...dist },
          augmentingPath: [],
          foundAugmenting: false,
          description: `DFS 沿匹配边：${v} → ${nextU}`,
        });

        if (dfs(nextU)) {
          // Flip: match u-v (recursive call already handled the tail)
          matchU[u] = v;
          matchV[v] = u;

          const augMatching = buildMatchingArray(leftNodes, matchU);
          steps.push({
            phase: "dfs",
            step: stepNum++,
            bfsLayer: { ...bfsLayer },
            currentNode: u,
            exploringEdge: [u, v],
            matching: [...augMatching],
            dist: { ...dist },
            augmentingPath: [u, v, nextU],
            foundAugmenting: true,
            description: `翻转匹配：${u} ↔ ${v}，解除 ${nextU} ↔ ${v}`,
          });

          return true;
        }
      }
      return false;
    }

    for (const u of leftNodes) {
      if (matchU[u] === null) {
        dfs(u);
      }
    }

    const afterMatching = buildMatchingArray(leftNodes, matchU);
    steps.push({
      phase: "dfs",
      step: stepNum++,
      bfsLayer: { ...bfsLayer },
      currentNode: null,
      exploringEdge: null,
      matching: [...afterMatching],
      dist: { ...dist },
      augmentingPath: [],
      foundAugmenting: false,
      description: `第 ${iteration} 轮 DFS 完成，找到 ${phaseAugmentCount} 条增广路，当前匹配数: ${afterMatching.length}`,
    });
  }

  return steps;
}

function runAlgorithmTests() {
  // Test 1: Default example should have max matching = 4 (perfect matching)
  const steps = computeSteps(DEFAULT_INPUT);
  const finalStep = steps[steps.length - 1];
  console.assert(
    finalStep.matching.length === 4,
    `Default example should have matching size 4, got ${finalStep.matching.length}`
  );

  // Test 2: Verify matched pairs cover all nodes
  const matchedLeft = new Set(finalStep.matching.map(([u]) => u));
  const matchedRight = new Set(finalStep.matching.map(([, v]) => v));
  for (const u of DEFAULT_INPUT.leftNodes) {
    console.assert(matchedLeft.has(u), `Left node ${u} should be matched`);
  }
  for (const v of DEFAULT_INPUT.rightNodes) {
    console.assert(matchedRight.has(v), `Right node ${v} should be matched`);
  }

  // Test 3: Imperfect matching - remove some edges
  const imperfectInput = {
    leftNodes: ["U1", "U2", "U3"],
    rightNodes: ["V1", "V2", "V3"],
    edges: [["U1", "V1"], ["U2", "V1"], ["U3", "V2"]],
  };
  const imperfectSteps = computeSteps(imperfectInput);
  const imperfectFinal = imperfectSteps[imperfectSteps.length - 1];
  console.assert(
    imperfectFinal.matching.length === 2,
    `Imperfect matching should have size 2, got ${imperfectFinal.matching.length}`
  );

  // Test 4: Empty graph (no edges)
  const emptyInput = {
    leftNodes: ["U1", "U2"],
    rightNodes: ["V1", "V2"],
    edges: [],
  };
  const emptySteps = computeSteps(emptyInput);
  const emptyFinal = emptySteps[emptySteps.length - 1];
  console.assert(
    emptyFinal.matching.length === 0,
    `Empty graph should have matching size 0, got ${emptyFinal.matching.length}`
  );

  // Test 5: Single edge
  const singleInput = {
    leftNodes: ["U1"],
    rightNodes: ["V1"],
    edges: [["U1", "V1"]],
  };
  const singleSteps = computeSteps(singleInput);
  const singleFinal = singleSteps[singleSteps.length - 1];
  console.assert(
    singleFinal.matching.length === 1,
    `Single edge should have matching size 1, got ${singleFinal.matching.length}`
  );

  // Test 6: Complete bipartite graph K3,3
  const completeInput = {
    leftNodes: ["U1", "U2", "U3"],
    rightNodes: ["V1", "V2", "V3"],
    edges: [
      ["U1", "V1"],
      ["U1", "V2"],
      ["U1", "V3"],
      ["U2", "V1"],
      ["U2", "V2"],
      ["U2", "V3"],
      ["U3", "V1"],
      ["U3", "V2"],
      ["U3", "V3"],
    ],
  };
  const completeSteps = computeSteps(completeInput);
  const completeFinal = completeSteps[completeSteps.length - 1];
  console.assert(
    completeFinal.matching.length === 3,
    `Complete K3,3 should have matching size 3, got ${completeFinal.matching.length}`
  );

  // Test 7: Star graph - one left node connected to all right
  const starInput = {
    leftNodes: ["U1", "U2"],
    rightNodes: ["V1", "V2", "V3"],
    edges: [["U1", "V1"], ["U1", "V2"], ["U1", "V3"]],
  };
  const starSteps = computeSteps(starInput);
  const starFinal = starSteps[starSteps.length - 1];
  console.assert(
    starFinal.matching.length === 1,
    `Star graph should have matching size 1, got ${starFinal.matching.length}`
  );

  // Test 8: Every step has required fields
  for (const step of steps) {
    console.assert(typeof step.phase === "string", "step.phase should be string");
    console.assert(typeof step.step === "number", "step.step should be number");
    console.assert(typeof step.bfsLayer === "object", "step.bfsLayer should be object");
    console.assert(Array.isArray(step.matching), "step.matching should be array");
    console.assert(typeof step.dist === "object", "step.dist should be object");
    console.assert(Array.isArray(step.augmentingPath), "step.augmentingPath should be array");
    console.assert(typeof step.foundAugmenting === "boolean", "step.foundAugmenting should be boolean");
    console.assert(typeof step.description === "string", "step.description should be string");
  }

  // Test 9: Steps should have BFS and DFS phases
  const hasBfs = steps.some((s) => s.phase === "bfs");
  const hasDfs = steps.some((s) => s.phase === "dfs");
  console.assert(hasBfs, "Steps should include BFS phase");
  console.assert(hasDfs, "Steps should include DFS phase");

  // Test 10: Final step should have foundAugmenting = false (algorithm terminated)
  console.assert(
    finalStep.foundAugmenting === false,
    "Final step should indicate no augmenting path found"
  );

  // Test 11: Step numbers should be sequential
  for (let i = 0; i < steps.length; i++) {
    console.assert(steps[i].step === i, `Step ${i} should have step.step === ${i}, got ${steps[i].step}`);
  }

  // Test 12: Asymmetric graph - more left than right
  const asymInput = {
    leftNodes: ["U1", "U2", "U3", "U4", "U5"],
    rightNodes: ["V1", "V2"],
    edges: [["U1", "V1"], ["U2", "V1"], ["U3", "V1"], ["U4", "V2"], ["U5", "V2"]],
  };
  const asymSteps = computeSteps(asymInput);
  const asymFinal = asymSteps[asymSteps.length - 1];
  console.assert(
    asymFinal.matching.length === 2,
    `Asymmetric graph should have matching size 2, got ${asymFinal.matching.length}`
  );

  console.log("All Hopcroft-Karp algorithm tests passed.");
}

export { DEFAULT_INPUT, createInitialState, computeSteps, runAlgorithmTests };
