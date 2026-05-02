import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_GRAPH,
  EXTRA_GRAPHS,
  computeSteps,
  runAlgorithmTests,
} from "./algorithm";

const GRAPH_OPTIONS = [
  { key: "default", label: "默认 (A→B→C→A, C→D→E→D)", graph: DEFAULT_GRAPH },
  { key: "dag", label: "DAG (A→B→C, A→C)", graph: EXTRA_GRAPHS.dag },
  { key: "bigCycle", label: "大环 (A→B→C→D→A)", graph: EXTRA_GRAPHS.bigCycle },
];

const NODE_LAYOUTS = {
  default: [
    { id: "A", x: 280, y: 70 },
    { id: "B", x: 460, y: 160 },
    { id: "C", x: 400, y: 340 },
    { id: "D", x: 160, y: 340 },
    { id: "E", x: 100, y: 160 },
  ],
  dag: [
    { id: "A", x: 280, y: 70 },
    { id: "B", x: 160, y: 280 },
    { id: "C", x: 400, y: 280 },
  ],
  bigCycle: [
    { id: "A", x: 280, y: 70 },
    { id: "B", x: 460, y: 200 },
    { id: "C", x: 380, y: 380 },
    { id: "D", x: 180, y: 380 },
  ],
};

const NODE_RADIUS = 30;
const SCC_HUE_STEP = 57;
const SCC_COLORS = [
  { bg: "#dcfce7", border: "#16a34a", text: "#166534" },
  { bg: "#fef9c3", border: "#ca8a04", text: "#854d0e" },
  { bg: "#dbeafe", border: "#2563eb", text: "#1e40af" },
  { bg: "#fce7f3", border: "#db2777", text: "#9d174d" },
  { bg: "#f3e8ff", border: "#9333ea", text: "#6b21a8" },
  { bg: "#ffedd5", border: "#ea580c", text: "#9a3412" },
  { bg: "#ccfbf1", border: "#0d9488", text: "#115e59" },
  { bg: "#e0e7ff", border: "#4f46e5", text: "#3730a3" },
];

function Icon({ type }) {
  const common =
    "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const label = { play: "▶", pause: "‖", prev: "⏮", step: "⏭", reset: "↺" };
  return (
    <span className={common} aria-hidden="true">
      {label[type]}
    </span>
  );
}

