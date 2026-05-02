import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_NODES, DEFAULT_EDGES, DEFAULT_SOURCE, computeSteps, runAlgorithmTests } from "./algorithm";

const NODES = [
  { id: "A", x: 280, y: 60 },
  { id: "B", x: 440, y: 160 },
  { id: "C", x: 440, y: 300 },
  { id: "D", x: 120, y: 160 },
  { id: "E", x: 440, y: 440 },
  { id: "F", x: 120, y: 440 },
];

const EDGES = [
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

const NODE_RADIUS = 30;
const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

function Icon({ type }) {
  const common = "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const label = { play: "▶", pause: "‖", step: "⏭", reset: "↺" };
  return (
    <span className={common} aria-hidden="true">{label[type]}</span>
  );
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
  const isNegative = weight < 0;

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
        strokeDasharray={isNegative ? "6 4" : "none"}
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
        fill={state === "relaxed" ? "#4f46e5" : isNegative ? "#dc2626" : "#64748b"}
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

function GraphNode({ id, x, y, state, distance, delta }) {
  const bgMap = {
    updated: "#fef3c7",
    relaxed: "#eef2ff",
    default: "#ffffff",
  };
  const borderMap = {
    updated: "#f59e0b",
    relaxed: "#4f46e5",
    default: "#94a3b8",
  };

  const bg = bgMap[state] || bgMap.default;
  const border = borderMap[state] || borderMap.default;
  const distColor = distance === Infinity ? "#94a3b8" : "#0f172a";

  return (
    <g>
      <motion.circle
        cx={x} cy={y} r={NODE_RADIUS}
        fill={bg}
        stroke={border}
        strokeWidth={state === "relaxed" ? 4 : 2.5}
        animate={{ r: state === "relaxed" ? NODE_RADIUS + 4 : NODE_RADIUS }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
      <text x={x} y={y - 4} textAnchor="middle" className="text-base font-bold" fill="#0f172a">
        {id}
      </text>
      <text x={x} y={y + 14} textAnchor="middle" className="text-xs" fill={distColor}>
        {distance === Infinity ? "∞" : distance}
      </text>
      {delta !== 0 && (
        <motion.text
          x={x}
          y={y + NODE_RADIUS + 18}
          textAnchor="middle"
          className="text-xs font-semibold"
          fill={delta > 0 ? "#059669" : "#dc2626"}
          initial={{ opacity: 0, y: y + NODE_RADIUS + 24 }}
          animate={{ opacity: 1, y: y + NODE_RADIUS + 18 }}
          transition={{ duration: 0.3 }}
        >
          {delta > 0 ? "+" : ""}{delta}
        </motion.text>
      )}
    </g>
  );
}

export default function BellmanFordAnimation() {
  const steps = useMemo(() => {
    runAlgorithmTests();
    return computeSteps(DEFAULT_NODES, DEFAULT_EDGES, DEFAULT_SOURCE);
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
      current.relaxedEdge &&
      current.relaxedEdge[0] === edge.from &&
      current.relaxedEdge[1] === edge.to
    ) {
      return "relaxed";
    }
    if (current.prev[edge.to] === edge.from && current.distances[edge.to] !== Infinity) {
      return "path";
    }
    return "default";
  }

  function getNodeState(id) {
    if (current.updatedNode === id) return "updated";
    if (
      current.relaxedEdge &&
      (current.relaxedEdge[0] === id || current.relaxedEdge[1] === id)
    ) {
      return "relaxed";
    }
    return "default";
  }

  const maxDist = Math.max(
    1,
    ...Object.values(current.distances).filter((d) => d !== Infinity)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bellman-Ford 最短路径</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              从源节点 A 出发，对所有边进行 V-1 轮松弛操作，逐步更新最短距离。支持负权边，可检测负权环。
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
              onClick={() => setStep((v) => Math.min(totalSteps, v + 1))}
              className="rounded-2xl"
              aria-label="单步前进"
            >
              <Icon type="step" />
              下一步
            </Button>
            <Button
              variant="outline"
              onClick={() => { setStep(0); setPlaying(false); }}
              className="rounded-2xl"
              aria-label="重置动画"
            >
              <Icon type="reset" />
              重置
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
                  {current.iteration > 0 && (
                    <span className="ml-2 text-slate-400">
                      (轮 {current.iteration}/{DEFAULT_NODES.length - 1})
                    </span>
                  )}
                </div>
              </div>
              <svg
                viewBox="0 0 560 500"
                className="h-[480px] w-full rounded-2xl bg-white"
                role="img"
                aria-label="Bellman-Ford 最短路径动画"
              >
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
                    delta={
                      prevStep
                        ? current.distances[node.id] - prevStep.distances[node.id]
                        : 0
                    }
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
                  <div className="text-xs text-slate-500">
                    轮次 {current.iteration} / {DEFAULT_NODES.length - 1}
                  </div>
                </div>
                <div className="space-y-2">
                  {NODES.map((node) => {
                    const dist = current.distances[node.id];
                    const prevDist = prevStep ? prevStep.distances[node.id] : dist;
                    const changed = dist !== prevDist;
                    const widthPercent =
                      dist === Infinity ? 3 : Math.max(3, (Math.abs(dist) / maxDist) * 100);

                    return (
                      <div
                        key={node.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                          changed
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-slate-50 border border-transparent"
                        }`}
                      >
                        <span className="font-medium">
                          {node.id}
                          {node.id === DEFAULT_SOURCE && (
                            <span className="ml-2 text-indigo-500 text-xs">源</span>
                          )}
                        </span>
                        <motion.span
                          key={`${node.id}-${dist}`}
                          initial={changed ? { scale: 1.3, color: "#d97706" } : false}
                          animate={{
                            scale: 1,
                            color: dist === Infinity ? "#94a3b8" : "#0f172a",
                          }}
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
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-semibold">距离条形图</div>
                  <div className="text-xs text-slate-500">越短越好</div>
                </div>
                <div className="space-y-2">
                  {NODES.map((node) => {
                    const dist = current.distances[node.id];
                    const widthPercent =
                      dist === Infinity ? 3 : Math.max(3, (Math.abs(dist) / maxDist) * 100);

                    return (
                      <div key={node.id}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium">{node.id}</span>
                          <span className="font-mono">
                            {dist === Infinity ? "∞" : dist}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            className="h-full rounded-full bg-slate-800"
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ duration: 0.45 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-2 font-semibold text-slate-900">最短路径</div>
                <div className="space-y-1.5 text-sm text-slate-600">
                  {NODES.filter((n) => n.id !== DEFAULT_SOURCE).map((node) => {
                    const dist = current.distances[node.id];
                    if (dist === Infinity) {
                      return (
                        <div key={node.id} className="flex justify-between">
                          <span>{DEFAULT_SOURCE} → {node.id}</span>
                          <span className="text-slate-400">不可达</span>
                        </div>
                      );
                    }
                    const path = [];
                    let cur = node.id;
                    while (cur !== null) {
                      path.unshift(cur);
                      cur = current.prev[cur];
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
                <p>
                  节点圆圈内数字为当前最短距离估计。黄色节点表示本轮距离被更新，靛蓝色边为当前松弛操作。虚线边表示负权边，红色标签为负权重。紫色边为已确定的最短路径树边。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
