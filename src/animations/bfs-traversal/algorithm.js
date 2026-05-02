/**
 * BFS 遍历算法 — 纯函数模块，零 DOM / React 依赖
 *
 * 导出：
 *   computeSteps(input) → steps[]
 *   runAlgorithmTests()
 */

const DEFAULT_NODES = ["A", "B", "C", "D", "E", "F"];

const DEFAULT_EDGES = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["C", "E"],
  ["C", "F"],
  ["E", "F"],
];

/**
 * 构建无向邻接表
 */
function buildAdjacency(nodes, edges) {
  const adj = Object.fromEntries(nodes.map((id) => [id, []]));
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  // 排序邻居，保证遍历顺序确定性
  for (const id of nodes) {
    adj[id].sort();
  }
  return adj;
}

/**
 * 生成 BFS 遍历步骤序列
 *
 * @param {{ nodes?: string[], edges?: [string, string][], start?: string }} input
 * @returns {Array<{
 *   nodes: Array<{ id: string, state: string }>,
 *   queue: string[],
 *   visited: string[],
 *   currentNode: string | null,
 *   exploringEdge: [string, string] | null,
 *   description: string
 * }>}
 */
export function computeSteps(input = {}) {
  const nodes = input.nodes ?? DEFAULT_NODES;
  const edges = input.edges ?? DEFAULT_EDGES;
  const start = input.start ?? nodes[0];
  const adj = buildAdjacency(nodes, edges);

  /** @type {Record<string, string>} node state: default | enqueued | current | completed */
  const nodeState = Object.fromEntries(nodes.map((id) => [id, "default"]));
  /** @type {string[]} */
  const queue = [];
  /** @type {string[]} */
  const visited = [];
  /** @type {Set<string>} */
  const enqueued = new Set();

  const steps = [];

  // ── 快照：记录当前状态 ──
  function snap(desc, currentNode = null, exploringEdge = null) {
    steps.push({
      nodes: nodes.map((id) => ({ id, state: nodeState[id] })),
      queue: [...queue],
      visited: [...visited],
      currentNode,
      exploringEdge,
      description: desc,
    });
  }

  // Step 0: 初始状态
  snap("初始状态：图结构已就绪，队列为空");

  // 入队起始节点
  queue.push(start);
  enqueued.add(start);
  nodeState[start] = "enqueued";
  snap(`将起始节点 ${start} 入队`);

  // BFS 主循环
  while (queue.length > 0) {
    const current = queue.shift();
    nodeState[current] = "current";
    visited.push(current);
    snap(`出队节点 ${current}，标记为当前访问`, current);

    const neighbors = adj[current] ?? [];
    for (const neighbor of neighbors) {
      if (enqueued.has(neighbor)) {
        // 已入队，仅高亮边
        snap(
          `探索边 ${current}-${neighbor}：节点 ${neighbor} 已在队列中，跳过`,
          current,
          [current, neighbor]
        );
      } else {
        // 入队邻居
        queue.push(neighbor);
        enqueued.add(neighbor);
        nodeState[neighbor] = "enqueued";
        snap(
          `探索边 ${current}-${neighbor}：将 ${neighbor} 入队`,
          current,
          [current, neighbor]
        );
      }
    }

    // 当前节点完成
    nodeState[current] = "completed";
    if (queue.length > 0) {
      snap(`节点 ${current} 访问完成，队列剩余 [${queue.join(", ")}]`);
    }
  }

  // 完成
  snap("遍历完成：所有可达节点均已访问");

  return steps;
}

/**
 * 自检函数
 */
export function runAlgorithmTests() {
  // ── 基本遍历顺序 ──
  const steps = computeSteps();
  const last = steps[steps.length - 1];
  console.assert(
    last.visited.join(",") === "A,B,C,D,E,F",
    `默认图 BFS 顺序应为 A,B,C,D,E,F，实际: ${last.visited.join(",")}`
  );

  // ── 步骤数应大于节点数 ──
  console.assert(
    steps.length > DEFAULT_NODES.length,
    `步骤数应大于节点数 ${DEFAULT_NODES.length}，实际: ${steps.length}`
  );

  // ── 初始状态 ──
  const s0 = steps[0];
  console.assert(s0.queue.length === 0, "初始状态队列应为空");
  console.assert(s0.visited.length === 0, "初始状态遍历结果应为空");
  console.assert(
    s0.nodes.every((n) => n.state === "default"),
    "初始状态所有节点应为 default"
  );

  // ── 最终状态所有节点 completed ──
  console.assert(
    last.nodes.every((n) => n.state === "completed"),
    "最终状态所有节点应为 completed"
  );
  console.assert(last.queue.length === 0, "最终状态队列应为空");

  // ── 不连通图：只遍历可达节点 ──
  const disconnected = computeSteps({
    nodes: ["A", "B", "C", "D"],
    edges: [["A", "B"]],
    start: "A",
  });
  const dLast = disconnected[disconnected.length - 1];
  console.assert(
    dLast.visited.join(",") === "A,B",
    `不连通图从 A 出发应只遍历 A,B，实际: ${dLast.visited.join(",")}`
  );

  // ── 单节点图 ──
  const single = computeSteps({
    nodes: ["X"],
    edges: [],
    start: "X",
  });
  const sLast = single[single.length - 1];
  console.assert(
    sLast.visited.join(",") === "X",
    `单节点图应遍历 X，实际: ${sLast.visited.join(",")}`
  );

  // ── 自环不应导致死循环 ──
  const selfLoop = computeSteps({
    nodes: ["A", "B"],
    edges: [["A", "A"], ["A", "B"]],
    start: "A",
  });
  const slLast = selfLoop[selfLoop.length - 1];
  console.assert(
    slLast.visited.length === 2,
    `自环图应遍历 2 个节点，实际: ${slLast.visited.length}`
  );

  // ── 从不同起始节点遍历 ──
  const fromF = computeSteps({ start: "F" });
  const fLast = fromF[fromF.length - 1];
  console.assert(
    fLast.visited[0] === "F",
    `从 F 出发第一个访问应为 F，实际: ${fLast.visited[0]}`
  );
  console.assert(
    fLast.visited.length === DEFAULT_NODES.length,
    `从 F 出发应遍历所有节点，实际: ${fLast.visited.length}`
  );

  console.log("✓ BFS algorithm tests passed");
}
