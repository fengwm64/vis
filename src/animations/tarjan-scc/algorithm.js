// Tarjan's Strongly Connected Components — pure algorithm module
// Zero DOM / React dependencies

export const DEFAULT_GRAPH = {
  A: { B: 1 },
  B: { C: 1 },
  C: { A: 1, D: 1 },
  D: { E: 1 },
  E: { D: 1 },
};

export const EXTRA_GRAPHS = {
  dag: {
    A: { B: 1, C: 1 },
    B: { C: 1 },
    C: {},
  },
  bigCycle: {
    A: { B: 1 },
    B: { C: 1 },
    C: { D: 1 },
    D: { A: 1 },
  },
};

const SCC_COLORS = [
  "scc-0",
  "scc-1",
  "scc-2",
  "scc-3",
  "scc-4",
  "scc-5",
  "scc-6",
  "scc-7",
];

function makeNodeState(id) {
  return { id, dfn: null, low: null, status: "unvisited", sccIndex: -1 };
}

function cloneNodes(nodes) {
  return nodes.map((n) => ({ ...n }));
}

function cloneSccs(sccs) {
  return sccs.map((s) => [...s]);
}

/**
 * Compute animation steps for Tarjan's SCC algorithm.
 * @param {Record<string, Record<string, number>>} graph - adjacency map
 * @returns {Array} steps
 */
export function computeSteps(graph = DEFAULT_GRAPH) {
  const nodeIds = Object.keys(graph);
  const nodes = nodeIds.map(makeNodeState);
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const steps = [];
  const stack = []; // DFS stack (Tarjan stack)
  const sccs = []; // discovered SCCs
  let index = 0;
  let stepCount = 0;

  function snap(currentNode, currentEdge, phase, description) {
    steps.push({
      step: stepCount++,
      nodes: cloneNodes(nodes),
      stack: [...stack],
      sccs: cloneSccs(sccs),
      currentNode,
      currentEdge,
      phase,
      description,
    });
  }

  // Step 0: init
  snap(null, null, "init", "初始化：显示有向图，所有节点未访问，栈为空");

  function dfs(u) {
    // Visit u
    nodeMap[u].dfn = index;
    nodeMap[u].low = index;
    index++;
    stack.push(u);
    nodeMap[u].status = "onstack";

    snap(u, null, "visit", `访问节点 ${u}：dfn[${u}] = low[${u}] = ${nodeMap[u].dfn}，压入栈`);

    const neighbors = Object.keys(graph[u] || {});
    for (const w of neighbors) {
      if (nodeMap[w].status === "unvisited") {
        // Tree edge
        snap(u, [u, w], "explore_forward", `探索树边 ${u} → ${w}，${w} 未访问，递归进入`);

        dfs(w);

        // Backtrack: update low
        const oldLow = nodeMap[u].low;
        nodeMap[u].low = Math.min(nodeMap[u].low, nodeMap[w].low);
        snap(
          u,
          [u, w],
          "backtrack",
          `从 ${w} 回溯到 ${u}：low[${u}] = min(${oldLow}, ${nodeMap[w].low}) = ${nodeMap[u].low}`
        );
      } else if (nodeMap[w].status === "onstack") {
        // Back edge
        const oldLow = nodeMap[u].low;
        nodeMap[u].low = Math.min(nodeMap[u].low, nodeMap[w].dfn);
        snap(
          u,
          [u, w],
          "explore_back",
          `发现回边 ${u} → ${w}（${w} 在栈中）：low[${u}] = min(${oldLow}, dfn[${w}]=${nodeMap[w].dfn}) = ${nodeMap[u].low}`
        );
      }
      // Cross edge to finished node: ignore
    }

    // Check if u is root of an SCC
    if (nodeMap[u].dfn === nodeMap[u].low) {
      const scc = [];
      let v;
      do {
        v = stack.pop();
        nodeMap[v].status = "done";
        nodeMap[v].sccIndex = sccs.length;
        scc.push(v);
      } while (v !== u);

      sccs.push(scc);
      snap(
        u,
        null,
        "pop_scc",
        `发现 SCC 根 ${u}（dfn == low == ${nodeMap[u].dfn}）：弹出栈中 {${scc.join(", ")}}，标记为 SCC ${sccs.length}`
      );
    }
  }

  // Run DFS from every unvisited node
  for (const id of nodeIds) {
    if (nodeMap[id].status === "unvisited") {
      snap(id, null, "select_root", `选择未访问节点 ${id} 作为 DFS 根`);
      dfs(id);
    }
  }

  snap(null, null, "done", `算法完成，共发现 ${sccs.length} 个强连通分量`);
  return steps;
}

