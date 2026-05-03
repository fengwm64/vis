import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps, PRESETS, SCC_COLORS } from "./algorithm";

const NODE_LAYOUTS = [
  // Preset 0: 经典示例 A,B,C,D,E,F
  { A: [120, 100], B: [260, 60], C: [260, 200], D: [400, 100], E: [520, 60], F: [520, 200] },
  // Preset 1: 链式图 A,B,C,D
  { A: [100, 150], B: [250, 150], C: [400, 150], D: [550, 150] },
  // Preset 2: 全连通 A,B,C
  { A: [200, 80], B: [400, 80], C: [300, 240] },
];

const NODE_RADIUS = 28;
const PHASE_LABELS = { 1: "第一次 DFS（原图）", 2: "构建反图", 3: "第二次 DFS（反图）" };
const SPEED_LABELS = ["慢速", "正常", "快速"];

function Icon({ type }) {
  const cls = "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const map = { play: "▶", pause: "‖", step: "⏭", reset: "↺" };
  return <span className={cls} aria-hidden="true">{map[type]}</span>;
}

function Arrow({ x1, y1, x2, y2, color, opacity, strokeWidth }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const sx = x1 + ux * (NODE_RADIUS + 4);
  const sy = y1 + uy * (NODE_RADIUS + 4);
  const ex = x2 - ux * (NODE_RADIUS + 12);
  const ey = y2 - uy * (NODE_RADIUS + 12);
  const angle = (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI;

  return (
    <g>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
      <polygon
        points="0,-5 10,0 0,5"
        transform={`translate(${ex},${ey}) rotate(${angle})`}
        fill={color}
        opacity={opacity}
      />
    </g>
  );
}

export default function KosarajuSCC() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const steps = useMemo(() => computeSteps(presetIdx), [presetIdx]);
  const step = steps[stepIdx];
  const layout = NODE_LAYOUTS[presetIdx] ?? NODE_LAYOUTS[0];
  const preset = PRESETS[presetIdx];

  const sccColorMap = useMemo(() => {
    const map = {};
    step.sccs.forEach((scc, i) => {
      const color = SCC_COLORS[i % SCC_COLORS.length];
      scc.forEach((node) => { map[node] = color; });
    });
    return map;
  }, [step.sccs]);

  const nodeColor = useCallback(
    (nodeId) => {
      if (sccColorMap[nodeId]) return sccColorMap[nodeId];
      if (step.currentSCC?.includes(nodeId)) return "#f59e0b";
      const ns = step.nodes[nodeId];
      if (ns.state === "active") return "#3b82f6";
      if (ns.state === "finished") return "#94a3b8";
      return "#cbd5e1";
    },
    [sccColorMap, step]
  );

  const intervalMs = [2000, 1200, 600][speed];

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setStepIdx((v) => (v >= steps.length - 1 ? (setPlaying(false), v) : v + 1));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, steps.length, intervalMs]);

  const reset = () => { setStepIdx(0); setPlaying(false); };
  const switchPreset = (idx) => { setPresetIdx(idx); setStepIdx(0); setPlaying(false); };

  const isReversePhase = step.phase === 3;
  const displayEdges = useMemo(() => {
    if (isReversePhase) {
      return preset.edges.map(([u, v]) => [v, u]);
    }
    return preset.edges;
  }, [isReversePhase, preset.edges]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kosaraju 强连通分量</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              通过对原图和反图各做一次 DFS，求出有向图中所有强连通分量。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={presetIdx}
              onChange={(e) => switchPreset(Number(e.target.value))}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
              aria-label="选择预设图"
            >
              {PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.name}</option>
              ))}
            </select>
            <Button onClick={() => setPlaying((v) => !v)} className="rounded-2xl shadow-sm" aria-label={playing ? "暂停" : "播放"}>
              <Icon type={playing ? "pause" : "play"} />{playing ? "暂停" : "播放"}
            </Button>
            <Button variant="outline" onClick={() => setStepIdx((v) => Math.min(steps.length - 1, v + 1))} className="rounded-2xl" aria-label="单步前进">
              <Icon type="step" />下一步
            </Button>
            <Button variant="outline" onClick={reset} className="rounded-2xl" aria-label="重置">
              <Icon type="reset" />重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {PHASE_LABELS[step.phase] ?? `阶段 ${step.phase}`}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {stepIdx + 1} / {steps.length}
                </span>
              </div>

              <svg viewBox="0 0 640 320" className="h-[380px] w-full rounded-2xl bg-white" role="img" aria-label="Kosaraju SCC 图动画">
                {displayEdges.map(([u, v]) => {
                  const [x1, y1] = layout[u] ?? [0, 0];
                  const [x2, y2] = layout[v] ?? [0, 0];
                  const origKey = isReversePhase ? `${v}->${u}` : `${u}->${v}`;
                  const edgeSt = step.edges[origKey];
                  const isTraversing = edgeSt === "traversing";
                  const isVisited = edgeSt === "visited";
                  const highlight = step.currentEdge && step.currentEdge[0] === u && step.currentEdge[1] === v;

                  return (
                    <Arrow
                      key={`${u}-${v}-${isReversePhase ? "rev" : "orig"}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      color={highlight ? "#6366f1" : isTraversing ? "#3b82f6" : isVisited ? "#a78bfa" : "#cbd5e1"}
                      opacity={highlight ? 1 : isTraversing ? 0.9 : isVisited ? 0.7 : 0.4}
                      strokeWidth={highlight ? 3.5 : isTraversing ? 3 : 2}
                    />
                  );
                })}

                {preset.nodes.map((id) => {
                  const [cx, cy] = layout[id] ?? [0, 0];
                  const fill = nodeColor(id);
                  const ns = step.nodes[id];
                  const isActive = ns.state === "active";

                  return (
                    <g key={id}>
                      <motion.circle
                        cx={cx} cy={cy} r={NODE_RADIUS}
                        fill={fill} stroke={isActive ? "#1e40af" : "#475569"}
                        strokeWidth={isActive ? 4 : 2}
                        animate={{ r: isActive ? NODE_RADIUS + 3 : NODE_RADIUS }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      />
                      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" className="fill-white text-base font-bold pointer-events-none">
                        {id}
                      </text>
                      {ns.discoveryTime != null && (
                        <text x={cx} y={cy - NODE_RADIUS - 10} textAnchor="middle" className="fill-blue-600 text-[10px] font-medium pointer-events-none">
                          d:{ns.discoveryTime}
                        </text>
                      )}
                      {ns.finishTime != null && (
                        <text x={cx} y={cy + NODE_RADIUS + 14} textAnchor="middle" className="fill-purple-600 text-[10px] font-medium pointer-events-none">
                          f:{ns.finishTime}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">当前步骤</div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="min-h-[3rem] text-sm leading-6 text-slate-700"
                  >
                    {step.description}
                  </motion.p>
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">
                  完成栈 {step.stack.length > 0 ? `(${step.stack.length})` : ""}
                </div>
                {step.stack.length === 0 ? (
                  <p className="text-xs text-slate-400">暂无</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {step.stack.map((node, i) => (
                      <span
                        key={`${node}-${i}`}
                        className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-slate-800 px-1.5 text-xs font-bold text-white"
                      >
                        {node}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">
                  强连通分量 {step.sccs.length > 0 ? `(${step.sccs.length})` : ""}
                </div>
                {step.sccs.length === 0 ? (
                  <p className="text-xs text-slate-400">暂无</p>
                ) : (
                  <div className="space-y-2">
                    {step.sccs.map((scc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: SCC_COLORS[i % SCC_COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {"{" + scc.join(", ") + "}"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {step.currentSCC && step.currentSCC.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-xs text-slate-500">
                      当前: {"{" + step.currentSCC.join(", ") + "}"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">播放速度</span>
                  <span className="text-xs text-slate-400">{SPEED_LABELS[speed]}</span>
                </div>
                <input
                  type="range" min={0} max={2} step={1} value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                  aria-label="播放速度"
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">算法说明</div>
                <p>Kosaraju 算法分三步：(1) 对原图 DFS 按完成时间压栈；(2) 构造反图；(3) 按栈序在反图上 DFS，每次 DFS 访问的节点构成一个 SCC。</p>
                <p className="mt-1 text-xs text-slate-400">时间 O(V+E) | 空间 O(V)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
