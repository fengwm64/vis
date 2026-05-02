import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps, runAlgorithmTests, EXAMPLES } from "./algorithm";

const NODE_POSITIONS = {
  "课程依赖图": {
    "0": { x: 120, y: 100 },
    "1": { x: 400, y: 100 },
    "2": { x: 260, y: 220 },
    "3": { x: 140, y: 350 },
    "4": { x: 380, y: 350 },
    "5": { x: 260, y: 460 },
  },
  "多源节点图": {
    "A": { x: 100, y: 100 },
    "B": { x: 420, y: 100 },
    "C": { x: 260, y: 230 },
    "D": { x: 260, y: 370 },
    "E": { x: 260, y: 480 },
  },
  "含环图": {
    "0": { x: 150, y: 130 },
    "1": { x: 370, y: 130 },
    "2": { x: 260, y: 350 },
  },
};

const NODE_RADIUS = 28;
const STATE_COLORS = {
  default: { fill: "#e2e8f0", stroke: "#94a3b8", text: "#334155" },
  zero: { fill: "#fef9c3", stroke: "#eab308", text: "#854d0e" },
  processing: { fill: "#fed7aa", stroke: "#f97316", text: "#9a3412" },
  sorted: { fill: "#bbf7d0", stroke: "#22c55e", text: "#166534" },
  cycle: { fill: "#fecaca", stroke: "#ef4444", text: "#991b1b" },
};

const SPEED_OPTIONS = [
  { label: "慢", ms: 2000 },
  { label: "中", ms: 1200 },
  { label: "快", ms: 600 },
];

function Icon({ type }) {
  const common = "mr-1.5 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const map = { play: "▶", pause: "⏸", step: "⏭", back: "⏮", reset: "↺" };
  return <span className={common} aria-hidden="true">{map[type]}</span>;
}

