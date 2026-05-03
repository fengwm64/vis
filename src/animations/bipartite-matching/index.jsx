import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps } from "./algorithm";

const DEFAULT_INPUT = {
  leftNodes: [0, 1, 2, 3],
  rightNodes: [0, 1, 2, 3],
  edges: [[0, 0], [0, 1], [1, 0], [2, 1], [2, 2], [3, 2], [3, 3]],
};

const SVG_WIDTH = 600;
const SVG_HEIGHT = 420;
const NODE_RADIUS = 26;
const LEFT_X = 120;
const RIGHT_X = 480;
const PAD_Y = 60;

function buildPositions(nodeIds, x) {
  const count = nodeIds.length;
  if (count === 0) return {};
  const usable = SVG_HEIGHT - 2 * PAD_Y;
  const spacing = count > 1 ? usable / (count - 1) : 0;
  const pos = {};
  nodeIds.forEach((id, i) => {
    pos[id] = { x, y: PAD_Y + i * spacing };
  });
  return pos;
}

function getNodeFill(status) {
  switch (status) {
    case "matched": return "fill-indigo-100";
    case "visited": return "fill-amber-50";
    default: return "fill-white";
  }
}

function getNodeStroke(status) {
  switch (status) {
    case "matched": return "stroke-indigo-500";
    case "visited": return "stroke-amber-400";
    default: return "stroke-slate-300";
  }
}

function getEdgeStyle(status) {
  switch (status) {
    case "matched": return { stroke: "#10b981", strokeWidth: 3.5, opacity: 0.9 };
    case "searching": return { stroke: "#f59e0b", strokeWidth: 3, opacity: 0.9, strokeDasharray: "8 4" };
    case "augmenting": return { stroke: "#3b82f6", strokeWidth: 3.5, opacity: 0.9 };
    default: return { stroke: "#cbd5e1", strokeWidth: 1.5, opacity: 0.5 };
  }
}

function getPhaseLabel(phase) {
  switch (phase) {
    case "searching": return "搜索中";
    case "augmenting": return "增广路";
    case "complete": return "完成";
    default: return phase;
  }
}

