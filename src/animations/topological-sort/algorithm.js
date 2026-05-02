/**
 * Topological Sort (Kahn's Algorithm) — pure function module, zero DOM / React deps
 *
 * Exports:
 *   computeSteps(input) → steps[]
 *   runAlgorithmTests()
 */

// ── Default examples ──

const DEFAULT_EXAMPLE = {
  label: "课程依赖图",
  nodes: ["0", "1", "2", "3", "4", "5"],
  edges: [
    ["0", "2"],
    ["1", "2"],
    ["2", "3"],
    ["2", "4"],
    ["3", "5"],
    ["4", "5"],
  ],
};

const ALT_EXAMPLE = {
  label: "多源节点图",
  nodes: ["A", "B", "C", "D", "E"],
  edges: [
    ["A", "C"],
    ["B", "C"],
    ["C", "D"],
    ["D", "E"],
  ],
};

const CYCLE_EXAMPLE = {
  label: "含环图",
  nodes: ["0", "1", "2"],
  edges: [
    ["0", "1"],
    ["1", "2"],
    ["2", "0"],
  ],
};

const EXAMPLES = [DEFAULT_EXAMPLE, ALT_EXAMPLE, CYCLE_EXAMPLE];

export { EXAMPLES };

/**
 * Build directed adjacency list and in-degree map
 */
function buildGraph(nodes, edges) {
  const adj = Object.fromEntries(nodes.map((id) => [id, []]));
  const inDeg = Object.fromEntries(nodes.map((id) => [id, 0]));
  for (const [u, v] of edges) {
    adj[u].push(v);
    inDeg[v] += 1;
  }
  // Sort neighbours for deterministic output
  for (const id of nodes) {
    adj[id].sort();
  }
  return { adj, inDeg };
}

/**
 * Generate step-by-step snapshots for Kahn's topological sort
 *
 * @param {{ nodes?: string[], edges?: [string, string][] }} input
 * @returns {Array<{
 *   nodes: Array<{ id: string, state: string }>,
 *   inDegrees: Record<string, number>,
 *   queue: string[],
 *   sorted: string[],
 *   removedEdges: [string, string][],
 *   currentEdge: [string, string] | null,
 *   hasCycle: boolean,
 *   description: string
 * }>}
 */
export function computeSteps(input = {}) {
  const nodes = input.nodes ?? DEFAULT_EXAMPLE.nodes;
  const edges = input.edges ?? DEFAULT_EXAMPLE.edges;
  const { adj, inDeg: inDegrees } = buildGraph(nodes, edges);

  // Mutable state tracked during computation
  /** @type {Record<string, string>} default | zero | processing | sorted | cycle */
  const nodeState = Object.fromEntries(nodes.map((id) => [id, "default"]));
  const currentInDeg = { ...inDegrees };
  const queue = [];
  const sorted = [];
  const removedEdges = [];

  const steps = [];

  function snap(desc, currentEdge = null, hasCycle = false) {
    steps.push({
      nodes: nodes.map((id) => ({ id, state: nodeState[id] })),
      inDegrees: { ...currentInDeg },
      queue: [...queue],
      sorted: [...sorted],
      removedEdges: removedEdges.map((e) => [...e]),
      currentEdge: currentEdge ? [...currentEdge] : null,
      hasCycle,
      description: desc,
    });
  }

  // Step 0: initial state — compute in-degrees
  snap("初始状态：计算所有节点的入度");

  // Find all zero-in-degree nodes and mark them
  for (const id of nodes) {
    if (currentInDeg[id] === 0) {
      nodeState[id] = "zero";
      queue.push(id);
    }
  }
  // Sort queue for deterministic order
  queue.sort();

  if (queue.length > 0) {
    snap(`入度为 0 的节点 [${queue.join(", ")}] 加入队列`);
  } else if (nodes.length > 0) {
    snap("所有节点入度均不为 0，图中存在环", null, true);
    // Mark all remaining as cycle
    for (const id of nodes) {
      nodeState[id] = "cycle";
    }
    snap("检测到环，拓扑排序失败", null, true);
    return steps;
  }

  // Kahn's main loop
  while (queue.length > 0) {
    const current = queue.shift();
    nodeState[current] = "processing";
    snap(`取出队首节点 ${current}，标记为处理中`);

    // Add to sorted sequence
    sorted.push(current);

    // Process all outgoing edges
    const neighbors = adj[current] ?? [];
    const newlyZero = [];

    for (const neighbor of neighbors) {
      removedEdges.push([current, neighbor]);
      currentInDeg[neighbor] -= 1;
      snap(
        `移除边 ${current}→${neighbor}，${neighbor} 入度减为 ${currentInDeg[neighbor]}`,
        [current, neighbor]
      );

      if (currentInDeg[neighbor] === 0) {
        nodeState[neighbor] = "zero";
        newlyZero.push(neighbor);
        queue.push(neighbor);
        queue.sort();
      }
    }

    // Mark current as sorted
    nodeState[current] = "sorted";

    if (newlyZero.length > 0) {
      snap(
        `节点 ${current} 加入拓扑序列，新入度为 0 的节点 [${newlyZero.join(", ")}] 加入队列`
      );
    } else if (queue.length > 0) {
      snap(`节点 ${current} 加入拓扑序列，队列剩余 [${queue.join(", ")}]`);
    } else {
      snap(`节点 ${current} 加入拓扑序列`);
    }
  }

  // Check for cycle
  if (sorted.length < nodes.length) {
    const remaining = nodes.filter((id) => nodeState[id] !== "sorted");
    for (const id of remaining) {
      nodeState[id] = "cycle";
    }
    snap(
      `拓扑序列长度 ${sorted.length} < 节点数 ${nodes.length}，图中存在环。未排序节点：[${remaining.join(", ")}]`,
      null,
      true
    );
  } else {
    snap("拓扑排序完成");
  }

  return steps;
}

