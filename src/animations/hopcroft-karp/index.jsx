import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_INPUT, computeSteps } from "./algorithm";

const SVG_W = 600;
const SVG_H = 420;
const NODE_R = 26;

function layoutNodes(leftNodes, rightNodes) {
  const positions = {};
  const leftX = 100;
  const rightX = SVG_W - 100;
  const padY = 60;
  const gapY = (SVG_H - 2 * padY) / Math.max(leftNodes.length - 1, 1);
  leftNodes.forEach((id, i) => {
    positions[id] = { x: leftX, y: padY + i * gapY, side: "left" };
  });
  const rightGapY = (SVG_H - 2 * padY) / Math.max(rightNodes.length - 1, 1);
  rightNodes.forEach((id, i) => {
    positions[id] = { x: rightX, y: padY + i * rightGapY, side: "right" };
  });
  return positions;
}

function nodeColor(id, step, positions) {
  if (!step) return "#94a3b8";
  const side = positions[id]?.side;
  const inLayer = step.bfsLayer[id] !== undefined;
  const isCurrent = step.currentNode === id;
  if (step.foundAugmenting && step.augmentingPath.includes(id)) return "#10b981";
  if (isCurrent) return "#6366f1";
  if (inLayer) return side === "left" ? "#3b82f6" : "#f59e0b";
  return "#94a3b8";
}

function isEdgeMatching(edge, matching) {
  return matching.some(([u, v]) => (u === edge[0] && v === edge[1]) || (u === edge[1] && v === edge[0]));
}

function isEdgeExploring(edge, step) {
  if (!step?.exploringEdge) return false;
  const [a, b] = step.exploringEdge;
  return (edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a);
}

