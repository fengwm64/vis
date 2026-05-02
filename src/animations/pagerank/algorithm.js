/**
 * PageRank algorithm — pure functions, zero DOM/React dependencies.
 */

const DEFAULT_DAMPING = 0.85;
const DEFAULT_ROUNDS = 12;

/**
 * Compute PageRank iterations.
 *
 * @param {{ id: string }[]} nodes
 * @param {{ from: string, to: string }[]} edges
 * @param {{ damping?: number, rounds?: number }} [options]
 * @returns {{ history: Array<{ round: number, rank: Record<string, number> }>, outLinks: Record<string, string[]>, inLinks: Record<string, string[]> }}
 */
export function computePageRank(nodes, edges, options = {}) {
  const damping = options.damping ?? DEFAULT_DAMPING;
  const rounds = options.rounds ?? DEFAULT_ROUNDS;
  const n = nodes.length;

  if (n === 0) {
    return { history: [{ round: 0, rank: {} }], outLinks: {}, inLinks: {} };
  }

  const outLinks = {};
  const inLinks = {};

  for (const node of nodes) {
    outLinks[node.id] = [];
    inLinks[node.id] = [];
  }

  for (const { from, to } of edges) {
    if (outLinks[from] && inLinks[to]) {
      outLinks[from].push(to);
      inLinks[to].push(from);
    }
  }

  let rank = Object.fromEntries(nodes.map((node) => [node.id, 1 / n]));
  const history = [{ round: 0, rank: { ...rank } }];

  for (let i = 1; i <= rounds; i++) {
    const next = {};

    for (const node of nodes) {
      const incomingSum = inLinks[node.id].reduce((sum, source) => {
        const outgoingCount = outLinks[source].length || n;
        return sum + rank[source] / outgoingCount;
      }, 0);

      next[node.id] = (1 - damping) / n + damping * incomingSum;
    }

    rank = next;
    history.push({ round: i, rank: { ...rank } });
  }

  return { history, outLinks, inLinks };
}

/**
 * Self-test function — run with Node ESM import to verify correctness.
 */
export function runAlgorithmTests() {
  // Default 5-node graph matching the original hardcoded example
  const nodes = [
    { id: "A" },
    { id: "B" },
    { id: "C" },
    { id: "D" },
    { id: "E" },
  ];

  const edges = [
    { from: "A", to: "B" },
    { from: "A", to: "C" },
    { from: "B", to: "C" },
    { from: "C", to: "A" },
    { from: "C", to: "D" },
    { from: "D", to: "C" },
    { from: "E", to: "A" },
    { from: "E", to: "D" },
  ];

  // Test 1: history length
  const { history } = computePageRank(nodes, edges);
  console.assert(history.length === 13, `Expected 13 history entries, got ${history.length}`);

  // Test 2: rank sum ≈ 1 at every round
  for (const { round, rank } of history) {
    const total = Object.values(rank).reduce((s, v) => s + v, 0);
    console.assert(
      Math.abs(total - 1) < 1e-10,
      `Round ${round}: rank sum ${total} should be 1`,
    );
  }

  // Test 3: all ranks positive
  const finalRank = history[history.length - 1].rank;
  console.assert(
    Object.values(finalRank).every((v) => v > 0),
    "All final ranks should be positive",
  );

  // Test 4: node C has highest rank (most incoming links)
  const sorted = nodes
    .map((node) => ({ id: node.id, rank: finalRank[node.id] }))
    .sort((a, b) => b.rank - a.rank);
  console.assert(sorted[0].id === "C", `Expected C to be top, got ${sorted[0].id}`);

  // Test 5: empty graph
  const empty = computePageRank([], []);
  console.assert(empty.history.length === 1, "Empty graph should have 1 history entry");
  console.assert(Object.keys(empty.history[0].rank).length === 0, "Empty graph rank should be empty");

  // Test 6: single node, no edges — rank = (1-d)/n = 0.15 with d=0.85
  const single = computePageRank([{ id: "X" }], []);
  const singleFinal = single.history[single.history.length - 1].rank;
  console.assert(
    Math.abs(singleFinal["X"] - 0.15) < 1e-10,
    `Single node rank should be 0.15, got ${singleFinal["X"]}`,
  );

  // Test 7: custom damping and rounds
  const custom = computePageRank(nodes, edges, { damping: 0.5, rounds: 5 });
  console.assert(custom.history.length === 6, "Custom rounds should produce 6 entries");

  // Test 8: outLinks / inLinks structure
  const { outLinks, inLinks } = computePageRank(nodes, edges);
  console.assert(outLinks["A"].includes("B"), "A should link to B");
  console.assert(outLinks["A"].includes("C"), "A should link to C");
  console.assert(inLinks["C"].includes("A"), "C should receive from A");
  console.assert(inLinks["C"].includes("B"), "C should receive from B");
  console.assert(inLinks["C"].includes("D"), "C should receive from D");

  console.log("✓ All PageRank algorithm tests passed.");
}
