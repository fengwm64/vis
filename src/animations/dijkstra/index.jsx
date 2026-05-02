import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_GRAPH, computeSteps, runAlgorithmTests } from "./algorithm";

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
const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

function Icon({ type }) {
  const common = "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const label = { play: "▶", pause: "‖", step: "⏭", reset: "↺" };
  return <span className={common} aria-hidden="true">{label[type]}</span>;
}

function getPath(prev, target) {
  const path = [];
  let node = target;
  while (node !== null) {
    path.unshift(node);
    node = prev[node];
  }
  return path;
}

function DirectedEdge({ from, to, weight, state }) {
  const start = nodeMap[from];
  const end = nodeMap[to];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const sx = start.x + ux * NODE_RADIUS;
  const sy = start.y + uy * NODE_RADIUS;
  const ex = end.x - ux * (NODE_RADIUS + 8);
  const ey = end.y - uy * (NODE_RADIUS + 8);
  const angle = (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  const colorMap = {
    relaxed: { stroke: "#4f46e5", fill: "#4f46e5", opacity: 1, width: 3.5 },
    path: { stroke: "#059669", fill: "#059669", opacity: 0.9, width: 3 },
    default: { stroke: "#94a3b8", fill: "#94a3b8", opacity: 0.5, width: 1.8 },
  };
  const style = colorMap[state] || colorMap.default;

  return (
    <g>
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={style.stroke}
        strokeWidth={style.width}
        opacity={style.opacity}
      />
      <polygon
        points="0,-5 10,0 0,5"
        transform={`translate(${ex},${ey}) rotate(${angle})`}
        fill={style.fill}
        opacity={style.opacity}
      />
      <text
        x={mx + uy * 14}
        y={my - ux * 14}
        textAnchor="middle"
        className="text-xs font-semibold"
        fill={state === "relaxed" ? "#4f46e5" : "#64748b"}
      >
        {weight}
      </text>
      {state === "relaxed" && (
        <motion.circle
          r="5"
          fill="#4f46e5"
          initial={{ cx: sx, cy: sy, opacity: 0 }}
          animate={{ cx: ex, cy: ey, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}

function GraphNode({ id, x, y, state, distance }) {
  const bgMap = {
    current: "#eef2ff",
    visited: "#d1fae5",
    default: "#ffffff",
  };
  const borderMap = {
    current: "#4f46e5",
    visited: "#059669",
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
      <text x={x} y={y + 14} textAnchor="middle" className="text-xs" fill={distance === Infinity ? "#94a3b8" : "#334155"}>
        {distance === Infinity ? "∞" : distance}
      </text>
    </g>
  );
}

export default function DijkstraAnimation() {
  const steps = useMemo(() => {
    runAlgorithmTests();
    return computeSteps(DEFAULT_GRAPH, "A");
  }, []);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = steps[step];
  const totalSteps = steps.length - 1;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((v) => (v >= steps.length - 1 ? (setPlaying(false), v) : v + 1));
    }, 1600);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  function getEdgeState(edge) {
    if (current.relaxedEdge && current.relaxedEdge[0] === edge.from && current.relaxedEdge[1] === edge.to) {
      return "relaxed";
    }
    if (current.prev[edge.to] === edge.from && current.visited.includes(edge.to)) {
      return "path";
    }
    return "default";
  }

  function getNodeState(id) {
    if (id === current.currentNode && !current.visited.includes(id)) return "current";
    if (current.visited.includes(id)) return "visited";
    if (id === current.currentNode) return "current";
    return "default";
  }

  const prevStep = step > 0 ? steps[step - 1] : null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dijkstra 最短路径</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              从源节点 A 出发，每次选出距离最小的未确定节点，对其邻居执行松弛操作，逐步构建最短路径树。
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
                <div className="font-semibold">带权有向图</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {step} / {totalSteps}
                </div>
              </div>
              <svg viewBox="0 0 560 440" className="h-[430px] w-full rounded-2xl bg-white" role="img" aria-label="Dijkstra 最短路径动画">
                {EDGES.map((edge) => (
                  <DirectedEdge
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
                    distance={current.distances[node.id]}
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
                  <div className="font-semibold">距离表</div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-500 bg-emerald-100" />已确定
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-indigo-500 bg-indigo-50" />当前
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {NODES.map((node) => {
                    const dist = current.distances[node.id];
                    const isVisited = current.visited.includes(node.id);
                    const isCurrent = node.id === current.currentNode;
                    const distChanged = prevStep && prevStep.distances[node.id] !== dist;

                    return (
                      <div
                        key={node.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                          isCurrent && !isVisited
                            ? "bg-indigo-50 border border-indigo-200"
                            : isVisited
                              ? "bg-emerald-50 border border-emerald-200"
                              : "bg-slate-50 border border-transparent"
                        }`}
                      >
                        <span className="font-medium">
                          {node.id}
                          {isVisited && <span className="ml-2 text-emerald-600 text-xs">✓</span>}
                        </span>
                        <motion.span
                          key={`${node.id}-${dist}`}
                          initial={distChanged ? { scale: 1.3, color: "#4f46e5" } : false}
                          animate={{ scale: 1, color: dist === Infinity ? "#94a3b8" : "#0f172a" }}
                          className="font-mono font-semibold"
                        >
                          {dist === Infinity ? "∞" : dist}
                        </motion.span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-2 font-semibold text-slate-900">最短路径树</div>
                <div className="space-y-1.5 text-sm text-slate-600">
                  {NODES.filter((n) => n.id !== "A").map((node) => {
                    const path = getPath(current.prev, node.id);
                    const dist = current.distances[node.id];
                    if (dist === Infinity) {
                      return (
                        <div key={node.id} className="flex justify-between">
                          <span>A → {node.id}</span>
                          <span className="text-slate-400">不可达</span>
                        </div>
                      );
                    }
                    return (
                      <div key={node.id} className="flex justify-between">
                        <span className="font-mono text-xs">{path.join(" → ")}</span>
                        <span className="font-semibold">= {dist}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <p>节点圆圈内数字为当前距离估计。绿色节点已确定最短路径，靛蓝色节点为当前处理节点。紫色闪烁边表示本轮松弛操作，绿色边为已确定的最短路径树边。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
