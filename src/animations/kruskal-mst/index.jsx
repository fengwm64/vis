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

const NODE_RADIUS = 28;
const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

function Icon({ type }) {
  const common = "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const label = { play: "▶", pause: "‖", step: "⏭", stepBack: "⏮", reset: "↺" };
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
    considering: { stroke: "#d97706", opacity: 1, width: 3.5 },
    accepted: { stroke: "#059669", opacity: 0.9, width: 3 },
    rejected: { stroke: "#dc2626", opacity: 0.7, width: 2 },
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
        strokeDasharray={state === "rejected" ? "8 5" : "none"}
      />
      <text
        x={mx + uy * 14}
        y={my - ux * 14}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-semibold"
        fill={state === "considering" ? "#d97706" : state === "accepted" || state === "mst" ? "#059669" : state === "rejected" ? "#dc2626" : "#64748b"}
      >
        {weight}
      </text>
      {state === "considering" && (
        <motion.circle
          r="5"
          fill="#d97706"
          initial={{ cx: start.x, cy: start.y, opacity: 0 }}
          animate={{ cx: end.x, cy: end.y, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}

function GraphNode({ id, x, y, inMST }) {
  return (
    <g>
      <motion.circle
        cx={x} cy={y} r={NODE_RADIUS}
        fill={inMST ? "#d1fae5" : "#ffffff"}
        stroke={inMST ? "#059669" : "#94a3b8"}
        strokeWidth={inMST ? 3 : 2.5}
        animate={{ r: NODE_RADIUS }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" className="text-base font-bold" fill="#0f172a">
        {id}
      </text>
    </g>
  );
}

export default function KruskalMSTAnimation() {
  const steps = useMemo(() => {
    runAlgorithmTests();
    return computeSteps(DEFAULT_GRAPH);
  }, []);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const current = steps[step];
  const totalSteps = steps.length - 1;

  const intervalMs = useMemo(() => {
    const min = 400;
    const max = 2400;
    return Math.round(max - ((speed - 1) / 99) * (max - min));
  }, [speed]);

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
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [playing, steps.length, intervalMs]);

  function getEdgeState(edge) {
    const { currentEdge, accepted, mstEdges } = current;

    // Check if this edge is the currently considered edge
    if (currentEdge && currentEdge.u === edge.u && currentEdge.v === edge.v) {
      if (accepted === true) return "accepted";
      if (accepted === false) return "rejected";
      return "considering";
    }

    // Check if edge is in MST
    for (const e of mstEdges) {
      if (e.u === edge.u && e.v === edge.v) return "mst";
    }

    return "default";
  }

  // Build a set of vertices that are in MST for node coloring
  const mstVertexSet = useMemo(() => {
    const set = new Set();
    for (const e of current.mstEdges) {
      set.add(e.u);
      set.add(e.v);
    }
    return set;
  }, [current.mstEdges]);

  // Get component display info
  const componentEntries = useMemo(() => {
    return Object.entries(current.components).map(([root, members]) => ({
      root,
      members,
    }));
  }, [current.components]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kruskal 最小生成树</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              将所有边按权重从小到大排序，依次考虑每条边：若两端属于不同连通分量则接受，否则跳过（避免成环）。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setPlaying((v) => !v)} className="rounded-2xl shadow-sm" aria-label={playing ? "暂停动画" : "播放动画"}>
              <Icon type={playing ? "pause" : "play"} />{playing ? "暂停" : "播放"}
            </Button>
            <Button variant="outline" onClick={() => setStep((v) => Math.min(totalSteps, v + 1))} className="rounded-2xl" aria-label="单步前进">
              <Icon type="step" />下一步
            </Button>
            <Button variant="outline" onClick={() => { setStep((v) => Math.max(0, v - 1)); setPlaying(false); }} className="rounded-2xl" aria-label="单步回退">
              <Icon type="stepBack" />上一步
            </Button>
            <Button variant="outline" onClick={() => { setStep(0); setPlaying(false); }} className="rounded-2xl" aria-label="重置动画">
              <Icon type="reset" />重置
            </Button>
            <div className="ml-2 flex items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap">速度</span>
              <input
                type="range"
                min={1}
                max={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-24 accent-slate-800"
                aria-label="播放速度"
              />
            </div>
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
              <svg viewBox="0 0 560 440" className="h-[430px] w-full rounded-2xl bg-white" role="img" aria-label="Kruskal 最小生成树动画">
                {DEFAULT_GRAPH.edges.map((edge) => (
                  <UndirectedEdge
                    key={`${edge.u}-${edge.v}`}
                    from={edge.u}
                    to={edge.v}
                    weight={edge.w}
                    state={getEdgeState(edge)}
                  />
                ))}
                {NODES.map((node) => (
                  <GraphNode
                    key={node.id}
                    {...node}
                    inMST={mstVertexSet.has(node.id)}
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
                  <div className="font-semibold">排序边列表</div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />已接受
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-full bg-red-500" />已拒绝
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {current.sortedEdges.map((edge, idx) => {
                    const inMST = current.mstEdges.some((e) => e.u === edge.u && e.v === edge.v);
                    const isCurrent = current.currentEdge && current.currentEdge.u === edge.u && current.currentEdge.v === edge.v;
                    const isRejected = isCurrent && current.accepted === false;
                    // Check if this edge was already processed (before current step)
                    const processedIndex = current.phase === "done"
                      ? current.sortedEdges.length
                      : current.currentEdge
                        ? current.sortedEdges.findIndex((e) => e.u === current.currentEdge.u && e.v === current.currentEdge.v)
                        : -1;
                    const isProcessed = idx < processedIndex || (idx === processedIndex && current.accepted !== null);

                    return (
                      <div
                        key={`${edge.u}-${edge.v}`}
                        className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-sm transition-colors ${
                          isCurrent && current.accepted === true
                            ? "bg-emerald-50 border border-emerald-200"
                            : isRejected
                              ? "bg-red-50 border border-red-200"
                              : isCurrent
                                ? "bg-amber-50 border border-amber-200"
                                : inMST
                                  ? "bg-emerald-50/50 border border-transparent"
                                  : "bg-slate-50 border border-transparent"
                        }`}
                      >
                        <span className={`font-medium ${
                          inMST ? "text-emerald-700" : isRejected ? "text-red-500 line-through" : "text-slate-700"
                        }`}>
                          {edge.u} — {edge.v}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-600">{edge.w}</span>
                          {inMST && <span className="text-emerald-600 text-xs">✓</span>}
                          {isRejected && <span className="text-red-500 text-xs">✗</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-semibold">并查集连通分量</div>
                  <div className="text-sm text-slate-500">
                    分量数: <span className="font-semibold text-slate-800">{componentEntries.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {componentEntries.map(({ root, members }) => (
                    <div
                      key={root}
                      className="flex items-center justify-between rounded-xl bg-slate-50 border border-transparent px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        代表: {root}
                      </span>
                      <span className="text-slate-600">
                        {`{ ${members.join(", ")} }`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">MST 边列表</div>
                  <div className="text-sm text-slate-500">
                    总权重: <span className="font-semibold text-slate-800">{current.totalWeight}</span>
                  </div>
                </div>
                {current.mstEdges.length === 0 ? (
                  <p className="text-sm text-slate-400">尚未选择任何边</p>
                ) : (
                  <div className="space-y-1.5">
                    {current.mstEdges.map((edge, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-emerald-700">{edge.u} — {edge.v}</span>
                        <span className="font-mono font-semibold">{edge.w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <p>绿色节点和边已在 MST 中。橙色闪烁边为当前考虑的边（将被接受），红色虚线边为被拒绝的边（会形成环）。按边权从小到大依次处理。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