function getPhaseColor(phase) {
  switch (phase) {
    case "searching": return "bg-amber-100 text-amber-700";
    case "augmenting": return "bg-blue-100 text-blue-700";
    case "complete": return "bg-emerald-100 text-emerald-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export default function BipartiteMatchingAnimation() {
  const steps = useMemo(() => computeSteps(DEFAULT_INPUT), []);
  const { leftNodes: leftIds, rightNodes: rightIds } = DEFAULT_INPUT;

  const leftPos = useMemo(() => buildPositions(leftIds, LEFT_X), [leftIds]);
  const rightPos = useMemo(() => buildPositions(rightIds, RIGHT_X), [rightIds]);

  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);

  const step = steps[currentStep];
  const matchingCount = Object.keys(step.matching).length;
  const maxMatching = Math.min(leftIds.length, rightIds.length);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setCurrentStep((value) => {
        if (value >= steps.length - 1) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, steps.length]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">二分图最大匹配</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              使用增广路算法（Kuhn's Algorithm）在二分图中寻找最大基数匹配。左侧为 U 集合，右侧为 V 集合，通过交替路径翻转逐步增大匹配集合。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (currentStep >= steps.length - 1 && !playing) {
                  setCurrentStep(0);
                  setPlaying(true);
                } else {
                  setPlaying((v) => !v);
                }
              }}
              className="rounded-2xl shadow-sm"
              aria-label={playing ? "暂停动画" : "播放动画"}
            >
              {playing ? "⏸ 暂停" : "▶ 播放"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPlaying(false);
                setCurrentStep((v) => Math.min(steps.length - 1, v + 1));
              }}
              disabled={currentStep >= steps.length - 1}
              className="rounded-2xl"
              aria-label="单步前进"
            >
              ⏭ 前进
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPlaying(false);
                setCurrentStep((v) => Math.max(0, v - 1));
              }}
              disabled={currentStep <= 0}
              className="rounded-2xl"
              aria-label="单步后退"
            >
              ⏮ 后退
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPlaying(false);
                setCurrentStep(0);
              }}
              className="rounded-2xl"
              aria-label="重置动画"
            >
              ↺ 重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">二分图</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {currentStep} / {steps.length - 1}
                </div>
              </div>

              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="h-[430px] w-full rounded-2xl bg-white"
                role="img"
                aria-label="二分图最大匹配动画"
              >
                <text x={LEFT_X} y={28} textAnchor="middle" className="fill-slate-400 text-sm">
                  U 集合
                </text>
                <text x={RIGHT_X} y={28} textAnchor="middle" className="fill-slate-400 text-sm">
                  V 集合
                </text>

                {step.edges.map((edge) => {
                  const from = leftPos[edge.u];
                  const to = rightPos[edge.v];
                  if (!from || !to) return null;
                  const style = getEdgeStyle(edge.status);
                  return (
                    <motion.line
                      key={`${edge.u}-${edge.v}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      opacity={style.opacity}
                      strokeDasharray={style.strokeDasharray}
                      strokeLinecap="round"
                      animate={{
                        stroke: style.stroke,
                        strokeWidth: style.strokeWidth,
                        opacity: style.opacity,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  );
                })}

                {step.augmentingPath.length > 0 &&
                  step.augmentingPath.map(([u, v], idx) => {
                    const from = leftPos[u];
                    const to = rightPos[v];
                    if (!from || !to) return null;
                    const mx = (from.x + to.x) / 2;
                    const my = (from.y + to.y) / 2;
                    return (
                      <motion.circle
                        key={`aug-dot-${idx}`}
                        cx={mx}
                        cy={my}
                        r={5}
                        className="fill-blue-500"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                      />
                    );
                  })}

                {leftIds.map((id) => {
                  const pos = leftPos[id];
                  const node = step.leftNodes.find((n) => n.id === id);
                  const status = node ? node.status : "unvisited";
                  const isCurrent = step.currentU === id;
                  return (
                    <g key={`L-${id}`}>
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={NODE_RADIUS}
                        className={`${getNodeFill(status)} ${getNodeStroke(status)}`}
                        strokeWidth={isCurrent ? 4 : 2}
                        animate={{ r: isCurrent ? NODE_RADIUS + 4 : NODE_RADIUS }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-slate-800 text-lg font-bold"
                      >
                        {id}
                      </text>
                      {isCurrent && (
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={NODE_RADIUS + 8}
                          fill="none"
                          className="stroke-amber-400"
                          strokeWidth={2}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.3, 0.7, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </g>
                  );
                })}

                {rightIds.map((id) => {
                  const pos = rightPos[id];
                  const node = step.rightNodes.find((n) => n.id === id);
                  const status = node ? node.status : "unvisited";
                  return (
                    <g key={`R-${id}`}>
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={NODE_RADIUS}
                        className={`${getNodeFill(status)} ${getNodeStroke(status)}`}
                        strokeWidth={2}
                        animate={{ r: NODE_RADIUS }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-slate-800 text-lg font-bold"
                      >
                        {id}
                      </text>
                    </g>
                  );
                })}

                {step.phase === "complete" && (
                  <text
                    x={SVG_WIDTH / 2}
                    y={SVG_HEIGHT - 12}
                    textAnchor="middle"
                    className="fill-emerald-600 text-sm font-semibold"
                  >
                    匹配完成：最大匹配数 = {matchingCount}
                  </text>
                )}
              </svg>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">当前步骤</div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getPhaseColor(step.phase)}`}
                  >
                    {getPhaseLabel(step.phase)}
                  </span>
                  {step.currentU !== null && (
                    <span className="text-xs text-slate-400">处理节点 {step.currentU}</span>
                  )}
                </div>
                <p className="text-sm leading-6 text-slate-700">{step.message}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-500">匹配统计</div>
                  <div className="text-sm text-slate-400">
                    {matchingCount} / {maxMatching}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      animate={{ width: `${maxMatching > 0 ? (matchingCount / maxMatching) * 100 : 0}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
                {matchingCount > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(step.matching).map(([u, v]) => (
                      <span
                        key={`${u}-${v}`}
                        className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                      >
                        ({u}, {v})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">暂无匹配</div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">图例</div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-0.5 w-5 rounded bg-slate-300" />
                    <span>普通边</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-0.5 w-5 rounded bg-emerald-500" style={{ height: 3 }} />
                    <span>匹配边</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-0.5 w-5 rounded bg-amber-500" style={{ height: 2, borderTop: "2px dashed #f59e0b" }} />
                    <span>正在搜索</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-0.5 w-5 rounded bg-blue-500" style={{ height: 3 }} />
                    <span>增广路</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-indigo-500 bg-indigo-100" />
                    <span>已匹配节点</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-amber-400 bg-amber-50" />
                    <span>已访问节点</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-300 bg-white" />
                    <span>未访问节点</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">播放速度</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">慢</span>
                  <input
                    type="range"
                    min={400}
                    max={2400}
                    step={200}
                    value={2800 - speed}
                    onChange={(e) => setSpeed(2800 - Number(e.target.value))}
                    className="flex-1 accent-slate-900"
                    aria-label="播放速度"
                  />
                  <span className="text-xs text-slate-400">快</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
