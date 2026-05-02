// Dijkstra's shortest path algorithm - pure computation module
// Zero DOM, zero React dependency

const DEFAULT_GRAPH = {
  A: { B: 4, C: 2 },
  B: { C: 1, D: 5, F: 7 },
  C: { D: 8, E: 10 },
  D: { F: 2 },
  E: { F: 3 },
  F: {},
};

function computeSteps(graph, source) {
  const nodes = Object.keys(graph);
  const dist = {};
  const prev = {};
  const visited = [];
  const steps = [];

  for (const node of nodes) {
    dist[node] = Infinity;
    prev[node] = null;
  }
  dist[source] = 0;

  steps.push({
    step: 0,
    currentNode: source,
    distances: { ...dist },
    visited: [],
    relaxedEdge: null,
    updatedNode: null,
    prev: { ...prev },
    description: `初始化：源节点 ${source} 距离为 0，其余节点距离为 ∞`,
  });

  let stepCount = 1;

  while (visited.length < nodes.length) {
    let current = null;
    let minDist = Infinity;

    for (const node of nodes) {
      if (!visited.includes(node) && dist[node] < minDist) {
        minDist = dist[node];
        current = node;
      }
    }

    if (current === null || minDist === Infinity) break;

    visited.push(current);

    steps.push({
      step: stepCount++,
      currentNode: current,
      distances: { ...dist },
      visited: [...visited],
      relaxedEdge: null,
      updatedNode: null,
      prev: { ...prev },
      description: `选择距离最小的未确定节点 ${current}（距离 = ${dist[current]}），标记为已确定`,
    });

    const neighbors = graph[current] || {};

    for (const neighbor of Object.keys(neighbors)) {
      if (visited.includes(neighbor)) continue;

      const weight = neighbors[neighbor];
      const newDist = dist[current] + weight;

      if (newDist < dist[neighbor]) {
        dist[neighbor] = newDist;
        prev[neighbor] = current;

        steps.push({
          step: stepCount++,
          currentNode: current,
          distances: { ...dist },
          visited: [...visited],
          relaxedEdge: [current, neighbor],
          updatedNode: neighbor,
          prev: { ...prev },
          description: `松弛：${current} → ${neighbor}，dist[${neighbor}] = ${dist[current]} + ${weight} = ${newDist}`,
        });
      }
    }
  }

  return steps;
}

function runAlgorithmTests() {
  // Test 1: Default example from PRD
  const steps = computeSteps(DEFAULT_GRAPH, "A");
  const last = steps[steps.length - 1];

  console.assert(last.distances.A === 0, "dist[A] should be 0");
  console.assert(last.distances.C === 2, "dist[C] should be 2");
  console.assert(last.distances.B === 4, "dist[B] should be 4");
  console.assert(last.distances.D === 9, "dist[D] should be 9");
  console.assert(last.distances.F === 11, "dist[F] should be 11");
  console.assert(last.distances.E === 12, "dist[E] should be 12");

  // Test 2: Path reconstruction via prev
  function getPath(prev, target) {
    const path = [];
    let node = target;
    while (node !== null) {
      path.unshift(node);
      node = prev[node];
    }
    return path;
  }

  const pathF = getPath(last.prev, "F");
  console.assert(pathF.join("→") === "A→B→F", "shortest path A→F should be A→B→F");

  const pathE = getPath(last.prev, "E");
  console.assert(pathE.join("→") === "A→C→E", "shortest path A→E should be A→C→E");

  // Test 3: Initial step has source distance 0
  console.assert(steps[0].distances.A === 0, "initial source distance should be 0");

  // Test 4: Visited set grows monotonically
  for (let i = 1; i < steps.length; i++) {
    console.assert(
      steps[i].visited.length >= steps[i - 1].visited.length,
      "visited set should grow monotonically"
    );
  }

  // Test 5: Single node graph
  const singleSteps = computeSteps({ X: {} }, "X");
  console.assert(singleSteps.length === 2, "single node graph should have 2 steps (init + visit)");
  console.assert(singleSteps[0].distances.X === 0, "single node distance should be 0");

  // Test 6: Linear graph A→B→C
  const linearGraph = { A: { B: 3 }, B: { C: 5 }, C: {} };
  const linearSteps = computeSteps(linearGraph, "A");
  const linearLast = linearSteps[linearSteps.length - 1];
  console.assert(linearLast.distances.C === 8, "linear graph dist[C] should be 8");

  // Test 7: Disconnected nodes should remain Infinity
  const discGraph = { A: { B: 1 }, B: {}, C: {} };
  const discSteps = computeSteps(discGraph, "A");
  const discLast = discSteps[discSteps.length - 1];
  console.assert(discLast.distances.C === Infinity, "disconnected node C should remain Infinity");

  // Test 8: Steps count is reasonable for default graph (6 nodes, ~9 edges)
  console.assert(steps.length >= 6, "default graph should have at least 6 steps");
  console.assert(steps.length <= 20, "default graph should have at most 20 steps");

  // Test 9: Every step has required fields
  for (const step of steps) {
    console.assert(typeof step.step === "number", "step.step should be number");
    console.assert(typeof step.currentNode === "string", "step.currentNode should be string");
    console.assert(typeof step.distances === "object", "step.distances should be object");
    console.assert(Array.isArray(step.visited), "step.visited should be array");
    console.assert(typeof step.prev === "object", "step.prev should be object");
    console.assert(typeof step.description === "string", "step.description should be string");
  }

  console.log("All Dijkstra algorithm tests passed.");
}

export { DEFAULT_GRAPH, computeSteps, runAlgorithmTests };
