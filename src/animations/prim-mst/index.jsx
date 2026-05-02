import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_GRAPH, DEFAULT_START, computeSteps, runAlgorithmTests } from "./algorithm";

const NODES = [
  { id: "A", x: 280, y: 60 },
  { id: "B", x: 480, y: 140 },
  { id: "C", x: 480, y: 300 },
  { id: "D", x: 280, y: 380 },
  { id: "E", x: 80, y: 300 },
  { id: "F", x: 80, y: 140 },
];

const EDGES = [
  { from: "A", to: "B", weight: 4 },
  { from: "A", to: "C", weight: 2 },
  { from: "B", to: "C", weight: 1 },
  { from: "B", to: "D", weight: 5 },
  { from: "B", to: "F", weight: 7 },
  { from: "C", to: "D", weight: 8 },
  { from: "C", to: "E", weight: 10 },
  { from: "D", to: "F", weight: 2 },
  { from: "E", to: "F", weight: 3 },
];

const NODE_RADIUS = 28;
const INF = Infinity;
const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

function Icon({ type }) {
  const common = "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const label = { play: "▶", pause: "‖", step: "⏭", reset: "↺" };
  return <span className={common} aria-hidden="true">{label[type]}</span>;
}

function UndirectedEdge({ from, to, weight, state }) {
  const start = nodeMap[from];
  const end = nodeMap[to];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;

  const colorMap = {
    added: { stroke: "#4f46e5", opacity: 1, width: 3.5 },
    mst: { stroke: "#059669", opacity: 0.9, width: 3 },
    default: { stroke: "#94a3b8", opacity: 0.5, width: 1.8 },
  };
  const style = colorMap[state] || colorMap.default;

  return (
    <g>
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={style.stroke}
        strokeWidth={style.width}
        opacity={style.opacity}
      />
      <text
        x={mx + uy * 14}
        y={my - ux * 14}
        textAnchor="middle"
        className="text-xs font-semibold"
        fill={state === "added" ? "#4f46e5" : state === "mst" ? "#059669" : "#64748b"}
      >
        {weight}
      </text>
      {state === "added" && (
        <motion.circle
          r="5"
          fill="#4f46e5"
          initial={{ cx: start.x, cy: start.y, opacity: 0 }}
          animate={{ cx: end.x, cy: end.y, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}

function GraphNode({ id, x, y, state, nodeKey }) {
  const bgMap = {
    current: "#eef2ff",
    mst: "#d1fae5",
    default: "#ffffff",
  };
  const borderMap = {
    current: "#4f46e5",
    mst: "#059669",
    default: "#94a3b8",
  };

  return (
    <g>
      <motion.circle
        cx={x} cy={y} r={NODE_RADIUS}
        fill={bgMap[state] || bgMap.default}
        stroke={borderMap[state] || borderMap.default}
        strokeWidth={state === "current" ? 4 : 2.5}
        animate={{ r: state === "current" ? NODE_RADIUS + 4 : NODE_RADIUS }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
      <text x={x} y={y - 4} textAnchor="middle" className="text-base font-bold" fill="#0f172a">
        {id}
      </text>
      <text x={x} y={y + 14} textAnchor="middle" className="text-xs" fill={nodeKey === INF ? "#94a3b8" : "#334155"}>
        {nodeKey === INF ? "∞" : nodeKey}
      </text>
    </g>
  );
}

export default function PrimMSTAnimation() {
  const steps = useMemo(() => {
    runAlgorithmTests();
    return computeSteps(DEFAULT_GRAPH, DEFAULT_START);
  }, []);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = steps[step];
  const prevStep = step > 0 ? steps[step - 1] : null;
  const totalSteps = steps.length - 1;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((v) => {
        if (v >= steps.length - 1) {
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, 1600);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  function getEdgeState(edge) {
    if (
      current.addedEdge &&
      ((current.addedEdge[0] === edge.from && current.addedEdge[1] === edge.to) ||
       (current.addedEdge[0] === edge.to && current.addedEdge[1] === edge.from))
    ) {
      return "added";
    }
    for (const [u, v] of current.mstEdges) {
      if ((u === edge.from && v === edge.to) || (u === edge.to && v === edge.from)) {
        return "mst";
      }
    }
    return "default";
  }

  function getNodeState(id) {
    if (id === current.currentNode) return "current";
    if (current.mstNodes.includes(id)) return "mst";
    return "default";
  }

  const totalWeight = current.mstEdges.reduce(
    (sum, [u, v]) => sum + (DEFAULT_GRAPH[u]?.[v] ?? DEFAULT_GRAPH[v]?.[u] ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prim 最小生成树</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              从起始节点 A 出发，每步选出连接 MST 集合与非 MST 集合的最小权重边，逐步构建最小生成树。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPlaying((v) => !v)} className="rounded-2xl shadow-sm" aria-label={playing ? "暂停动画" : "播放动画"}>
              <Icon type={playing ? "pause" : "play"} />{playing ? "暂停" : "播放"}
            </Button>
            <Button variant="outline" onClick={() => setStep((v) => Math.min(totalSteps, v + 1))} className="rounded-2xl" aria-label="单步前进">
              <Icon type="step" />下一步
            </Button>
            <Button variant="outline" onClick={() => { setStep(0); setPlaying(false); }} className="rounded-2xl" aria-label="重置动画">
              <Icon type="reset" />重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">带权无向图</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {step} / {totalSteps}
                </div>
              </div>
              <svg viewBox="0 0 560 440" className="h-[430px] w-full rounded-2xl bg-white" role="img" aria-label="Prim 最小生成树动画">
                {EDGES.map((edge) => (
                  <UndirectedEdge
                    key={`${edge.from}-${edge.to}`}
                    {...edge}
                    state={getEdgeState(edge)}
                  />
                ))}
                {NODES.map((node) => (
                  <GraphNode
                    key={node.id}
                    {...node}
                    state={getNodeState(node.id)}
                    nodeKey={current.key[node.id]}
                  />
                ))}
              </svg>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">当前操作</div>
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base leading-7 text-slate-800"
                >
                  {current.description}
                </motion.p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-semibold">Key 表</div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-100" />MST
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-indigo-500 bg-indigo-50" />当前
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {NODES.map((node) => {
                    const nodeKey = current.key[node.id];
                    const isMST = current.mstNodes.includes(node.id);
                    const isCurrent = node.id === current.currentNode;
                    const keyChanged = prevStep && prevStep.key[node.id] !== nodeKey;

                    return (
                      <div
                        key={node.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                          isCurrent
                            ? "bg-indigo-50 border border-indigo-200"
                            : isMST
                              ? "bg-emerald-50 border border-emerald-200"
                              : "bg-slate-50 border border-transparent"
                        }`}
                      >
                        <span className="font-medium">
                          {node.id}
                          {isMST && !isCurrent && <span className="ml-2 text-emerald-600 text-xs">✓</span>}
                        </span>
                        <div className="flex items-center gap-2">
                          <motion.span
                            key={`${node.id}-${nodeKey}`}
                            initial={keyChanged ? { scale: 1.3, color: "#4f46e5" } : false}
                            animate={{ scale: 1, color: nodeKey === INF ? "#94a3b8" : "#0f172a" }}
                            className="font-mono font-semibold"
                          >
                            {nodeKey === INF ? "∞" : nodeKey}
                          </motion.span>
                          {current.parent[node.id] && (
                            <span className="text-xs text-slate-400">
                              ← {current.parent[node.id]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">MST 边列表</div>
                  <div className="text-sm text-slate-500">
                    总权重: <span className="font-semibold text-slate-800">{totalWeight}</span>
                  </div>
                </div>
                {current.mstEdges.length === 0 ? (
                  <p className="text-sm text-slate-400">尚未选择任何边</p>
                ) : (
                  <div className="space-y-1.5">
                    {current.mstEdges.map(([u, v], idx) => {
                      const w = DEFAULT_GRAPH[u]?.[v] ?? DEFAULT_GRAPH[v]?.[u] ?? 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-emerald-700">{u} — {v}</span>
                          <span className="font-mono font-semibold">{w}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <p>节点圆圈内数字为 key 值（到 MST 的最小边权重）。绿色节点已在 MST 中，靛蓝色节点为当前加入节点。绿色边为 MST 已选边，靛蓝色闪烁边为本步新加入的边。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
