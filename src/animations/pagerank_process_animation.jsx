import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const damping = 0.85;
const nodes = [
  { id: "A", x: 140, y: 80 },
  { id: "B", x: 380, y: 80 },
  { id: "C", x: 460, y: 260 },
  { id: "D", x: 280, y: 340 },
  { id: "E", x: 100, y: 260 },
];

const edges = [
  ["A", "B"],
  ["A", "C"],
  ["B", "C"],
  ["C", "A"],
  ["C", "D"],
  ["D", "C"],
  ["E", "A"],
  ["E", "D"],
];

const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
const outLinks = Object.fromEntries(
  nodes.map((node) => [
    node.id,
    edges.filter(([source]) => source === node.id).map(([, target]) => target),
  ])
);
const inLinks = Object.fromEntries(
  nodes.map((node) => [
    node.id,
    edges.filter(([, target]) => target === node.id).map(([source]) => source),
  ])
);

function computeIterations(rounds = 12) {
  const n = nodes.length;
  let rank = Object.fromEntries(nodes.map((node) => [node.id, 1 / n]));
  const history = [{ round: 0, rank }];

  for (let i = 1; i <= rounds; i += 1) {
    const next = {};

    for (const node of nodes) {
      const incomingSum = inLinks[node.id].reduce((sum, source) => {
        const outgoingCount = outLinks[source].length || n;
        return sum + rank[source] / outgoingCount;
      }, 0);

      next[node.id] = (1 - damping) / n + damping * incomingSum;
    }

    rank = next;
    history.push({ round: i, rank });
  }

  return history;
}

function runPageRankTests() {
  const history = computeIterations(12);
  const finalRank = history[history.length - 1].rank;
  const total = Object.values(finalRank).reduce((sum, value) => sum + value, 0);
  const sorted = nodes
    .map((node) => ({ id: node.id, rank: finalRank[node.id] }))
    .sort((a, b) => b.rank - a.rank);

  console.assert(history.length === 13, "应包含初始状态和 12 轮迭代");
  console.assert(Math.abs(total - 1) < 1e-10, "PageRank 总和应保持为 1");
  console.assert(sorted[0].id === "C", "在该图结构中，节点 C 应获得最高 PageRank");
  console.assert(Object.values(finalRank).every((value) => value > 0), "所有节点 PageRank 都应为正数");
}

function Icon({ type }) {
  const common = "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const labelByType = {
    play: "▶",
    pause: "Ⅱ",
    step: "⏭",
    reset: "↺",
  };

  return <span className={common} aria-hidden="true">{labelByType[type]}</span>;
}

function Arrow({ from, to, active, sourceRadius = 30, targetRadius = 30 }) {
  const start = nodeMap[from];
  const end = nodeMap[to];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const sx = start.x + ux * (sourceRadius + 4);
  const sy = start.y + uy * (sourceRadius + 4);
  const ex = end.x - ux * (targetRadius + 14);
  const ey = end.y - uy * (targetRadius + 14);
  const angle = (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI;

  return (
    <g>
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
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
      {active && (
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
}

export default function PageRankProcessAnimation() {
  const history = useMemo(() => {
    runPageRankTests();
    return computeIterations(12);
  }, []);

  const [round, setRound] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = history[round];
  const previous = history[Math.max(0, round - 1)];
  const maxRank = Math.max(...Object.values(current.rank));

  useEffect(() => {
    if (!playing) return undefined;

    const timer = window.setInterval(() => {
      setRound((value) => (value >= history.length - 1 ? 0 : value + 1));
    }, 1400);

    return () => window.clearInterval(timer);
  }, [playing, history.length]);


  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PageRank 过程动画</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              这个例子有 5 个网页节点。每一轮中，节点会把自己的 PageRank 按出链数量平均分给指向的节点，再加上随机跳转项。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPlaying((value) => !value)} className="rounded-2xl shadow-sm" aria-label={playing ? "暂停动画" : "播放动画"}>
              <Icon type={playing ? "pause" : "play"} />
              {playing ? "暂停" : "播放"}
            </Button>
            <Button variant="outline" onClick={() => setRound((value) => Math.min(history.length - 1, value + 1))} className="rounded-2xl" aria-label="进入下一轮迭代">
              <Icon type="step" />下一轮
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRound(0);
                setPlaying(false);
              }}
              className="rounded-2xl"
              aria-label="重置动画"
            >
              <Icon type="reset" />重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 !pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">有向链接图</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">第 {round} 轮 / {history.length - 1}</div>
              </div>

              <svg viewBox="0 0 560 380" className="h-[430px] w-full rounded-2xl bg-white" role="img" aria-label="PageRank 有向链接图动画">
                {edges.map(([from, to]) => {
                  const sourceRadius = 30 + 34 * (current.rank[from] / maxRank);
                  const targetRadius = 30 + 34 * (current.rank[to] / maxRank);
                  return (
                    <Arrow
                      key={`${from}-${to}`}
                      from={from}
                      to={to}
                      active={playing || round > 0}
                      sourceRadius={sourceRadius}
                      targetRadius={targetRadius}
                    />
                  );
                })}

                {nodes.map((node) => {
                  const rank = current.rank[node.id];
                  const prev = previous.rank[node.id];
                  const delta = rank - prev;
                  const radius = 30 + 34 * (rank / maxRank);

                  return (
                    <g key={node.id}>
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill="white"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-indigo-500"
                        animate={{ r: radius }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      />
                      <text x={node.x} y={node.y - 5} textAnchor="middle" className="fill-slate-900 text-xl font-bold">{node.id}</text>
                      <text x={node.x} y={node.y + 17} textAnchor="middle" className="fill-slate-600 text-sm">{rank.toFixed(3)}</text>
                      {round > 0 && (
                        <text
                          x={node.x}
                          y={node.y + radius + 18}
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
              <CardContent className="p-5 !pt-5">
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
                  d = 0.85，N = 5。节点 C 被 A、B、D 指向，所以它会在多轮迭代后获得较高分数。
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 !pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-semibold">当前排名</div>
                  <div className="text-sm text-slate-500">
                    分数总和 ≈ {Object.values(current.rank).reduce((sum, value) => sum + value, 0).toFixed(3)}
                  </div>
                </div>

                <div className="space-y-3">
                  {nodes
                    .map((node) => ({ id: node.id, rank: current.rank[node.id] }))
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
              <CardContent className="p-5 !pt-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <p>圆越大，PageRank 越高。箭头表示链接方向。动画中的小点表示当前轮次中 PageRank 沿链接传递。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
