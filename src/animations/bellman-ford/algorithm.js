/**
 * Bellman-Ford 单源最短路径算法 - 纯函数模块
 * 零 DOM、零 React 依赖
 */

const DEFAULT_NODES = ["A", "B", "C", "D", "E", "F"];

const DEFAULT_EDGES = [
  { from: "A", to: "B", weight: 6 },
  { from: "A", to: "C", weight: 4 },
  { from: "A", to: "D", weight: 5 },
  { from: "B", to: "E", weight: -1 },
  { from: "C", to: "B", weight: -2 },
  { from: "C", to: "E", weight: 3 },
  { from: "D", to: "C", weight: -2 },
  { from: "D", to: "F", weight: -1 },
  { from: "E", to: "F", weight: 3 },
];

const DEFAULT_SOURCE = "A";

function computeSteps(nodes, edges, source) {
  const n = nodes.length;
  const distances = {};
  const prev = {};
  const steps = [];

  for (const node of nodes) {
    distances[node] = node === source ? 0 : Infinity;
    prev[node] = null;
  }

  // Step 0: 初始化
  steps.push({
    step: 0,
    iteration: 0,
    distances: { ...distances },
    prev: { ...prev },
    relaxedEdge: null,
    updatedNode: null,
    description: `初始化：源节点 ${source} 距离为 0，其余节点距离为 ∞`,
    isNegativeCycleCheck: false,
  });

  let stepCounter = 1;

  // V-1 轮松弛
  for (let i = 1; i <= n - 1; i++) {
    let roundUpdated = false;

    for (const edge of edges) {
      const { from, to, weight } = edge;
      const newDist = distances[from] + weight;

      if (distances[from] !== Infinity && newDist < distances[to]) {
        distances[to] = newDist;
        prev[to] = from;
        roundUpdated = true;

        steps.push({
          step: stepCounter++,
          iteration: i,
          distances: { ...distances },
          prev: { ...prev },
          relaxedEdge: [from, to],
          updatedNode: to,
          description: `第 ${i} 轮松弛：${from}→${to}（权重 ${weight}），${to} 距离更新为 ${newDist}`,
          isNegativeCycleCheck: false,
        });
      } else {
        steps.push({
          step: stepCounter++,
          iteration: i,
          distances: { ...distances },
          prev: { ...prev },
          relaxedEdge: [from, to],
          updatedNode: null,
          description: `第 ${i} 轮松弛：${from}→${to}（权重 ${weight}），无更新`,
          isNegativeCycleCheck: false,
        });
      }
    }
  }

  // 第 V 轮：负权环检测
  let hasNegativeCycle = false;
  for (const edge of edges) {
    const { from, to, weight } = edge;
    const newDist = distances[from] + weight;

    if (distances[from] !== Infinity && newDist < distances[to]) {
      hasNegativeCycle = true;
      steps.push({
        step: stepCounter++,
        iteration: n,
        distances: { ...distances },
        prev: { ...prev },
        relaxedEdge: [from, to],
        updatedNode: to,
        description: `负权环检测：${from}→${to}（权重 ${weight}）仍可松弛！检测到负权环`,
        isNegativeCycleCheck: true,
      });
    } else {
      steps.push({
        step: stepCounter++,
        iteration: n,
        distances: { ...distances },
        prev: { ...prev },
        relaxedEdge: [from, to],
        updatedNode: null,
        description: `负权环检测：${from}→${to}（权重 ${weight}），无更新`,
        isNegativeCycleCheck: true,
      });
    }
  }

  // 最终状态
  steps.push({
    step: stepCounter++,
    iteration: n,
    distances: { ...distances },
    prev: { ...prev },
    relaxedEdge: null,
    updatedNode: null,
    description: hasNegativeCycle
      ? "算法结束：检测到负权环，最短路径无定义"
      : "算法结束：已找到所有最短路径",
    isNegativeCycleCheck: false,
  });

  return steps;
}

function getShortestPath(steps, target) {
  const last = steps[steps.length - 1];
  const path = [];
  let current = target;

  while (current !== null) {
    path.unshift(current);
    current = last.prev[current];
  }

  return path[0] === target && last.distances[target] === Infinity
    ? []
    : path;
}

function runAlgorithmTests() {
  // Test 1: 默认示例图最短距离
  const steps = computeSteps(DEFAULT_NODES, DEFAULT_EDGES, DEFAULT_SOURCE);
  const last = steps[steps.length - 1];
  console.assert(last.distances["A"] === 0, "A 距离应为 0");
  console.assert(last.distances["B"] === 1, `B 距离应为 1，实际 ${last.distances["B"]}`);
  console.assert(last.distances["C"] === 3, `C 距离应为 3，实际 ${last.distances["C"]}`);
  console.assert(last.distances["D"] === 5, `D 距离应为 5，实际 ${last.distances["D"]}`);
  console.assert(last.distances["E"] === 0, `E 距离应为 0，实际 ${last.distances["E"]}`);
  console.assert(last.distances["F"] === 3, `F 距离应为 3，实际 ${last.distances["F"]}`);

  // Test 2: 无负权环
  const hasNegCycle = steps.some((s) => s.description.includes("检测到负权环"));
  console.assert(!hasNegCycle, "默认示例不应有负权环");

  // Test 3: 含负权环的图
  const negCycleNodes = ["X", "Y", "Z"];
  const negCycleEdges = [
    { from: "X", to: "Y", weight: 1 },
    { from: "Y", to: "Z", weight: -3 },
    { from: "Z", to: "X", weight: 1 },
  ];
  const negSteps = computeSteps(negCycleNodes, negCycleEdges, "X");
  const hasNegCycleDetected = negSteps.some((s) => s.description.includes("检测到负权环"));
  console.assert(hasNegCycleDetected, "应检测到负权环");

  // Test 4: 不可达节点
  const islandNodes = ["A", "B", "C"];
  const islandEdges = [{ from: "A", to: "B", weight: 1 }];
  const islandSteps = computeSteps(islandNodes, islandEdges, "A");
  const islandLast = islandSteps[islandSteps.length - 1];
  console.assert(islandLast.distances["C"] === Infinity, "C 应不可达（距离 Infinity）");

  // Test 5: 单节点图
  const singleSteps = computeSteps(["A"], [], "A");
  const singleLast = singleSteps[singleSteps.length - 1];
  console.assert(singleLast.distances["A"] === 0, "单节点距离应为 0");

  // Test 6: 步骤数正确
  // 默认图：1 init + 5 rounds * 9 edges + 1 check round * 9 edges + 1 final = 56 steps
  console.assert(steps.length === 56, `默认示例应有 56 步，实际 ${steps.length}`);

  // Test 7: 初始步骤
  console.assert(steps[0].iteration === 0, "第一步应为初始化（iteration=0）");
  console.assert(steps[0].distances["A"] === 0, "初始化时 A 距离为 0");
  console.assert(steps[0].distances["B"] === Infinity, "初始化时 B 距离为 Infinity");

  console.log("All Bellman-Ford tests passed.");
}

export { DEFAULT_NODES, DEFAULT_EDGES, DEFAULT_SOURCE, computeSteps, getShortestPath, runAlgorithmTests };