/**
 * Self-test function — uses console.assert
 */
export function runAlgorithmTests() {
  // ── Default example: should produce valid topological order ──
  const steps = computeSteps();
  const last = steps[steps.length - 1];
  console.assert(
    last.sorted.length === 6,
    `默认图应排序 6 个节点，实际: ${last.sorted.length}`
  );
  console.assert(
    !last.hasCycle,
    `默认图不应有环`
  );
  // Validate topological property: for each edge u→v, u comes before v
  const pos = Object.fromEntries(last.sorted.map((id, i) => [id, i]));
  const defaultEdges = DEFAULT_EXAMPLE.edges;
  for (const [u, v] of defaultEdges) {
    console.assert(
      pos[u] < pos[v],
      `违反拓扑序：${u}(pos ${pos[u]}) 应在 ${v}(pos ${pos[v]}) 之前`
    );
  }

  // ── Steps should have meaningful content ──
  console.assert(
    steps.length > 6,
    `步骤数应大于 6，实际: ${steps.length}`
  );

  // ── Initial state ──
  const s0 = steps[0];
  console.assert(
    s0.sorted.length === 0,
    "初始状态拓扑序列应为空"
  );

  // ── Cycle example ──
  const cycleSteps = computeSteps(CYCLE_EXAMPLE);
  const cycleLast = cycleSteps[cycleSteps.length - 1];
  console.assert(
    cycleLast.hasCycle,
    "含环图应检测到环"
  );
  console.assert(
    cycleLast.sorted.length < 3,
    `含环图排序数应 < 3，实际: ${cycleLast.sorted.length}`
  );

  // ── Alternative example ──
  const altSteps = computeSteps(ALT_EXAMPLE);
  const altLast = altSteps[altSteps.length - 1];
  console.assert(
    altLast.sorted.length === 5,
    `备选图应排序 5 个节点，实际: ${altLast.sorted.length}`
  );
  console.assert(
    !altLast.hasCycle,
    "备选图不应有环"
  );
  // Validate topological property
  const altPos = Object.fromEntries(altLast.sorted.map((id, i) => [id, i]));
  for (const [u, v] of ALT_EXAMPLE.edges) {
    console.assert(
      altPos[u] < altPos[v],
      `备选图违反拓扑序：${u} 应在 ${v} 之前`
    );
  }

  // ── Empty graph ──
  const emptySteps = computeSteps({ nodes: [], edges: [] });
  const emptyLast = emptySteps[emptySteps.length - 1];
  console.assert(
    emptyLast.sorted.length === 0,
    "空图排序结果应为空"
  );
  console.assert(
    !emptyLast.hasCycle,
    "空图不应有环"
  );

  // ── Single node ──
  const singleSteps = computeSteps({ nodes: ["X"], edges: [] });
  const singleLast = singleSteps[singleSteps.length - 1];
  console.assert(
    singleLast.sorted.length === 1,
    "单节点图应排序 1 个节点"
  );
  console.assert(
    singleLast.sorted[0] === "X",
    `单节点图排序结果应为 X，实际: ${singleLast.sorted[0]}`
  );

  // ── Disconnected graph (no edges) ──
  const discSteps = computeSteps({
    nodes: ["A", "B", "C"],
    edges: [],
  });
  const discLast = discSteps[discSteps.length - 1];
  console.assert(
    discLast.sorted.length === 3,
    `无边图应排序 3 个节点，实际: ${discLast.sorted.length}`
  );

  // ── Linear chain ──
  const chainSteps = computeSteps({
    nodes: ["A", "B", "C"],
    edges: [
      ["A", "B"],
      ["B", "C"],
    ],
  });
  const chainLast = chainSteps[chainSteps.length - 1];
  console.assert(
    chainLast.sorted.join(",") === "A,B,C",
    `线性链排序应为 A,B,C，实际: ${chainLast.sorted.join(",")}`
  );

  // ── All example configs exported ──
  console.assert(
    EXAMPLES.length === 3,
    `应有 3 个示例配置，实际: ${EXAMPLES.length}`
  );

  console.log("✓ Topological sort algorithm tests passed");
}
