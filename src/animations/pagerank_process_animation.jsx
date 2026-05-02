import React, { useEffect, useMemo, useReducer, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computePageRank } from "./pagerank/algorithm";

const DEFAULT_NODES = [
  { id: "A" },
  { id: "B" },
  { id: "C" },
  { id: "D" },
  { id: "E" },
];

const DEFAULT_EDGES = [
  { from: "A", to: "B" },
  { from: "A", to: "C" },
  { from: "B", to: "C" },
  { from: "C", to: "A" },
  { from: "C", to: "D" },
  { from: "D", to: "C" },
  { from: "E", to: "A" },
  { from: "E", to: "D" },
];

const DEFAULT_DAMPING = 0.85;
const DEFAULT_ROUNDS = 12;

const defaultGraph = {
  nodes: DEFAULT_NODES.map((n) => ({ ...n })),
  edges: DEFAULT_EDGES.map((e) => ({ ...e })),
  damping: DEFAULT_DAMPING,
  rounds: DEFAULT_ROUNDS,
};

function graphReducer(state, action) {
  switch (action.type) {
    case "changeGraph":
      return { ...action.payload, round: 0, playing: false };
    case "setRound":
      return { ...state, round: typeof action.payload === "function" ? action.payload(state.round) : action.payload };
    case "setPlaying":
      return { ...state, playing: action.payload };
    default:
      return state;
  }
}

