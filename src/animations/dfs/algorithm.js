export const DEFAULT_GRAPH = {
  A: { B: 1, C: 1 },
  B: { A: 1, D: 1, E: 1 },
  C: { A: 1, D: 1 },
  D: { B: 1, C: 1, F: 1, G: 1 },
  E: { B: 1, F: 1 },
  F: { D: 1, E: 1 },
  G: { D: 1 },
};

export const DEFAULT_START = "A";

export function computeSteps(graph = DEFAULT_GRAPH, start = DEFAULT_START) {
  const steps = [];
  const visited = new Set();
  const stack = [];
  const traversalOrder = [];
  const treeEdges = [];
  const backEdges = [];

  visited.add(start);
  stack.push(start);

  steps.push({
    step: 0,
    stack: [...stack],
    currentNode: null,
    visited: new Set(visited),
    traversalOrder: [...traversalOrder],
    treeEdges: treeEdges.map((e) => [...e]),
    backEdges: backEdges.map((e) => [...e]),
    lastEdge: null,
    phase: "init",
    description: `将起始节点 ${start} 压入栈`,
  });

  let stepCount = 1;

  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current) && !traversalOrder.includes(current)) {
      traversalOrder.push(current);
    }

    steps.push({
      step: stepCount++,
      stack: [...stack],
      currentNode: current,
      visited: new Set(visited),
      traversalOrder: [...traversalOrder],
      treeEdges: treeEdges.map((e) => [...e]),
      backEdges: backEdges.map((e) => [...e]),
      lastEdge: null,
      phase: "explore",
      description: `弹出节点 ${current}，开始探索`,
    });

    const neighbors = Object.keys(graph[current] || {});
    let foundUnvisited = false;

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        foundUnvisited = true;
        visited.add(neighbor);
        stack.push(neighbor);
        treeEdges.push([current, neighbor]);

        steps.push({
          step: stepCount++,
          stack: [...stack],
          currentNode: current,
          visited: new Set(visited),
          traversalOrder: [...traversalOrder],
          treeEdges: treeEdges.map((e) => [...e]),
          backEdges: backEdges.map((e) => [...e]),
          lastEdge: [current, neighbor],
          phase: "explore",
          description: `发现未访问邻居 ${neighbor}，压入栈（树边 ${current}-${neighbor}）`,
        });
      } else {
        const edgeKey1 = `${current}-${neighbor}`;
        const edgeKey2 = `${neighbor}-${current}`;
        const alreadyRecorded = backEdges.some(
          ([u, v]) =>
            `${u}-${v}` === edgeKey1 ||
            `${u}-${v}` === edgeKey2
        );

        if (!alreadyRecorded && !treeEdges.some(([u, v]) => `${u}-${v}` === edgeKey1 || `${u}-${v}` === edgeKey2)) {
          backEdges.push([current, neighbor]);

          steps.push({
            step: stepCount++,
            stack: [...stack],
            currentNode: current,
            visited: new Set(visited),
            traversalOrder: [...traversalOrder],
            treeEdges: treeEdges.map((e) => [...e]),
            backEdges: backEdges.map((e) => [...e]),
            lastEdge: [current, neighbor],
            phase: "explore",
            description: `邻居 ${neighbor} 已访问，记录回边 ${current}-${neighbor}`,
          });
        }
      }
    }

    if (!foundUnvisited) {
      steps.push({
        step: stepCount++,
        stack: [...stack],
        currentNode: current,
        visited: new Set(visited),
        traversalOrder: [...traversalOrder],
        treeEdges: treeEdges.map((e) => [...e]),
        backEdges: backEdges.map((e) => [...e]),
        lastEdge: null,
        phase: "backtrack",
        description: `节点 ${current} 无未访问邻居，回溯`,
      });
    }
  }

  steps.push({
    step: stepCount++,
    stack: [],
    currentNode: null,
    visited: new Set(visited),
    traversalOrder: [...traversalOrder],
    treeEdges: treeEdges.map((e) => [...e]),
    backEdges: backEdges.map((e) => [...e]),
    lastEdge: null,
    phase: "done",
    description: `遍历完成，访问顺序：${traversalOrder.join(" → ")}`,
  });

  return steps;
}

export function runAlgorithmTests() {
  const steps = computeSteps();
  const lastStep = steps[steps.length - 1];

  console.assert(steps.length > 0, "步骤列表不应为空");
  console.assert(steps[0].phase === "init", "第一步应为初始化阶段");
  console.assert(lastStep.phase === "done", "最后一步应为完成阶段");
  console.assert(lastStep.stack.length === 0, "遍历完成后栈应为空");
  console.assert(lastStep.traversalOrder.length === 7, "默认图应遍历全部 7 个节点");

  const allVisited = lastStep.visited;
  console.assert(allVisited.size === 7, "应有 7 个已访问节点");
  for (const node of ["A", "B", "C", "D", "E", "F", "G"]) {
    console.assert(allVisited.has(node), `节点 ${node} 应被访问`);
  }

  console.assert(lastStep.traversalOrder[0] === "A", "遍历应从 A 开始");

  console.assert(lastStep.treeEdges.length === 6, "生成树应有 6 条边（7 节点）");

  console.assert(lastStep.backEdges.length >= 1, "应至少有 1 条回边");

  const singleNodeSteps = computeSteps({ X: {} }, "X");
  const singleLast = singleNodeSteps[singleNodeSteps.length - 1];
  console.assert(singleLast.traversalOrder.length === 1, "单节点图应遍历 1 个节点");
  console.assert(singleLast.traversalOrder[0] === "X", "单节点图遍历节点应为 X");

  const linearSteps = computeSteps(
    { A: { B: 1 }, B: { A: 1, C: 1 }, C: { B: 1 } },
    "A"
  );
  const linearLast = linearSteps[linearSteps.length - 1];
  console.assert(linearLast.traversalOrder.length === 3, "线性图应遍历 3 个节点");
  console.assert(linearLast.treeEdges.length === 2, "线性图生成树应有 2 条边");

  const disconnectedSteps = computeSteps(
    { A: { B: 1 }, B: { A: 1 }, C: { D: 1 }, D: { C: 1 } },
    "A"
  );
  const disconnectedLast = disconnectedSteps[disconnectedSteps.length - 1];
  console.assert(disconnectedLast.traversalOrder.length === 2, "非连通图从 A 出发应只遍历 2 个节点");

  const noBackEdgeSteps = computeSteps(
    { A: { B: 1 }, B: { A: 1, C: 1 }, C: { B: 1 } },
    "A"
  );
  const noBackEdgeLast = noBackEdgeSteps[noBackEdgeSteps.length - 1];
  console.assert(noBackEdgeLast.backEdges.length === 0, "树形图不应有回边");

  for (let i = 0; i < steps.length; i++) {
    console.assert(typeof steps[i].step === "number", `步骤 ${i} 应有数字类型 step`);
    console.assert(Array.isArray(steps[i].stack), `步骤 ${i} stack 应为数组`);
    console.assert(steps[i].visited instanceof Set, `步骤 ${i} visited 应为 Set`);
    console.assert(Array.isArray(steps[i].traversalOrder), `步骤 ${i} traversalOrder 应为数组`);
    console.assert(Array.isArray(steps[i].treeEdges), `步骤 ${i} treeEdges 应为数组`);
    console.assert(Array.isArray(steps[i].backEdges), `步骤 ${i} backEdges 应为数组`);
    console.assert(typeof steps[i].description === "string", `步骤 ${i} description 应为字符串`);
  }

  console.log("DFS algorithm tests passed.");
}
