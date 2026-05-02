/**
 * Floyd-Warshall All-Pairs Shortest Path - Pure algorithm module.
 * Zero DOM / React dependencies.
 */

const INF = Infinity;

function cloneMatrix(matrix) {
  return matrix.map(row => [...row]);
}

export function createInitialState(edges, n) {
  const dist = Array.from({ length: n }, () => Array(n).fill(INF));
  for (let i = 0; i < n; i++) dist[i][i] = 0;
  for (const { from, to, weight } of edges) {
    if (weight < dist[from][to]) dist[from][to] = weight;
  }
  return { dist, n };
}

export function computeSteps(edges, n) {
  const { dist: initialDist } = createInitialState(edges, n);
  const steps = [];

  const dist = cloneMatrix(initialDist);

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const viaK = dist[i][k] === INF || dist[k][j] === INF
          ? INF
          : dist[i][k] + dist[k][j];
        const relaxed = viaK < dist[i][j];
        const oldValue = dist[i][j];

        if (relaxed) dist[i][j] = viaK;

        steps.push({
          k,
          i,
          j,
          relaxed,
          oldValue,
          newValue: dist[i][j],
          dist: cloneMatrix(dist),
          description: relaxed
            ? `dist[${i}][${j}] = dist[${i}][${k}] + dist[${k}][${j}] = ${formatValue(dist[i][k])} + ${formatValue(dist[k][j])} = ${formatValue(viaK)} < ${formatValue(oldValue)}，松弛成功`
            : `dist[${i}][${j}] = min(${formatValue(oldValue)}, ${formatValue(dist[i][k])} + ${formatValue(dist[k][j])}) = ${formatValue(oldValue)}，无需更新`,
        });
      }
    }
  }

  return { steps, initialDist, finalDist: cloneMatrix(dist) };
}

export function detectNegativeCycle(edges, n) {
  const { finalDist } = computeSteps(edges, n);
  for (let i = 0; i < n; i++) {
    if (finalDist[i][i] < 0) return true;
  }
  return false;
}

function formatValue(v) {
  return v === INF ? "∞" : String(v);
}

// ---------- Default example graph from PRD ----------

export const DEFAULT_VERTICES = [0, 1, 2, 3];

export const DEFAULT_EDGES = [
  { from: 0, to: 1, weight: 3 },
  { from: 0, to: 2, weight: 8 },
  { from: 1, to: 2, weight: 2 },
  { from: 1, to: 3, weight: 5 },
  { from: 2, to: 3, weight: 1 },
  { from: 3, to: 0, weight: 2 },
];

// ---------- Self-check ----------

export function runAlgorithmTests() {
  // --- Initial state ---
  {
    const state = createInitialState(DEFAULT_EDGES, 4);
    console.assert(state.dist[0][0] === 0, "diagonal 0");
    console.assert(state.dist[1][1] === 0, "diagonal 1");
    console.assert(state.dist[0][1] === 3, "edge 0->1 weight 3");
    console.assert(state.dist[0][2] === 8, "edge 0->2 weight 8");
    console.assert(state.dist[1][2] === 2, "edge 1->2 weight 2");
    console.assert(state.dist[1][3] === 5, "edge 1->3 weight 5");
    console.assert(state.dist[2][3] === 1, "edge 2->3 weight 1");
    console.assert(state.dist[3][0] === 2, "edge 3->0 weight 2");
    console.assert(state.dist[0][3] === INF, "no edge 0->3");
    console.assert(state.dist[2][0] === INF, "no edge 2->0");
    console.assert(state.dist[2][1] === INF, "no edge 2->1");
    console.assert(state.dist[3][1] === INF, "no edge 3->1");
    console.assert(state.dist[3][2] === INF, "no edge 3->2");
  }

  // --- Step count ---
  {
    const { steps } = computeSteps(DEFAULT_EDGES, 4);
    console.assert(steps.length === 64, `expected 64 steps, got ${steps.length}`);
  }

  // --- Negative cycle detection ---
  {
    console.assert(!detectNegativeCycle(DEFAULT_EDGES, 4), "default graph has no negative cycle");
    console.assert(
      detectNegativeCycle([
        { from: 0, to: 1, weight: 1 },
        { from: 1, to: 2, weight: -3 },
        { from: 2, to: 0, weight: 1 },
      ], 3),
      "triangle with total -1 is a negative cycle"
    );
    console.assert(
      !detectNegativeCycle([
        { from: 0, to: 1, weight: 1 },
        { from: 1, to: 2, weight: -3 },
        { from: 2, to: 0, weight: 3 },
      ], 3),
      "triangle with total 1 is not a negative cycle"
    );
  }

  // --- Final distances for default graph ---
  {
    const { finalDist } = computeSteps(DEFAULT_EDGES, 4);
    console.assert(finalDist[0][0] === 0, "final diagonal 0");
    console.assert(finalDist[0][1] === 3, "final 0->1 = 3");
    console.assert(finalDist[0][2] === 5, "final 0->2 = 5 (via 1)");
    console.assert(finalDist[0][3] === 6, "final 0->3 = 6 (via 1->2)");
    console.assert(finalDist[1][0] === 5, "final 1->0 = 5 (via 2->3->0)");
    console.assert(finalDist[1][1] === 0, "final diagonal 1");
    console.assert(finalDist[1][2] === 2, "final 1->2 = 2");
    console.assert(finalDist[1][3] === 3, "final 1->3 = 3 (via 2)");
    console.assert(finalDist[2][0] === 3, "final 2->0 = 3 (via 3)");
    console.assert(finalDist[2][1] === 6, "final 2->1 = 6 (via 3->0)");
    console.assert(finalDist[2][2] === 0, "final diagonal 2");
    console.assert(finalDist[2][3] === 1, "final 2->3 = 1");
    console.assert(finalDist[3][0] === 2, "final 3->0 = 2");
    console.assert(finalDist[3][1] === 5, "final 3->1 = 5 (via 0)");
    console.assert(finalDist[3][2] === 7, "final 3->2 = 7 (via 0->1)");
    console.assert(finalDist[3][3] === 0, "final diagonal 3");
  }

  // --- Negative edge support ---
  {
    const edges = [
      { from: 0, to: 1, weight: 4 },
      { from: 0, to: 2, weight: -2 },
      { from: 2, to: 1, weight: 3 },
    ];
    const { finalDist } = computeSteps(edges, 3);
    console.assert(finalDist[0][1] === 1, "negative edge: 0->2->1 = -2+3 = 1 < 4");
    console.assert(!detectNegativeCycle(edges, 3), "no negative cycle with negative edge");
  }

  // --- Single edge ---
  {
    const edges = [{ from: 0, to: 1, weight: 5 }];
    const { steps, finalDist } = computeSteps(edges, 2);
    console.assert(steps.length === 8, `2 nodes: expected 8 steps, got ${steps.length}`);
    console.assert(finalDist[0][1] === 5, "single edge: 0->1 = 5");
    console.assert(finalDist[1][0] === INF, "single edge: 1->0 = INF");
  }

  // --- Undirected (bidirectional) ---
  {
    const edges = [
      { from: 0, to: 1, weight: 3 },
      { from: 1, to: 0, weight: 3 },
    ];
    const { finalDist } = computeSteps(edges, 2);
    console.assert(finalDist[0][1] === 3, "undirected: 0->1 = 3");
    console.assert(finalDist[1][0] === 3, "undirected: 1->0 = 3");
  }

  console.log("All Floyd-Warshall algorithm tests passed.");
}
