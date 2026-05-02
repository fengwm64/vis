import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  computeSteps,
  DEFAULT_EDGES,
  DEFAULT_VERTICES,
} from "./algorithm";

const INF = Infinity;
const NODE_RADIUS = 28;
const SVG_W = 400;
const SVG_H = 340;

const NODE_POSITIONS = [
  { x: 200, y: 50 },
  { x: 350, y: 175 },
  { x: 200, y: 300 },
  { x: 50, y: 175 },
];

const SPEED_LABELS = ["0.5x", "1x", "2x", "4x"];
const SPEED_INTERVALS = [2800, 1400, 700, 350];

function formatVal(v) {
  return v === INF ? "∞" : String(v);
}

// -- Arrow with weight label --
function GraphEdge({ from, to, weight, active, highlight }) {
  const sx = NODE_POSITIONS[from].x;
  const sy = NODE_POSITIONS[from].y;
  const ex = NODE_POSITIONS[to].x;
  const ey = NODE_POSITIONS[to].y;
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const ax = sx + ux * (NODE_RADIUS + 4);
  const ay = sy + uy * (NODE_RADIUS + 4);
  const bx = ex - ux * (NODE_RADIUS + 14);
  const by = ey - uy * (NODE_RADIUS + 14);
  const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 - 10;

  const strokeColor = highlight ? "#4f46e5" : active ? "#6366f1" : "#a8a8a8";
  const opacity = highlight ? 1 : active ? 0.8 : 0.45;

  return (
    <g opacity={opacity}>
      <line
        x1={ax} y1={ay} x2={bx} y2={by}
        stroke={strokeColor}
        strokeWidth={highlight ? 3 : 2}
      />
      <polygon
        points="0,-5 10,0 0,5"
        transform={`translate(${bx},${by}) rotate(${angle})`}
        fill={strokeColor}
      />
      <text
        x={mx} y={my}
        textAnchor="middle"
        className="text-xs font-medium"
        fill={highlight ? "#4338ca" : "#64748b"}
      >
        {weight}
      </text>
      {highlight && (
        <motion.circle
          r="5"
          fill="#4f46e5"
          initial={{ cx: ax, cy: ay, opacity: 0 }}
          animate={{ cx: bx, cy: by, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}

// -- Matrix cell --
function MatrixCell({ value, isDiag, isTarget, isSrcMid, isMidDst, isChecking }) {
  let bg = "bg-white";
  let textColor = "text-slate-700";
  let ring = "";

  if (isDiag) {
    bg = "bg-slate-50";
    textColor = "text-slate-400";
  }
  if (isTarget) {
    bg = "bg-indigo-100";
    textColor = "text-indigo-700 font-bold";
    ring = "ring-2 ring-indigo-400";
  } else if (isSrcMid || isMidDst) {
    bg = "bg-amber-50";
    textColor = "text-amber-700";
  } else if (isChecking) {
    bg = "bg-slate-50";
  }

  return (
    <motion.td
      layout
      className={`px-2 py-1.5 text-center text-sm tabular-nums border border-slate-200 ${bg} ${textColor} ${ring}`}
      animate={isTarget ? { scale: [1, 1.12, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {formatVal(value)}
    </motion.td>
  );
}

// -- Main component --
export default function FloydWarshallAnimation() {
  const { steps, initialDist } = useMemo(() => {
    return computeSteps(DEFAULT_EDGES, DEFAULT_VERTICES.length);
  }, []);

  const totalSteps = steps.length;
  const [stepIdx, setStepIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timerRef = useRef(null);

  const current = stepIdx >= 0 ? steps[stepIdx] : null;
  const dist = current ? current.dist : initialDist;
  const k = current?.k;
  const ci = current?.i;
  const cj = current?.j;

  const roundLabel = current ? `${k + 1} / ${DEFAULT_VERTICES.length}` : "- / -";
  const stepInRound = current ? ci * DEFAULT_VERTICES.length + cj + 1 : 0;
  const stepsPerRound = DEFAULT_VERTICES.length * DEFAULT_VERTICES.length;

  // Highlight edges connected to intermediate node k
  const highlightEdges = useMemo(() => {
    if (k == null) return [];
    const hes = [];
    for (const e of DEFAULT_EDGES) {
      if (e.from === k || e.to === k) hes.push(`${e.from}-${e.to}`);
    }
    return hes;
  }, [k]);

  // Auto-play timer
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      return undefined;
    }
    timerRef.current = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, SPEED_INTERVALS[speedIdx]);
    return () => window.clearInterval(timerRef.current);
  }, [playing, speedIdx, totalSteps]);

  const goStep = useCallback(
    (delta) => {
      setStepIdx((prev) => Math.max(-1, Math.min(totalSteps - 1, prev + delta)));
    },
    [totalSteps]
  );

  const reset = useCallback(() => {
    setPlaying(false);
    setStepIdx(-1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") { e.preventDefault(); goStep(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goStep(-1); }
      else if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); reset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goStep, reset]);

  const atStart = stepIdx < 0;
  const atEnd = stepIdx >= totalSteps - 1;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Floyd-Warshall 全源最短路径</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              通过逐步以每个顶点 k 作为中间节点，对所有顶点对 (i, j) 尝试松弛路径，最终得到全局最短路径矩阵。
              矩阵中每个单元格表示从 i 到 j 的当前最短距离。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setPlaying((p) => !p)}
              className="rounded-2xl shadow-sm"
              aria-label={playing ? "暂停动画" : "播放动画"}
            >
              {playing ? "⏸ 暂停" : "▶ 播放"}
            </Button>
            <Button
              variant="outline"
              onClick={() => goStep(1)}
              disabled={atEnd}
              className="rounded-2xl"
              aria-label="单步前进"
            >
              ⏭ 下一步
            </Button>
            <Button
              variant="outline"
              onClick={() => goStep(-1)}
              disabled={atStart}
              className="rounded-2xl"
              aria-label="单步后退"
            >
              ⏪ 上一步
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              className="rounded-2xl"
              aria-label="重置动画"
            >
              ↺ 重置
            </Button>
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm">
              <span className="text-slate-500">速度</span>
              {SPEED_LABELS.map((label, idx) => (
                <button
                  key={label}
                  onClick={() => setSpeedIdx(idx)}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                    idx === speedIdx
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-label={`设置速度 ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: Graph + Matrix */}
          <div className="space-y-5">
            {/* Graph card */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">有向带权图</div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    中间节点 k = {k != null ? k : "-"}
                  </div>
                </div>
                <svg
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  className="w-full rounded-2xl bg-white"
                  style={{ maxHeight: 300 }}
                  role="img"
                  aria-label="Floyd-Warshall 有向带权图"
                >
                  {DEFAULT_EDGES.map((e) => (
                    <GraphEdge
                      key={`${e.from}-${e.to}`}
                      from={e.from}
                      to={e.to}
                      weight={e.weight}
                      active={stepIdx >= 0}
                      highlight={highlightEdges.includes(`${e.from}-${e.to}`)}
                    />
                  ))}
                  {NODE_POSITIONS.map((pos, idx) => {
                    const isK = idx === k;
                    const isI = idx === ci;
                    const isJ = idx === cj;
                    const isActive = isK || isI || isJ;
                    const fillColor = isK
                      ? "#4f46e5"
                      : isI || isJ
                      ? "#f59e0b"
                      : "white";
                    const strokeColor = isK
                      ? "#4338ca"
                      : isI || isJ
                      ? "#d97706"
                      : "#6366f1";
                    const textColor = isK || isI || isJ ? "white" : "#1e293b";

                    return (
                      <g key={idx}>
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={NODE_RADIUS}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isActive ? 3 : 2}
                          animate={{ fill: fillColor, stroke: strokeColor }}
                          transition={{ duration: 0.3 }}
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-base font-bold"
                          fill={textColor}
                        >
                          {idx}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-full bg-indigo-600" /> 中间节点 k
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-full bg-amber-500" /> 检查节点 i / j
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Matrix card */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">距离矩阵</div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    第 {roundLabel} 轮 &middot; 步骤 {stepInRound}/{stepsPerRound}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-2 py-1.5 text-xs font-medium text-slate-400" />
                        {DEFAULT_VERTICES.map((v) => (
                          <th
                            key={v}
                            className={`px-2 py-1.5 text-xs font-medium ${
                              v === k
                                ? "text-indigo-600"
                                : v === ci || v === cj
                                ? "text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            {v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEFAULT_VERTICES.map((row) => (
                        <tr key={row}>
                          <th
                            className={`px-2 py-1.5 text-xs font-medium ${
                              row === k
                                ? "text-indigo-600"
                                : row === ci || row === cj
                                ? "text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            {row}
                          </th>
                          {DEFAULT_VERTICES.map((col) => (
                            <MatrixCell
                              key={col}
                              value={dist[row][col]}
                              isDiag={row === col}
                              isTarget={row === ci && col === cj}
                              isSrcMid={row === ci && col === k}
                              isMidDst={row === k && col === cj}
                              isChecking={stepIdx >= 0}
                            />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Description + Info */}
          <div className="space-y-5">
            {/* Step description */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">当前步骤</div>
                <AnimatePresence mode="wait">
                  {current ? (
                    <motion.div
                      key={stepIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-3 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
                        {current.description}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-indigo-50 p-3">
                          <div className="text-xs text-indigo-500">中间节点 k</div>
                          <div className="mt-1 text-lg font-bold text-indigo-700">{k}</div>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3">
                          <div className="text-xs text-amber-500">检查顶点对</div>
                          <div className="mt-1 text-lg font-bold text-amber-700">({ci}, {cj})</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-xs text-slate-500">dist[{ci}][{cj}] 旧值</div>
                          <div className="mt-1 text-lg font-bold text-slate-700">{formatVal(current.oldValue)}</div>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: current.relaxed ? "#ecfdf5" : "#f8fafc" }}>
                          <div className="text-xs" style={{ color: current.relaxed ? "#10b981" : "#94a3b8" }}>
                            {current.relaxed ? "松弛成功" : "无需更新"}
                          </div>
                          <div
                            className="mt-1 text-lg font-bold"
                            style={{ color: current.relaxed ? "#059669" : "#64748b" }}
                          >
                            {formatVal(current.newValue)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-500"
                    >
                      点击"播放"或"下一步"开始查看 Floyd-Warshall 算法的执行过程。
                      算法将依次以每个顶点 k 为中间节点，检查所有顶点对 (i, j) 是否可以通过 k 缩短路径。
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">矩阵单元格颜色</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded border-2 border-indigo-400 bg-indigo-100" />
                    <span className="text-slate-600">当前正在检查的 dist[i][j]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded bg-amber-50" />
                    <span className="text-slate-600">路径相关：dist[i][k] 和 dist[k][j]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded bg-slate-50" />
                    <span className="text-slate-600">对角线 (i == j)，始终为 0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Algorithm info */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">算法信息</div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>时间复杂度</span>
                    <span className="font-mono font-medium text-slate-900">O(n&sup3;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>空间复杂度</span>
                    <span className="font-mono font-medium text-slate-900">O(n&sup2;)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>顶点数</span>
                    <span className="font-mono font-medium text-slate-900">{DEFAULT_VERTICES.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>总步骤数</span>
                    <span className="font-mono font-medium text-slate-900">{totalSteps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>键盘快捷键</span>
                    <span className="text-slate-500">Space / ← → / R</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress bar */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-500">进度</span>
                  <span className="text-slate-500">
                    {stepIdx + 1} / {totalSteps}
                  </span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-slate-100 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    setStepIdx(Math.max(-1, Math.min(totalSteps - 1, Math.round(ratio * totalSteps) - 1)));
                  }}
                  role="slider"
                  aria-label="进度条"
                  aria-valuemin={0}
                  aria-valuemax={totalSteps}
                  aria-valuenow={stepIdx + 1}
                >
                  <motion.div
                    className="h-full rounded-full bg-indigo-500"
                    animate={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
