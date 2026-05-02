import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps, DEFAULT_GRAPH, DEFAULT_START } from "./algorithm";

const nodes = [
  { id: "A", x: 120, y: 80 },
  { id: "B", x: 280, y: 80 },
  { id: "E", x: 440, y: 80 },
  { id: "C", x: 120, y: 230 },
  { id: "D", x: 280, y: 230 },
  { id: "F", x: 440, y: 230 },
  { id: "G", x: 280, y: 370 },
];

const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

const undirectedEdges = [];
for (const node of Object.keys(DEFAULT_GRAPH)) {
  for (const neighbor of Object.keys(DEFAULT_GRAPH[node])) {
    if (node < neighbor) {
      undirectedEdges.push([node, neighbor]);
    }
  }
}

function isTreeEdge(u, v, treeEdges) {
  return treeEdges.some(
    ([a, b]) => (a === u && b === v) || (a === v && b === u)
  );
}

function isBackEdge(u, v, backEdges) {
  return backEdges.some(
    ([a, b]) => (a === u && b === v) || (a === v && b === u)
  );
}

function isEdgeHighlight(u, v, lastEdge) {
  if (!lastEdge) return false;
  return (lastEdge[0] === u && lastEdge[1] === v) ||
    (lastEdge[0] === v && lastEdge[1] === u);
}

function getEdgeClass(u, v, step) {
  if (isEdgeHighlight(u, v, step.lastEdge)) return "stroke-amber-500 stroke-[3]";
  if (isTreeEdge(u, v, step.treeEdges)) return "stroke-emerald-500 stroke-[2.5]";
  if (isBackEdge(u, v, step.backEdges)) return "stroke-rose-400 stroke-[2] stroke-dasharray-[6 4]";
  return "stroke-slate-300 stroke-[1.5]";
}

function getNodeClass(nodeId, step) {
  if (step.currentNode === nodeId) return "fill-amber-400 stroke-amber-600";
  if (step.visited.has(nodeId)) return "fill-indigo-100 stroke-indigo-500";
  return "fill-white stroke-slate-300";
}

function getNodeTextClass(nodeId, step) {
  if (step.currentNode === nodeId) return "fill-amber-900";
  if (step.visited.has(nodeId)) return "fill-indigo-700";
  return "fill-slate-700";
}

function getPhaseLabel(phase) {
  switch (phase) {
    case "init": return "初始化";
    case "explore": return "探索";
    case "backtrack": return "回溯";
    case "done": return "完成";
    default: return phase;
  }
}

export default function DfsAnimation() {
  const steps = useMemo(() => {
    return computeSteps(DEFAULT_GRAPH, DEFAULT_START);
  }, []);

  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = steps[currentStep];

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
    }, 1600);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DFS 深度优先搜索</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              从节点 A 出发，沿一条路径尽可能深地探索，直到无法继续时回溯，再探索下一条未访问的路径。使用显式栈实现迭代版本。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPlaying((value) => !value)}
              disabled={currentStep >= steps.length - 1 && !playing}
              className="rounded-2xl shadow-sm"
            >
              {playing ? "⏸ 暂停" : "▶ 播放"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentStep((value) => Math.min(steps.length - 1, value + 1))}
              disabled={currentStep >= steps.length - 1}
              className="rounded-2xl"
            >
              ⏭ 前进
            </Button>
            <Button
              variant="outline"
              onClick={() => { setCurrentStep(0); setPlaying(false); }}
              className="rounded-2xl"
            >
              ↺ 重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">图结构</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {currentStep} / {steps.length - 1}
                </div>
              </div>

              <svg viewBox="0 0 560 430" className="h-[430px] w-full rounded-2xl bg-white">
                {undirectedEdges.map(([u, v]) => {
                  const s = nodeMap[u];
                  const e = nodeMap[v];
                  return (
                    <line
                      key={`${u}-${v}`}
                      x1={s.x} y1={s.y} x2={e.x} y2={e.y}
                      className={getEdgeClass(u, v, step)}
                      strokeLinecap="round"
                    />
                  );
                })}

                {step.lastEdge && (() => {
                  const s = nodeMap[step.lastEdge[0]];
                  const e = nodeMap[step.lastEdge[1]];
                  const mx = (s.x + e.x) / 2;
                  const my = (s.y + e.y) / 2;
                  return (
                    <motion.circle
                      key={`dot-${currentStep}`}
                      cx={mx} cy={my} r={5}
                      className="fill-amber-500"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  );
                })()}

                {nodes.map((node) => (
                  <g key={node.id}>
                    <motion.circle
                      cx={node.x} cy={node.y} r={26}
                      className={getNodeClass(node.id, step)}
                      strokeWidth={step.currentNode === node.id ? 4 : 2}
                      animate={{ r: step.currentNode === node.id ? 30 : 26 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                    <text
                      x={node.x} y={node.y + 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`text-lg font-bold ${getNodeTextClass(node.id, step)}`}
                    >
                      {node.id}
                    </text>
                  </g>
                ))}

                {step.phase === "done" && (
                  <text x="280" y="420" textAnchor="middle" className="fill-emerald-600 text-sm font-semibold">
                    遍历完成：{step.traversalOrder.join(" → ")}
                  </text>
                )}
              </svg>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">当前步骤</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {getPhaseLabel(step.phase)}
                  </span>
                  <span className="text-sm text-slate-400">#{step.step}</span>
                </div>
                <p className="text-sm leading-6 text-slate-700">{step.description}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-500">栈</div>
                  <div className="text-xs text-slate-400">栈顶 →</div>
                </div>
                {step.stack.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">空</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {step.stack.map((node, idx) => (
                      <motion.span
                        key={`${node}-${idx}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`inline-block rounded-md px-2.5 py-1 text-sm font-medium ${
                          idx === step.stack.length - 1
                            ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {node}
                      </motion.span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">遍历结果</div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs text-slate-400">访问顺序</div>
                    <div className="text-sm">
                      {step.traversalOrder.length === 0 ? (
                        <span className="text-slate-400 italic">尚未访问</span>
                      ) : (
                        <span className="font-medium text-slate-700">
                          {step.traversalOrder.join(" → ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className="mb-1 text-xs text-slate-400">已访问</div>
                      <div className="text-sm font-medium text-slate-700">
                        {step.visited.size} / {nodes.length}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-slate-400">树边</div>
                      <div className="text-sm font-medium text-emerald-600">
                        {step.treeEdges.length}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-slate-400">回边</div>
                      <div className="text-sm font-medium text-rose-500">
                        {step.backEdges.length}
                      </div>
                    </div>
                  </div>
                  {step.treeEdges.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs text-slate-400">生成树边</div>
                      <div className="flex flex-wrap gap-1">
                        {step.treeEdges.map(([u, v], idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700"
                          >
                            {u}-{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {step.backEdges.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs text-slate-400">回边</div>
                      <div className="flex flex-wrap gap-1">
                        {step.backEdges.map(([u, v], idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700"
                          >
                            {u}-{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <p>黄色节点为当前探索节点，紫色为已访问节点，绿色边为生成树边，红色虚线边为回边。栈中高亮项为栈顶元素。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