function DirectedEdge({ from, to, highlighted, sccColor }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const sx = from.x + ux * NODE_RADIUS;
  const sy = from.y + uy * NODE_RADIUS;
  const ex = to.x - ux * (NODE_RADIUS + 10);
  const ey = to.y - uy * (NODE_RADIUS + 10);
  const angle = (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI;

  const stroke = highlighted ? "#dc2626" : sccColor || "#94a3b8";
  const width = highlighted ? 3 : 1.8;
  const opacity = highlighted ? 1 : 0.5;

  return (
    <g>
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke={stroke}
        strokeWidth={width}
        opacity={opacity}
      />
      <polygon
        points="0,-5 10,0 0,5"
        transform={`translate(${ex},${ey}) rotate(${angle})`}
        fill={stroke}
        opacity={opacity}
      />
      {highlighted && (
        <motion.circle
          r="5"
          fill="#dc2626"
          initial={{ cx: sx, cy: sy, opacity: 0 }}
          animate={{ cx: ex, cy: ey, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}

function GraphNode({ id, x, y, dfn, low, status, sccIndex, isCurrent }) {
  let bg = "#ffffff";
  let border = "#94a3b8";
  let strokeWidth = 2.5;

  if (sccIndex >= 0) {
    const c = SCC_COLORS[sccIndex % SCC_COLORS.length];
    bg = c.bg;
    border = c.border;
    strokeWidth = 3;
  } else if (status === "onstack") {
    bg = "#eef2ff";
    border = "#4f46e5";
    strokeWidth = 3;
  }

  if (isCurrent) {
    strokeWidth = 4;
    border = "#f59e0b";
  }

  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={NODE_RADIUS}
        fill={bg}
        stroke={border}
        strokeWidth={strokeWidth}
        animate={{
          r: isCurrent ? NODE_RADIUS + 3 : NODE_RADIUS,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
      <text
        x={x}
        y={y - 4}
        textAnchor="middle"
        className="text-base font-bold"
        fill="#0f172a"
      >
        {id}
      </text>
      <text
        x={x}
        y={y + 14}
        textAnchor="middle"
        className="text-xs"
        fill={dfn !== null ? "#334155" : "#94a3b8"}
      >
        {dfn !== null ? `${dfn}/${low}` : "?/?"}
      </text>
    </g>
  );
}

export default function TarjanSccAnimation() {
  const [graphKey, setGraphKey] = useState("default");

  const steps = useMemo(() => {
    const opt = GRAPH_OPTIONS.find((g) => g.key === graphKey);
    runAlgorithmTests();
    return computeSteps(opt.graph);
  }, [graphKey]);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = steps[step];
  const totalSteps = steps.length - 1;
  const nodes = NODE_LAYOUTS[graphKey];
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [graphKey]);

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
    }, 1400);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  function getEdges() {
    const opt = GRAPH_OPTIONS.find((g) => g.key === graphKey);
    const graph = opt.graph;
    const result = [];
    for (const [from, targets] of Object.entries(graph)) {
      for (const to of Object.keys(targets)) {
        result.push({ from, to });
      }
    }
    return result;
  }

  function isEdgeHighlighted(edge) {
    if (!current.currentEdge) return false;
    return current.currentEdge[0] === edge.from && current.currentEdge[1] === edge.to;
  }

  function getEdgeSccColor(edge) {
    const fromNode = current.nodes.find((n) => n.id === edge.from);
    const toNode = current.nodes.find((n) => n.id === edge.to);
    if (fromNode && toNode && fromNode.sccIndex >= 0 && fromNode.sccIndex === toNode.sccIndex) {
      return SCC_COLORS[fromNode.sccIndex % SCC_COLORS.length].border;
    }
    return null;
  }

  const edges = getEdges();

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tarjan 强连通分量
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              在一次 DFS 中找出有向图的所有强连通分量。维护 dfn/low
              值和栈，当 dfn[u] == low[u]
              时，栈中 u 及以上节点构成一个 SCC。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPlaying((v) => !v)}
              className="rounded-2xl shadow-sm"
              aria-label={playing ? "暂停动画" : "播放动画"}
            >
              <Icon type={playing ? "pause" : "play"} />
              {playing ? "暂停" : "播放"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep((v) => Math.max(0, v - 1))}
              className="rounded-2xl"
              aria-label="单步后退"
            >
              <Icon type="prev" />
              上一步
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep((v) => Math.min(totalSteps, v + 1))}
              className="rounded-2xl"
              aria-label="单步前进"
            >
              <Icon type="step" />
              下一步
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep(0);
                setPlaying(false);
              }}
              className="rounded-2xl"
              aria-label="重置动画"
            >
              <Icon type="reset" />
              重置
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">示例图：</span>
          {GRAPH_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              variant={graphKey === opt.key ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setGraphKey(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">有向图</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {step} / {totalSteps}
                </div>
              </div>
              <svg
                viewBox="0 0 560 440"
                className="h-[430px] w-full rounded-2xl bg-white"
                role="img"
                aria-label="Tarjan SCC 动画"
              >
                {edges.map((edge) => {
                  const fromPos = nodeMap[edge.from];
                  const toPos = nodeMap[edge.to];
                  if (!fromPos || !toPos) return null;
                  return (
                    <DirectedEdge
                      key={`${edge.from}-${edge.to}`}
                      from={fromPos}
                      to={toPos}
                      highlighted={isEdgeHighlighted(edge)}
                      sccColor={getEdgeSccColor(edge)}
                    />
                  );
                })}
                {nodes.map((node) => {
                  const nodeState = current.nodes.find(
                    (n) => n.id === node.id
                  );
                  return (
                    <GraphNode
                      key={node.id}
                      {...node}
                      dfn={nodeState ? nodeState.dfn : null}
                      low={nodeState ? nodeState.low : null}
                      status={nodeState ? nodeState.status : "unvisited"}
                      sccIndex={nodeState ? nodeState.sccIndex : -1}
                      isCurrent={current.currentNode === node.id}
                    />
                  );
                })}
              </svg>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  当前操作
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-base leading-7 text-slate-800"
                  >
                    {current.description}
                  </motion.p>
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-4 font-semibold">栈</div>
                {current.stack.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">空</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {current.stack.map((id, i) => (
                      <motion.span
                        key={`${id}-${i}`}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-mono font-semibold ${
                          current.currentNode === id
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {id}
                        <span className="ml-1.5 text-xs text-slate-400">
                          ({i === 0 ? "底" : i === current.stack.length - 1 ? "顶" : ""})
                        </span>
                      </motion.span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-4 font-semibold">已发现的 SCC</div>
                {current.sccs.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">暂无</div>
                ) : (
                  <div className="space-y-2">
                    {current.sccs.map((scc, i) => {
                      const c = SCC_COLORS[i % SCC_COLORS.length];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                          style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
                        >
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: c.border }}
                          />
                          <span className="font-semibold" style={{ color: c.text }}>
                            SCC {i + 1}:
                          </span>
                          <span className="font-mono" style={{ color: c.text }}>
                            {"{"}{scc.join(", ")},{"}"}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-4 font-semibold">节点状态</div>
                <div className="space-y-2">
                  {nodes.map((node) => {
                    const ns = current.nodes.find((n) => n.id === node.id);
                    const dfn = ns ? ns.dfn : null;
                    const low = ns ? ns.low : null;
                    const status = ns ? ns.status : "unvisited";
                    const isCurrent = current.currentNode === node.id;

                    const statusLabel = {
                      unvisited: "未访问",
                      onstack: "在栈中",
                      done: "已完成",
                    };

                    return (
                      <div
                        key={node.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                          isCurrent
                            ? "bg-amber-50 border border-amber-200"
                            : status === "done"
                              ? "bg-emerald-50 border border-emerald-200"
                              : status === "onstack"
                                ? "bg-indigo-50 border border-indigo-200"
                                : "bg-slate-50 border border-transparent"
                        }`}
                      >
                        <span className="font-medium">
                          {node.id}
                          {status === "done" && (
                            <span className="ml-2 text-emerald-600 text-xs">✓</span>
                          )}
                        </span>
                        <span className="font-mono text-xs text-slate-600">
                          dfn={dfn !== null ? dfn : "?"} low={low !== null ? low : "?"} [{statusLabel[status]}]
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <p>
                  节点内数字为 dfn/low
                  值。蓝色节点在栈中，黄色边框为当前处理节点。红色闪烁边为当前探索边。每发现一个
                  SCC，其节点和边用统一颜色标记。栈显示当前 Tarjan
                  栈的内容。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