function circularPositions(ids, cx = 280, cy = 190, r = 130) {
  const map = {};
  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
    map[id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return map;
}

function Icon({ type }) {
  const common = "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const labelByType = { play: "▶", pause: "Ⅱ", step: "⏭", reset: "↺" };
  return <span className={common} aria-hidden="true">{labelByType[type]}</span>;
}

function GraphEditor({ nodes, edges, damping, rounds, onChange }) {
  const [newNodeId, setNewNodeId] = useState("");
  const [edgeFrom, setEdgeFrom] = useState("");
  const [edgeTo, setEdgeTo] = useState("");
  const [edgeError, setEdgeError] = useState("");
  const [open, setOpen] = useState(false);
  const [localDamping, setLocalDamping] = useState(damping);
  const [localRounds, setLocalRounds] = useState(rounds);

  // Sync local state when props change (e.g. "恢复默认")
  useEffect(() => {
    setLocalDamping(damping);
  }, [damping]);

  useEffect(() => {
    setLocalRounds(rounds);
  }, [rounds]);

  const nodeIds = nodes.map((n) => n.id);
  const existingPairs = new Set(edges.map((e) => `${e.from}->${e.to}`));

  function addNode() {
    const id = newNodeId.trim().toUpperCase();
    if (!id || nodes.length >= 10 || nodes.some((n) => n.id === id)) return;
    onChange({ nodes: [...nodes, { id }], edges, damping, rounds });
    setNewNodeId("");
  }

  function removeNode(id) {
    onChange({
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter((e) => e.from !== id && e.to !== id),
      damping,
      rounds,
    });
  }

  function addEdge() {
    if (!edgeFrom || !edgeTo) return;
    if (edgeFrom === edgeTo) { setEdgeError("不允许自环"); return; }
    if (existingPairs.has(`${edgeFrom}->${edgeTo}`)) { setEdgeError("该边已存在"); return; }
    onChange({ nodes, edges: [...edges, { from: edgeFrom, to: edgeTo }], damping, rounds });
    setEdgeFrom("");
    setEdgeTo("");
    setEdgeError("");
  }

  function removeEdge(from, to) {
    onChange({
      nodes,
      edges: edges.filter((e) => !(e.from === from && e.to === to)),
      damping,
      rounds,
    });
  }

  function applyParams() {
    const d = parseFloat(localDamping);
    const r = parseInt(localRounds, 10);
    onChange({
      nodes,
      edges,
      damping: Number.isFinite(d) ? Math.min(0.99, Math.max(0.01, d)) : damping,
      rounds: Number.isFinite(r) ? Math.min(30, Math.max(5, r)) : rounds,
    });
  }

  function resetAll() {
    onChange({
      nodes: DEFAULT_NODES.map((n) => ({ ...n })),
      edges: DEFAULT_EDGES.map((e) => ({ ...e })),
      damping: DEFAULT_DAMPING,
      rounds: DEFAULT_ROUNDS,
    });
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between p-5 select-none"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
      >
        <div className="font-semibold">编辑图结构</div>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="space-y-4 border-t border-slate-100 p-5">
          {/* Nodes */}
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-500">
              节点 ({nodes.length}/10)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nodeIds.map((id) => (
                <span key={id} className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-sm">
                  {id}
                  <button
                    className="ml-0.5 text-slate-400 hover:text-red-500"
                    onClick={() => removeNode(id)}
                    aria-label={`删除节点 ${id}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {nodes.length < 10 && (
                <input
                  className="w-14 rounded-full border px-2 py-1 text-center text-sm"
                  placeholder="ID"
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value.slice(0, 2))}
                  onKeyDown={(e) => { if (e.key === "Enter") addNode(); }}
                  maxLength={2}
                  aria-label="新节点 ID"
                />
              )}
            </div>
            {nodes.length >= 10 && <p className="mt-1 text-xs text-amber-600">已达到节点数上限</p>}
            {nodes.length < 10 && (
              <Button variant="outline" size="sm" className="mt-2" onClick={addNode} disabled={!newNodeId.trim()}>
                添加节点
              </Button>
            )}
          </div>

          {/* Edges */}
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-500">
              有向边 ({edges.length})
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded border px-2 py-1 text-sm"
                value={edgeFrom}
                onChange={(e) => { setEdgeFrom(e.target.value); setEdgeError(""); }}
                aria-label="源节点"
              >
                <option value="">源</option>
                {nodeIds.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
              <span className="text-slate-400">→</span>
              <select
                className="rounded border px-2 py-1 text-sm"
                value={edgeTo}
                onChange={(e) => { setEdgeTo(e.target.value); setEdgeError(""); }}
                aria-label="目标节点"
              >
                <option value="">目标</option>
                {nodeIds.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={addEdge} disabled={!edgeFrom || !edgeTo}>
                添加
              </Button>
            </div>
            {edgeError && <p className="mt-1 text-xs text-red-500">{edgeError}</p>}
            {edges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {edges.map((e) => (
                  <span key={`${e.from}-${e.to}`} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-sm">
                    {e.from}→{e.to}
                    <button
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => removeEdge(e.from, e.to)}
                      aria-label={`删除边 ${e.from}→${e.to}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              阻尼系数
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={localDamping}
                onChange={(e) => setLocalDamping(e.target.value)}
                className="w-28"
                aria-label="阻尼系数"
              />
              <span className="w-10 text-right text-xs">{localDamping}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              迭代轮数
              <input
                type="number"
                min="5"
                max="30"
                value={localRounds}
                onChange={(e) => setLocalRounds(e.target.value)}
                className="w-16 rounded border px-2 py-1 text-sm"
                aria-label="迭代轮数"
              />
            </label>
            <Button size="sm" onClick={applyParams}>应用</Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetAll}>
              恢复默认
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function PageRankProcessAnimation() {
  const [state, dispatch] = useReducer(graphReducer, {
    ...defaultGraph,
    round: 0,
    playing: false,
  });

  const { nodes: nodesS, edges: edgesS, damping: dampingS, rounds: roundsS, round, playing } = state;

  const nodeMap = useMemo(() => circularPositions(nodesS.map((n) => n.id)), [nodesS]);
  const { history, outLinks } = useMemo(() => {
    return computePageRank(nodesS, edgesS, { damping: dampingS, rounds: roundsS });
  }, [nodesS, edgesS, dampingS, roundsS]);

  const current = history[Math.min(round, history.length - 1)] ?? history[0];
  const previous = history[Math.max(0, Math.min(round, history.length - 1) - 1)] ?? history[0];
  const maxRank = Math.max(...Object.values(current.rank), 1e-10);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      dispatch({ type: "setRound", payload: (prev) => (prev >= history.length - 1 ? 0 : prev + 1) });
    }, 1400);
    return () => window.clearInterval(timer);
  }, [playing, history.length]);

  function applyGraph(payload) {
    dispatch({ type: "changeGraph", payload });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PageRank 过程动画</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              自定义图结构和参数，观察 PageRank 在有向图上的迭代传播过程。当前 {nodesS.length} 个节点、{edgesS.length} 条边。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => dispatch({ type: "setPlaying", payload: !playing })} className="rounded-2xl shadow-sm" aria-label={playing ? "暂停动画" : "播放动画"}>
              <Icon type={playing ? "pause" : "play"} />
              {playing ? "暂停" : "播放"}
            </Button>
            <Button variant="outline" onClick={() => dispatch({ type: "setRound", payload: Math.min(history.length - 1, round + 1) })} className="rounded-2xl" aria-label="进入下一轮迭代">
              <Icon type="step" />下一轮
            </Button>
            <Button
              variant="outline"
              onClick={() => { dispatch({ type: "setRound", payload: 0 }); dispatch({ type: "setPlaying", payload: false }); }}
              className="rounded-2xl"
              aria-label="重置动画"
            >
              <Icon type="reset" />重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">有向链接图</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  第 {round} 轮 / {history.length - 1}
                </div>
              </div>
              <svg viewBox="0 0 560 380" className="h-[430px] w-full rounded-2xl bg-white" role="img" aria-label="PageRank 有向链接图动画">
                {edgesS.map(({ from, to }) => {
                  const sp = nodeMap[from];
                  const tp = nodeMap[to];
                  if (!sp || !tp) return null;
                  const sr = 30 + 34 * ((current.rank[from] ?? 0) / maxRank);
                  const tr = 30 + 34 * ((current.rank[to] ?? 0) / maxRank);
                  const dx = tp.x - sp.x;
                  const dy = tp.y - sp.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const ux = dx / len;
                  const uy = dy / len;
                  const sx = sp.x + ux * (sr + 4);
                  const sy = sp.y + uy * (sr + 4);
                  const ex = tp.x - ux * (tr + 14);
                  const ey = tp.y - uy * (tr + 14);
                  const angle = (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI;
                  const active = playing || round > 0;
                  return (
                    <g key={`${from}-${to}`}>
                      <line
                        x1={sx} y1={sy} x2={ex} y2={ey}
                        stroke={active ? "currentColor" : "#a8a8a8"}
                        strokeWidth={active ? 3 : 2}
                        className={active ? "text-indigo-600" : ""}
                        opacity={active ? 0.95 : 0.55}
                      />
                      <polygon
                        points="0,-5 10,0 0,5"
                        transform={`translate(${ex},${ey}) rotate(${angle})`}
                        fill={active ? "currentColor" : "#a8a8a8"}
                        className={active ? "text-indigo-600" : ""}
                        opacity={active ? 0.95 : 0.55}
                      />
                      {active && outLinks[from]?.includes(to) && (
                        <motion.circle
                          r="6"
                          fill="currentColor"
                          className="text-indigo-600"
                          initial={{ cx: sx, cy: sy, opacity: 0 }}
                          animate={{ cx: ex, cy: ey, opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </g>
                  );
                })}
                {nodesS.map((node) => {
                  const pos = nodeMap[node.id];
                  if (!pos) return null;
                  const rank = current.rank[node.id] ?? 0;
                  const prev = previous.rank[node.id] ?? rank;
                  const delta = rank - prev;
                  const radius = 30 + 34 * (rank / maxRank);
                  return (
                    <g key={node.id}>
                      <motion.circle
                        cx={pos.x} cy={pos.y}
                        r={radius}
                        fill="white"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-indigo-500"
                        animate={{ r: radius }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      />
                      <text x={pos.x} y={pos.y - 5} textAnchor="middle" className="fill-slate-900 text-xl font-bold">{node.id}</text>
                      <text x={pos.x} y={pos.y + 17} textAnchor="middle" className="fill-slate-600 text-sm">{rank.toFixed(3)}</text>
                      {round > 0 && (
                        <text
                          x={pos.x} y={pos.y + radius + 18}
                          textAnchor="middle"
                          className={delta >= 0 ? "fill-emerald-600 text-xs" : "fill-rose-600 text-xs"}
                        >
                          {delta >= 0 ? "+" : ""}{delta.toFixed(3)}
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
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">迭代公式</div>
                <div className="rounded-2xl bg-slate-100 p-4 text-center text-lg">
                  <span className="font-semibold">PR</span>(v) =
                  <span className="mx-2 inline-flex flex-col items-center align-middle text-base leading-none">
                    <span>1 − d</span>
                    <span className="mt-1 w-full border-t border-slate-500 pt-1">N</span>
                  </span>
                  + d ·
                  <span className="mx-1 inline-flex flex-col items-center align-middle leading-none">
                    <span className="text-2xl">Σ</span>
                    <span className="text-xs">u → v</span>
                  </span>
                  <span className="mx-2 inline-flex flex-col items-center align-middle text-base leading-none">
                    <span><span className="font-semibold">PR</span>(u)</span>
                    <span className="mt-1 w-full border-t border-slate-500 pt-1">L(u)</span>
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  d = {dampingS}，N = {nodesS.length}。在下方编辑面板中自定义图结构和参数。
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-semibold">当前排名</div>
                  <div className="text-sm text-slate-500">
                    分数总和 ≈ {Object.values(current.rank).reduce((s, v) => s + v, 0).toFixed(3)}
                  </div>
                </div>
                <div className="space-y-3">
                  {nodesS
                    .map((n) => ({ id: n.id, rank: current.rank[n.id] ?? 0 }))
                    .sort((a, b) => b.rank - a.rank)
                    .map((item, index) => (
                      <div key={item.id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">#{index + 1} 节点 {item.id}</span>
                          <span>{item.rank.toFixed(4)}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            className="h-full rounded-full bg-slate-800"
                            animate={{ width: `${Math.max(3, (item.rank / maxRank) * 100)}%` }}
                            transition={{ duration: 0.45 }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <p>圆越大，PageRank 越高。箭头表示链接方向。动画中的小点表示当前轮次中 PageRank 沿链接传递。</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <GraphEditor
          nodes={nodesS}
          edges={edgesS}
          damping={dampingS}
          rounds={roundsS}
          onChange={applyGraph}
        />
      </div>
    </div>
  );
}
