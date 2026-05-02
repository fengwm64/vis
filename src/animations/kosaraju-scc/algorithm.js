/**
 * Kosaraju 强连通分量算法 — 纯函数模块，零 DOM / React 依赖
 *
 * 导出：
 *   PRESETS          — 三组预设图数据
 *   createInitialState(presetIndex) — 按预设号返回初始图结构
 *   computeSteps(presetIndex)       — 返回完整动画步骤序列
 *   SCC_COLORS       — SCC 配色方案
 *   runAlgorithmTests()             — 自检函数
 */

export const SCC_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export const PRESETS = [
  {
    name: "经典示例",
    nodes: ["A", "B", "C", "D", "E", "F"],
    edges: [
      ["A", "B"],
      ["B", "C"],
      ["C", "A"],
      ["B", "D"],
      ["D", "E"],
      ["E", "F"],
      ["F", "D"],
    ],
  },
  {
    name: "链式图",
    nodes: ["A", "B", "C", "D"],
    edges: [
      ["A", "B"],
      ["B", "C"],
      ["C", "D"],
    ],
  },
  {
    name: "全连通",
    nodes: ["A", "B", "C"],
    edges: [
      ["A", "B"],
      ["B", "C"],
      ["C", "A"],
    ],
  },
];

function buildAdj(nodes, edges) {
  const adj = Object.fromEntries(nodes.map((id) => [id, []]));
  for (const [u, v] of edges) {
    adj[u].push(v);
  }
  for (const id of nodes) {
    adj[id].sort();
  }
  return adj;
}

function buildRevAdj(nodes, edges) {
  const adj = Object.fromEntries(nodes.map((id) => [id, []]));
  for (const [u, v] of edges) {
    adj[v].push(u);
  }
  for (const id of nodes) {
    adj[id].sort();
  }
  return adj;
}

export function createInitialState(presetIndex = 0) {
  const preset = PRESETS[presetIndex] ?? PRESETS[0];
  const nodeState = Object.fromEntries(
    preset.nodes.map((id) => [id, { state: "undiscovered", discoveryTime: null, finishTime: null }])
  );
  const edgeState = Object.fromEntries(
    preset.edges.map(([u, v]) => [`${u}->${v}`, "normal"])
  );
  return { nodes: nodeState, edges: edgeState, preset };
}

export function computeSteps(presetIndex = 0) {
  const preset = PRESETS[presetIndex] ?? PRESETS[0];
  const { nodes, edges } = preset;
  const adj = buildAdj(nodes, edges);
  const revAdj = buildRevAdj(nodes, edges);

  const nodeState = Object.fromEntries(
    nodes.map((id) => [id, { state: "undiscovered", discoveryTime: null, finishTime: null }])
  );
  const edgeState = Object.fromEntries(
    edges.map(([u, v]) => [`${u}->${v}`, "normal"])
  );
  const stack = [];
  const sccs = [];
  let timeCounter = 0;
  let phase = 1;

  function snap(desc, currentEdge = null) {
    const edgeSnap = {};
    for (const key of Object.keys(edgeState)) {
      edgeSnap[key] = edgeState[key];
    }
    steps.push({
      phase,
      description: desc,
      nodes: Object.fromEntries(
        Object.entries(nodeState).map(([k, v]) => [k, { ...v }])
      ),
      edges: edgeSnap,
      stack: [...stack],
      sccs: sccs.map((s) => [...s]),
      currentSCC: currentSCC.length > 0 ? [...currentSCC] : null,
      currentEdge,
    });
  }

  const steps = [];
  const currentSCC = [];

  snap("初始状态：有向图已就绪");

  // ── Phase 1: DFS on original graph ──
  function dfs1(node) {
    timeCounter++;
    nodeState[node] = { state: "active", discoveryTime: timeCounter, finishTime: null };
    snap(`发现节点 ${node}（发现时间 ${timeCounter}）`);

    for (const neighbor of adj[node]) {
      const edgeKey = `${node}->${neighbor}`;
      if (nodeState[neighbor].state === "undiscovered") {
        edgeState[edgeKey] = "traversing";
        snap(`探索边 ${node}→${neighbor}：${neighbor} 未访问，递归进入`, [node, neighbor]);
        edgeState[edgeKey] = "visited";
        dfs1(neighbor);
      } else {
        snap(`探索边 ${node}→${neighbor}：${neighbor} 已访问，跳过`);
      }
    }

    timeCounter++;
    nodeState[node] = { ...nodeState[node], state: "finished", finishTime: timeCounter };
    stack.push(node);
    snap(`完成节点 ${node}（完成时间 ${timeCounter}），压入栈`);
  }

  for (const node of nodes) {
    if (nodeState[node].state === "undiscovered") {
      snap(`阶段一：从节点 ${node} 开始 DFS`);
      dfs1(node);
    }
  }

  // ── Phase 2: Build reverse graph ──
  phase = 2;
  snap("构建反图：所有边方向反转");
  phase = 3;

  // ── Phase 3: DFS on reverse graph ──
  function dfs3(node) {
    nodeState[node] = { ...nodeState[node], state: "active" };
    currentSCC.push(node);
    snap(`访问节点 ${node}，加入当前 SCC`);

    for (const neighbor of revAdj[node]) {
      const origKey = `${neighbor}->${node}`;
      const edgeKey = `${neighbor}->${node}`;
      if (nodeState[neighbor].state === "finished") {
        if (edgeState[origKey]) edgeState[origKey] = "traversing";
        snap(`探索反边 ${neighbor}→${node}：${neighbor} 未访问，递归进入`, [neighbor, node]);
        if (edgeState[origKey]) edgeState[origKey] = "visited";
        dfs3(neighbor);
      }
    }

    nodeState[node] = { ...nodeState[node], state: "inSCC" };
    snap(`节点 ${node} 完成`);
  }

  const reversedStack = [...stack].reverse();
  snap(`按栈序依次在反图上 DFS（栈：[${reversedStack.join(", ")}]）`);

  for (const node of reversedStack) {
    if (nodeState[node].state === "finished") {
      currentSCC.length = 0;
      snap(`从栈中取出节点 ${node}，开始新 SCC 的 DFS`);
      dfs3(node);
      sccs.push([...currentSCC]);
      currentSCC.length = 0;
    }
  }

  snap(`算法完成：找到 ${sccs.length} 个强连通分量`);

  return steps;
}

