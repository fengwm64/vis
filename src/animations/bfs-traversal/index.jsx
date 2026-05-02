import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps } from "./algorithm";

const NODE_RADIUS = 26;

const GRAPH_NODES = [
  { id: "A", x: 280, y: 60 },
  { id: "B", x: 120, y: 180 },
  { id: "C", x: 440, y: 180 },
  { id: "D", x: 120, y: 320 },
  { id: "E", x: 280, y: 320 },
  { id: "F", x: 440, y: 320 },
];

const GRAPH_EDGES = [
  ["A", "B"],
  ["A", "C"],
  ["B", "D"],
  ["B", "E"],
  ["C", "E"],
  ["C", "F"],
  ["E", "F"],
];

const nodePosMap = Object.fromEntries(
  GRAPH_NODES.map((n) => [n.id, n])
);

const STATE_COLORS = {
  default: { fill: "#ffffff", stroke: "#94a3b8", text: "#1e293b" },
  enqueued: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
  current: { fill: "#818cf8", stroke: "#4f46e5", text: "#ffffff" },
  completed: { fill: "#e2e8f0", stroke: "#94a3b8", text: "#64748b" },
};

function Icon({ type }) {
  const common =
    "mr-1.5 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const labels = { play: "▶", pause: "⏸", step: "⏭", reset: "↺" };
  return (
    <span className={common} aria-hidden="true">
      {labels[type]}
    </span>
  );
}

function UndirectedEdge({ from, to, active }) {
  const s = nodePosMap[from];
  const e = nodePosMap[to];
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const sx = s.x + ux * (NODE_RADIUS + 2);
  const sy = s.y + uy * (NODE_RADIUS + 2);
  const ex = e.x - ux * (NODE_RADIUS + 2);
  const ey = e.y - uy * (NODE_RADIUS + 2);

  return (
    <motion.line
      x1={sx}
      y1={sy}
      x2={ex}
      y2={ey}
      stroke={active ? "#6366f1" : "#cbd5e1"}
      strokeWidth={active ? 3.5 : 2}
      strokeLinecap="round"
      animate={{
        stroke: active ? "#6366f1" : "#cbd5e1",
        strokeWidth: active ? 3.5 : 2,
      }}
      transition={{ duration: 0.3 }}
    />
  );
}

function GraphNode({ id, state }) {
  const pos = nodePosMap[id];
  const colors = STATE_COLORS[state] || STATE_COLORS.default;

  return (
    <g>
      <motion.circle
        cx={pos.x}
        cy={pos.y}
        r={NODE_RADIUS}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={3}
        animate={{
          fill: colors.fill,
          stroke: colors.stroke,
        }}
        transition={{ duration: 0.35 }}
      />
      <text
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-base font-bold"
        fill={colors.text}
      >
        {id}
      </text>
    </g>
  );
}

function QueueDisplay({ queue, currentNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {queue.length === 0 && !currentNode && (
        <span className="text-sm text-slate-400">空</span>
      )}
      <AnimatePresence mode="popLayout">
        {queue.map((nodeId, idx) => (
          <motion.span
            key={`q-${nodeId}-${idx}`}
            layout
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700"
          >
            {nodeId}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

function VisitedSequence({ visited }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {visited.length === 0 && (
        <span className="text-sm text-slate-400">尚无遍历结果</span>
      )}
      {visited.map((nodeId, idx) => (
        <React.Fragment key={`v-${nodeId}`}>
          {idx > 0 && (
            <span className="text-sm text-slate-400">→</span>
          )}
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700"
          >
            {nodeId}
          </motion.span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function BFSTraversalAnimation() {
  const steps = useMemo(() => computeSteps(), []);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const current = steps[stepIdx];
  const isLast = stepIdx >= steps.length - 1;

  useEffect(() => {
    if (!playing) return undefined;
    if (isLast) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [playing, isLast, steps.length]);

  const handleStep = useCallback(() => {
    if (stepIdx < steps.length - 1) {
      setStepIdx((v) => v + 1);
    }
  }, [stepIdx, steps.length]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setStepIdx(0);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isLast) {
      setStepIdx(0);
      setPlaying(true);
    } else {
      setPlaying((v) => !v);
    }
  }, [isLast]);

  const isEdgeActive = (from, to) => {
    if (!current.exploringEdge) return false;
    const [ef, et] = current.exploringEdge;
    return (ef === from && et === to) || (ef === to && et === from);
  };

  const nodeStateMap = Object.fromEntries(
    current.nodes.map((n) => [n.id, n.state])
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              BFS 遍历算法
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              从起始节点出发，使用队列逐层访问图中所有可达节点。节点颜色表示状态：白色默认、蓝色已入队、靛蓝当前访问、灰色已完成。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePlayPause}
              className="rounded-2xl shadow-sm"
              aria-label={playing ? "暂停动画" : "播放动画"}
            >
              <Icon type={playing ? "pause" : "play"} />
              {playing ? "暂停" : isLast ? "重新播放" : "播放"}
            </Button>
            <Button
              variant="outline"
              onClick={handleStep}
              disabled={isLast}
              className="rounded-2xl"
              aria-label="单步前进"
            >
              <Icon type="step" />
              下一步
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-2xl"
              aria-label="重置动画"
            >
              <Icon type="reset" />
              重置
            </Button>
          </div>
        </div>

        {/* Main content: dual-column */}
        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* Left: Graph SVG */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">图结构</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {stepIdx} / {steps.length - 1}
                </div>
              </div>

              <svg
                viewBox="0 0 560 400"
                className="h-[420px] w-full rounded-2xl bg-white"
                role="img"
                aria-label="BFS 遍历图结构动画"
              >
                {/* Edges */}
                {GRAPH_EDGES.map(([from, to]) => (
                  <UndirectedEdge
                    key={`${from}-${to}`}
                    from={from}
                    to={to}
                    active={isEdgeActive(from, to)}
                  />
                ))}

                {/* Nodes */}
                {GRAPH_NODES.map((node) => (
                  <GraphNode
                    key={node.id}
                    id={node.id}
                    state={nodeStateMap[node.id]}
                  />
                ))}
              </svg>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {[
                  { label: "默认", color: "#ffffff", border: "#94a3b8" },
                  { label: "已入队", color: "#dbeafe", border: "#3b82f6" },
                  { label: "当前访问", color: "#818cf8", border: "#4f46e5" },
                  { label: "已完成", color: "#e2e8f0", border: "#94a3b8" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-4 w-4 rounded-full border-2"
                      style={{
                        backgroundColor: item.color,
                        borderColor: item.border,
                      }}
                    />
                    {item.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: info panels */}
          <div className="space-y-5">
            {/* Current step description */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  当前步骤
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-base leading-6 text-slate-800"
                  >
                    {current.description}
                  </motion.p>
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Queue */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-500">
                    队列（FIFO）
                  </div>
                  {current.currentNode && (
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      出队: {current.currentNode}
                    </span>
                  )}
                </div>
                <QueueDisplay
                  queue={current.queue}
                  currentNode={current.currentNode}
                />
              </CardContent>
            </Card>

            {/* Visited sequence */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">
                  遍历结果
                </div>
                <VisitedSequence visited={current.visited} />
              </CardContent>
            </Card>

            {/* Algorithm info */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">
                  算法说明
                </div>
                <p>
                  BFS 使用队列（FIFO）管理待访问节点。每次从队列头部取出节点访问，将其未入队的邻居加入队列尾部。时间复杂度 O(V+E)，空间复杂度 O(V)。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