function GraphEdge({ from, to, positions, step }) {
  const p1 = positions[from];
  const p2 = positions[to];
  if (!p1 || !p2) return null;
  const matching = step?.matching || [];
  const matched = isEdgeMatching([from, to], matching);
  const exploring = isEdgeExploring([from, to], step);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = (dx / len) * NODE_R;
  const uy = (dy / len) * NODE_R;
  const x1 = p1.x + ux;
  const y1 = p1.y + uy;
  const x2 = p2.x - ux;
  const y2 = p2.y - uy;
  const stroke = exploring ? "#6366f1" : matched ? "#10b981" : "#cbd5e1";
  const width = exploring ? 3.5 : matched ? 3 : 1.5;
  return (
    <g>
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={stroke} strokeWidth={width} strokeLinecap="round"
        animate={{ stroke, strokeWidth: width }}
        transition={{ duration: 0.3 }}
      />
      {exploring && (
        <motion.circle
          r="5" fill="#6366f1"
          initial={{ cx: x1, cy: y1, opacity: 0 }}
          animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </g>
  );
}

function GraphNode({ id, pos, step }) {
  const fill = nodeColor(id, step, { [id]: pos });
  const distVal = step?.dist?.[id];
  const distLabel = distVal === undefined ? "" : distVal === Infinity ? "∞" : String(distVal);
  return (
    <g>
      <motion.circle
        cx={pos.x} cy={pos.y} r={NODE_R}
        fill="white" stroke={fill} strokeWidth="3"
        animate={{ stroke: fill }}
        transition={{ duration: 0.3 }}
      />
      <text x={pos.x} y={pos.y - 4} textAnchor="middle" className="fill-slate-900 text-sm font-bold pointer-events-none">
        {id}
      </text>
      {distLabel && (
        <text x={pos.x} y={pos.y + 13} textAnchor="middle" className="fill-slate-500 text-xs pointer-events-none">
          d={distLabel}
        </text>
      )}
    </g>
  );
}

function Icon({ type }) {
  const cls = "mr-1.5 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const map = { play: "▶", pause: "⏸", step: "⏭", back: "⏮", reset: "↺" };
  return <span className={cls} aria-hidden="true">{map[type]}</span>;
}

export default function HopcroftKarpAnimation() {
  const steps = useMemo(() => {
    return computeSteps(DEFAULT_INPUT);
  }, []);

  const positions = useMemo(() => {
    return layoutNodes(DEFAULT_INPUT.leftNodes, DEFAULT_INPUT.rightNodes);
  }, []);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.2);

  const step = steps[idx];

  useEffect(() => {
    if (!playing) return undefined;
    const ms = speed * 1000;
    const timer = window.setInterval(() => {
      setIdx((v) => (v >= steps.length - 1 ? 0 : v + 1));
    }, ms);
    return () => window.clearInterval(timer);
  }, [playing, speed, steps.length]);

  const goNext = useCallback(() => setIdx((v) => Math.min(steps.length - 1, v + 1)), [steps.length]);
  const goPrev = useCallback(() => setIdx((v) => Math.max(0, v - 1)), []);
  const reset = useCallback(() => { setIdx(0); setPlaying(false); }, []);

  const allEdges = DEFAULT_INPUT.edges;
  const matching = step?.matching || [];
  const phaseLabel = step?.phase === "init" ? "初始化" : step?.phase === "bfs" ? "BFS 分层" : "DFS 增广";

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hopcroft-Karp 二分图匹配</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              通过 BFS 分层找到所有最短增广路，再用 DFS 批量增广，将时间复杂度从 O(VE) 降低到 O(E&radic;V)。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPlaying((v) => !v)} className="rounded-2xl shadow-sm" aria-label={playing ? "暂停" : "播放"}>
              <Icon type={playing ? "pause" : "play"} />{playing ? "暂停" : "播放"}
            </Button>
            <Button variant="outline" onClick={goPrev} className="rounded-2xl" aria-label="上一步">
              <Icon type="back" />上一步
            </Button>
            <Button variant="outline" onClick={goNext} className="rounded-2xl" aria-label="下一步">
              <Icon type="step" />下一步
            </Button>
            <Button variant="outline" onClick={reset} className="rounded-2xl" aria-label="重置">
              <Icon type="reset" />重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">二分图</div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-3 w-5 rounded bg-emerald-500" />匹配边
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-3 w-5 rounded bg-slate-300" />非匹配边
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                    步骤 {idx} / {steps.length - 1}
                  </span>
                </div>
              </div>
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full rounded-2xl bg-white" style={{ height: 420 }} role="img" aria-label="Hopcroft-Karp 二分图匹配动画">
                {allEdges.map(([u, v]) => (
                  <GraphEdge key={`${u}-${v}`} from={u} to={v} positions={positions} step={step} />
                ))}
                {Object.entries(positions).map(([id, pos]) => (
                  <GraphNode key={id} id={id} pos={pos} step={step} />
                ))}
              </svg>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-500">当前步骤</div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{phaseLabel}</span>
                </div>
                <p className="text-sm leading-6 text-slate-700">{step?.description || "—"}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-semibold">当前匹配</div>
                  <div className="text-sm text-slate-500">匹配数: {matching.length}</div>
                </div>
                {matching.length === 0 ? (
                  <p className="text-sm text-slate-400">暂无匹配</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {matching.map(([u, v]) => (
                      <span key={`${u}-${v}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        {u} &mdash; {v}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 font-semibold">距离数组 (dist)</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {[...DEFAULT_INPUT.leftNodes, ...DEFAULT_INPUT.rightNodes].map((id) => {
                    const d = step?.dist?.[id];
                    const label = d === undefined ? "—" : d === Infinity ? "∞" : String(d);
                    const side = DEFAULT_INPUT.leftNodes.includes(id) ? "U" : "V";
                    return (
                      <div key={id} className="flex justify-between">
                        <span className="text-slate-500">{id}</span>
                        <span className="font-mono font-medium">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 font-semibold">播放速度</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">快</span>
                  <input
                    type="range" min="0.3" max="3" step="0.1" value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                    aria-label="播放速度"
                  />
                  <span className="text-xs text-slate-500">慢</span>
                  <span className="w-12 text-right text-sm text-slate-600">{speed.toFixed(1)}s</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">算法说明</div>
                <p>
                  左集 U 节点在左侧，右集 V 节点在右侧。每轮迭代先用 BFS 从所有未匹配左集节点分层，
                  再用 DFS 沿分层图寻找增广路并翻转匹配。绿色边为当前匹配边。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