export function runAlgorithmTests() {
  let failures = 0;
  function assert(condition, msg) {
    if (!condition) {
      console.error(`✗ ${msg}`);
      failures++;
    }
  }

  // ── Preset 1: 经典示例 ──
  const steps1 = computeSteps(0);
  const last1 = steps1[steps1.length - 1];

  assert(last1.sccs.length === 2, `预设1：应有2个SCC，实际: ${last1.sccs.length}`);

  const sccSets1 = last1.sccs.map((s) => [...s].sort().join(",")).sort();
  assert(
    sccSets1[0] === "A,B,C" && sccSets1[1] === "D,E,F",
    `预设1：SCC应为{A,B,C},{D,E,F}，实际: [${sccSets1.join("; ")}]`
  );

  assert(last1.phase === 3, `预设1：最终phase应为3，实际: ${last1.phase}`);
  assert(steps1[0].phase === 1, `预设1：首步phase应为1`);
  assert(steps1.some((s) => s.phase === 2), `预设1：应包含phase 2`);

  const allNodesVisited1 = Object.values(last1.nodes).every((n) => n.state === "inSCC");
  assert(allNodesVisited1, "预设1：所有节点最终应为inSCC状态");

  const stack1 = steps1.filter((s) => s.phase === 1).at(-1)?.stack ?? [];
  assert(stack1.length === 6, `预设1：栈应含6个节点，实际: ${stack1.length}`);
  for (let i = 1; i < stack1.length; i++) {
    const prev = last1.nodes[stack1[i - 1]].finishTime;
    const curr = last1.nodes[stack1[i]].finishTime;
    assert(
      prev < curr,
      `预设1：栈中完成时间应递增（栈顶最大），stack[${i - 1}]=${stack1[i - 1]}(${prev}) < stack[${i}]=${stack1[i]}(${curr})`
    );
  }

  // ── Preset 2: 链式图 ──
  const steps2 = computeSteps(1);
  const last2 = steps2[steps2.length - 1];

  assert(last2.sccs.length === 4, `预设2：应有4个SCC，实际: ${last2.sccs.length}`);

  const singleNodeSccs2 = last2.sccs.every((s) => s.length === 1);
  assert(singleNodeSccs2, "预设2：每个SCC应只含1个节点");

  const sccNodes2 = last2.sccs.flat().sort().join(",");
  assert(sccNodes2 === "A,B,C,D", `预设2：所有节点应出现在SCC中，实际: ${sccNodes2}`);

  // ── Preset 3: 全连通 ──
  const steps3 = computeSteps(2);
  const last3 = steps3[steps3.length - 1];

  assert(last3.sccs.length === 1, `预设3：应有1个SCC，实际: ${last3.sccs.length}`);

  const sccNodes3 = last3.sccs[0].slice().sort().join(",");
  assert(sccNodes3 === "A,B,C", `预设3：SCC应含A,B,C，实际: ${sccNodes3}`);

  // ── Phase transitions ──
  const phases = steps1.map((s) => s.phase);
  let prevPhase = 0;
  for (const p of phases) {
    assert(p >= prevPhase, `阶段应单调递增: prev=${prevPhase}, curr=${p}`);
    prevPhase = p;
  }

  // ── Step structure ──
  for (const step of steps1) {
    assert(typeof step.phase === "number", "step.phase应为number");
    assert(typeof step.description === "string", "step.description应为string");
    assert(step.nodes !== undefined, "step.nodes应存在");
    assert(step.edges !== undefined, "step.edges应存在");
    assert(Array.isArray(step.stack), "step.stack应为数组");
    assert(Array.isArray(step.sccs), "step.sccs应为数组");
  }

  // ── Edge state keys ──
  const preset1 = PRESETS[0];
  for (const [u, v] of preset1.edges) {
    const key = `${u}->${v}`;
    assert(last1.edges[key] !== undefined, `边 ${key} 应在edges快照中`);
  }

  // ── createInitialState ──
  const init = createInitialState(0);
  assert(init.nodes.A.state === "undiscovered", "初始状态节点应为undiscovered");
  assert(init.edges["A->B"] === "normal", "初始状态边应为normal");
  assert(init.preset.nodes.length === 6, "预设1应有6个节点");

  if (failures > 0) {
    console.error(`\n✗ ${failures} test(s) failed`);
    process.exit(1);
  }
  console.log("✓ Kosaraju SCC algorithm tests passed");
}