/**
 * Self-test function for Tarjan SCC algorithm.
 */
export function runAlgorithmTests() {
  // --- Default graph: {A,B,C}, {D,E} ---
  const steps = computeSteps(DEFAULT_GRAPH);
  const lastStep = steps[steps.length - 1];

  console.assert(steps.length > 0, "步骤列表不应为空");
  console.assert(steps[0].phase === "init", "第一步应为 init");
  console.assert(lastStep.phase === "done", "最后一步应为 done");

  const defaultSccs = lastStep.sccs;
  console.assert(defaultSccs.length === 2, `默认图应有 2 个 SCC，实际 ${defaultSccs.length}`);

  const sccSets = defaultSccs.map((s) => new Set(s));
  const hasABC = sccSets.some(
    (s) => s.size === 3 && s.has("A") && s.has("B") && s.has("C")
  );
  const hasDE = sccSets.some(
    (s) => s.size === 2 && s.has("D") && s.has("E")
  );
  console.assert(hasABC, "默认图应有 SCC {A, B, C}");
  console.assert(hasDE, "默认图应有 SCC {D, E}");

  // Check all nodes are done
  for (const n of lastStep.nodes) {
    console.assert(n.status === "done", `节点 ${n.id} 最终应为 done 状态`);
    console.assert(n.dfn !== null, `节点 ${n.id} 应有 dfn 值`);
    console.assert(n.low !== null, `节点 ${n.id} 应有 low 值`);
  }

  // --- DAG: each node is its own SCC ---
  const dagSteps = computeSteps(EXTRA_GRAPHS.dag);
  const dagLast = dagSteps[dagSteps.length - 1];
  console.assert(dagLast.sccs.length === 3, `DAG 应有 3 个 SCC，实际 ${dagLast.sccs.length}`);
  for (const scc of dagLast.sccs) {
    console.assert(scc.length === 1, `DAG 的每个 SCC 应只含 1 个节点，实际 ${scc.length}`);
  }

  // --- Big cycle: one SCC ---
  const cycleSteps = computeSteps(EXTRA_GRAPHS.bigCycle);
  const cycleLast = cycleSteps[cycleSteps.length - 1];
  console.assert(cycleLast.sccs.length === 1, `大环应有 1 个 SCC，实际 ${cycleLast.sccs.length}`);
  console.assert(cycleLast.sccs[0].length === 4, `大环 SCC 应含 4 个节点，实际 ${cycleLast.sccs[0].length}`);

  // --- Empty graph ---
  const emptySteps = computeSteps({});
  const emptyLast = emptySteps[emptySteps.length - 1];
  console.assert(emptyLast.sccs.length === 0, "空图应无 SCC");

  // --- Single node ---
  const singleSteps = computeSteps({ A: {} });
  const singleLast = singleSteps[singleSteps.length - 1];
  console.assert(singleLast.sccs.length === 1, "单节点图应有 1 个 SCC");
  console.assert(singleLast.sccs[0].length === 1, "单节点 SCC 应含 1 个节点");

  // --- Disconnected: two separate components ---
  const discSteps = computeSteps({
    A: { B: 1 },
    B: { A: 1 },
    C: { D: 1 },
    D: { C: 1 },
  });
  const discLast = discSteps[discSteps.length - 1];
  console.assert(discLast.sccs.length === 2, `不连通图应有 2 个 SCC，实际 ${discLast.sccs.length}`);

  // --- Step structure validation ---
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    console.assert(typeof s.step === "number", `步骤 ${i} 应有数字 step`);
    console.assert(Array.isArray(s.nodes), `步骤 ${i} nodes 应为数组`);
    console.assert(Array.isArray(s.stack), `步骤 ${i} stack 应为数组`);
    console.assert(Array.isArray(s.sccs), `步骤 ${i} sccs 应为数组`);
    console.assert(typeof s.description === "string", `步骤 ${i} description 应为字符串`);
    console.assert(typeof s.phase === "string", `步骤 ${i} phase 应为字符串`);
  }

  console.log("Tarjan SCC algorithm tests passed.");
}