function DirectedEdge({ from, to, posMap, state }) {
  const s = posMap[from];
  const e = posMap[to];
  if (!s || !e) return null;

  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const sx = s.x + ux * (NODE_RADIUS + 4);
  const sy = s.y + uy * (NODE_RADIUS + 4);
  const ex = e.x - ux * (NODE_RADIUS + 14);
  const ey = e.y - uy * (NODE_RADIUS + 14);
  const angle = (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI;

  const isRemoved = state === "removed";
  const isCurrent = state === "current";
  const strokeColor = isCurrent ? "#f97316" : isRemoved ? "#d1d5db" : "#94a3b8";
  const opacity = isRemoved ? 0.35 : isCurrent ? 1 : 0.6;
  const width = isCurrent ? 3 : 2;

  return (
    <g opacity={opacity}>
      <motion.line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={strokeColor}
        strokeWidth={width}
        strokeDasharray={isRemoved ? "6 4" : "none"}
        initial={false}
        animate={{ opacity: isRemoved ? 0.3 : 1 }}
        transition={{ duration: 0.3 }}
      />
      <polygon
        points="0,-5 10,0 0,5"
        transform={`translate(${ex},${ey}) rotate(${angle})`}
        fill={strokeColor}
      />
      {isCurrent && (
        <motion.circle
          r="5"
          fill="#f97316"
          initial={{ cx: sx, cy: sy, opacity: 0 }}
          animate={{ cx: ex, cy: ey, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}

function GraphView({ step, nodes, edges, exampleLabel }) {
  const posMap = NODE_POSITIONS[exampleLabel] || {};
  const removedSet = new Set(step.removedEdges.map(([u, v]) => `${u}->${v}`));
  const currentKey = step.currentEdge ? `${step.currentEdge[0]}->${step.currentEdge[1]}` : null;

  return (
    <svg viewBox="0 0 520 520" className="h-[420px] w-full rounded-2xl bg-white" role="img" aria-label="拓扑排序图可视化">
      {edges.map(([u, v]) => {
        const key = `${u}->${v}`;
        let state = "normal";
        if (key === currentKey) state = "current";
        else if (removedSet.has(key)) state = "removed";
        return <DirectedEdge key={key} from={u} to={v} posMap={posMap} state={state} />;
      })}

      {step.nodes.map((n) => {
        const pos = posMap[n.id];
        if (!pos) return null;
        const colors = STATE_COLORS[n.state] || STATE_COLORS.default;
        return (
          <g key={n.id}>
            <motion.circle
              cx={pos.x} cy={pos.y} r={NODE_RADIUS}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="3"
              initial={false}
              animate={{ fill: colors.fill, stroke: colors.stroke }}
              transition={{ duration: 0.3 }}
            />
            <text
              x={pos.x} y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-base font-bold"
              fill={colors.text}
            >
              {n.id}
            </text>
            <text
              x={pos.x} y={pos.y + NODE_RADIUS + 16}
              textAnchor="middle"
              className="text-xs"
              fill="#64748b"
            >
              入度 {step.inDegrees[n.id]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function InDegreeTable({ step, nodes }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {nodes.map((id) => {
        const state = step.nodes.find((n) => n.id === id)?.state || "default";
        const colors = STATE_COLORS[state] || STATE_COLORS.default;
        return (
          <motion.div
            key={id}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: colors.fill, border: `1px solid ${colors.stroke}` }}
            initial={false}
            animate={{ backgroundColor: colors.fill }}
            transition={{ duration: 0.3 }}
          >
            <span className="font-semibold" style={{ color: colors.text }}>{id}</span>
            <span className="font-mono" style={{ color: colors.text }}>{step.inDegrees[id]}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function QueueView({ queue }) {
  return (
    <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
      {queue.length === 0 ? (
        <span className="text-sm text-slate-400">空</span>
      ) : (
        queue.map((id, i) => (
          <motion.span
            key={`${id}-${i}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100 border border-yellow-400 text-sm font-bold text-yellow-800"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {id}
          </motion.span>
        ))
      )}
    </div>
  );
}

function SortedView({ sorted }) {
  return (
    <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
      {sorted.length === 0 ? (
        <span className="text-sm text-slate-400">无</span>
      ) : (
        sorted.map((id, i) => (
          <React.Fragment key={`sorted-${i}`}>
            {i > 0 && <span className="text-slate-400 text-sm">→</span>}
            <motion.span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 border border-green-400 text-sm font-bold text-green-800"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {id}
            </motion.span>
          </React.Fragment>
        ))
      )}
    </div>
  );
}

export default function TopologicalSortAnimation() {
  useMemo(() => { runAlgorithmTests(); }, []);

  const [exampleIdx, setExampleIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);

  const example = EXAMPLES[exampleIdx];
  const steps = useMemo(() => computeSteps(example), [exampleIdx]);
  const currentStep = steps[stepIdx] || steps[steps.length - 1];

  const handleExampleChange = useCallback((idx) => {
    setExampleIdx(idx);
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    setStepIdx((v) => Math.min(steps.length - 1, v + 1));
  }, [steps.length]);

  const handleStepBack = useCallback(() => {
    setStepIdx((v) => Math.max(0, v - 1));
  }, []);

  const handleReset = useCallback(() => {
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (stepIdx >= steps.length - 1) {
      setStepIdx(0);
    }
    setPlaying((v) => !v);
  }, [stepIdx, steps.length]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStepIdx((v) => {
        if (v >= steps.length - 1) {
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, SPEED_OPTIONS[speedIdx].ms);
    return () => window.clearInterval(timer);
  }, [playing, speedIdx, steps.length]);

  const isAtStart = stepIdx === 0;
  const isAtEnd = stepIdx >= steps.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">拓扑排序</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Kahn's 算法：不断取出入度为 0 的节点，移除其出边，直到所有节点排序完成或检测到环。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleTogglePlay} className="rounded-2xl shadow-sm" aria-label={playing ? "暂停动画" : "播放动画"}>
              <Icon type={playing ? "pause" : "play"} />
              {playing ? "暂停" : "播放"}
            </Button>
            <Button variant="outline" onClick={handleStepBack} disabled={isAtStart} className="rounded-2xl" aria-label="后退一步">
              <Icon type="back" />后退
            </Button>
            <Button variant="outline" onClick={handleStepForward} disabled={isAtEnd} className="rounded-2xl" aria-label="前进一步">
              <Icon type="step" />前进
            </Button>
            <Button variant="outline" onClick={handleReset} className="rounded-2xl" aria-label="重置动画">
              <Icon type="reset" />重置
            </Button>
          </div>
        </div>

        {/* Example switcher & speed */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-500">示例：</span>
          {EXAMPLES.map((ex, i) => (
            <Button
              key={ex.label}
              variant={i === exampleIdx ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handleExampleChange(i)}
            >
              {ex.label}
            </Button>
          ))}
          <span className="ml-4 text-sm font-medium text-slate-500">速度：</span>
          {SPEED_OPTIONS.map((opt, i) => (
            <Button
              key={opt.label}
              variant={i === speedIdx ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSpeedIdx(i)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Main content */}
        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* Graph card */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">有向无环图</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {stepIdx} / {steps.length - 1}
                </div>
              </div>
              <GraphView
                step={currentStep}
                nodes={example.nodes}
                edges={example.edges}
                exampleLabel={example.label}
              />
            </CardContent>
          </Card>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Step description */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">当前步骤</div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIdx}
                    className="text-base leading-6 text-slate-800"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentStep.description}
                  </motion.p>
                </AnimatePresence>
                {currentStep.hasCycle && (
                  <motion.div
                    className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 font-medium"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    检测到环，拓扑排序失败
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* In-degree table */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">入度表</div>
                <InDegreeTable step={currentStep} nodes={example.nodes} />
              </CardContent>
            </Card>

            {/* Queue */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">待处理队列（入度为 0）</div>
                <QueueView queue={currentStep.queue} />
              </CardContent>
            </Card>

            {/* Sorted sequence */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">拓扑序列</div>
                <SortedView sorted={currentStep.sorted} />
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">图例</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "默认", color: STATE_COLORS.default },
                    { label: "入度为 0", color: STATE_COLORS.zero },
                    { label: "处理中", color: STATE_COLORS.processing },
                    { label: "已排序", color: STATE_COLORS.sorted },
                    { label: "环中节点", color: STATE_COLORS.cycle },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border-2"
                        style={{ backgroundColor: item.color.fill, borderColor: item.color.stroke }}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-slate-500">虚线箭头表示已移除的边。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
