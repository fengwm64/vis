import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXAMPLES, computeSteps, runAlgorithmTests } from "./algorithm";

const EXAMPLE_KEYS = Object.keys(EXAMPLES);

const PHASE_LABELS = {
  init: "初始化",
  equality_subgraph: "等价子图",
  hungarian_tree: "匈牙利树搜索",
  augment: "增广匹配",
  label_adjust: "顶标调整",
  error: "异常",
  done: "完成",
};

const PHASE_COLORS = {
  init: "bg-slate-100 text-slate-700",
  equality_subgraph: "bg-emerald-50 text-emerald-700",
  hungarian_tree: "bg-amber-50 text-amber-700",
  augment: "bg-blue-50 text-blue-700",
  label_adjust: "bg-purple-50 text-purple-700",
  error: "bg-red-50 text-red-700",
  done: "bg-green-50 text-green-700",
};

function Icon({ type }) {
  const common = "mr-1.5 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const map = { play: "▶", pause: "⏸", step: "⏭", back: "⏮", reset: "↺" };
  return <span className={common} aria-hidden="true">{map[type]}</span>;
}

function getNodePositions(n, svgH) {
  const xLeft = 130;
  const xRight = 470;
  const marginY = 50;
  const usable = svgH - marginY * 2;
  const spacing = n > 1 ? usable / (n - 1) : 0;
  const xNodes = [];
  const yNodes = [];
  for (let i = 0; i < n; i++) {
    const yPos = n > 1 ? marginY + i * spacing : svgH / 2;
    xNodes.push({ id: i, x: xLeft, y: yPos });
    yNodes.push({ id: i, x: xRight, y: yPos });
  }
  return { xNodes, yNodes };
}

function GraphEdge({ x1, y1, x2, y2, weight, highlighted, color, dashed, bold }) {
  const stroke = color || "#cbd5e1";
  const width = bold ? 3.5 : highlighted ? 2.5 : 1.2;
  const opacity = highlighted ? 0.9 : 0.35;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <motion.line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={stroke}
        strokeWidth={width}
        strokeDasharray={dashed ? "6 4" : "none"}
        opacity={opacity}
        initial={false}
        animate={{ x1, y1, x2, y2, strokeWidth: width, opacity }}
        transition={{ duration: 0.3 }}
      />
      <text
        x={midX}
        y={midY - 8}
        textAnchor="middle"
        className="select-none text-xs font-medium fill-slate-500"
      >
        {weight}
      </text>
    </g>
  );
}

function GraphNode({ x, y, label, subLabel, radius, fillColor, strokeColor, highlighted, dim }) {
  return (
    <g opacity={dim ? 0.35 : 1}>
      <motion.circle
        cx={x} cy={y} r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={highlighted ? 3 : 2}
        initial={false}
        animate={{ cx: x, cy: y, r: radius }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
      <text x={x} y={y - 3} textAnchor="middle" className="select-none text-base font-bold fill-slate-900">
        {label}
      </text>
      {subLabel && (
        <text x={x} y={y + 13} textAnchor="middle" className="select-none text-xs fill-slate-500">
          {subLabel}
        </text>
      )}
    </g>
  );
}

export default function HungarianAnimation() {
  const [exampleKey, setExampleKey] = useState(EXAMPLE_KEYS[0]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const weights = EXAMPLES[exampleKey].weights;
  const n = EXAMPLES[exampleKey].n;

  const steps = useMemo(() => {
    runAlgorithmTests();
    return computeSteps(weights);
  }, [weights]);

  const step = steps[stepIdx];
  const prevStep = steps[Math.max(0, stepIdx - 1)];

  const svgH = Math.max(320, n * 80 + 60);
  const nodeRadius = Math.max(22, Math.min(30, 200 / n));
  const { xNodes, yNodes } = useMemo(() => getNodePositions(n, svgH), [n, svgH]);

  // Build sets for quick lookup
  const equalitySet = useMemo(() => {
    const s = new Set();
    for (const [i, j] of step.equalityEdges) s.add(`${i}-${j}`);
    return s;
  }, [step.equalityEdges]);

  const matchSet = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < n; i++) {
      if (step.matchX[i] !== -1) s.add(`${i}-${step.matchX[i]}`);
    }
    return s;
  }, [step.matchX, n]);

  const augmentSet = useMemo(() => {
    const s = new Set();
    if (step.augmentPath) {
      for (const [i, j] of step.augmentPath) s.add(`${i}-${j}`);
    }
    return s;
  }, [step.augmentPath]);

  const sSet = useMemo(() => new Set(step.S || []), [step.S]);
  const tSet = useMemo(() => new Set(step.T || []), [step.T]);

  const isSearching = step.phase === "hungarian_tree" || step.phase === "augment";
  const isAugmentPhase = step.phase === "augment";
  const isLabelAdjust = step.phase === "label_adjust";

  // Node fill colors
  const xNodeFill = useCallback((i) => {
    if (step.matchX[i] !== -1) return "#3b82f6";
    if (isSearching && sSet.has(i)) return "#f97316";
    return "#e2e8f0";
  }, [step.matchX, isSearching, sSet]);

  const yNodeFill = useCallback((j) => {
    if (step.matchY[j] !== -1) return "#3b82f6";
    if (isSearching && tSet.has(j)) return "#f97316";
    return "#e2e8f0";
  }, [step.matchY, isSearching, tSet]);

  const xNodeStroke = useCallback((i) => {
    if (step.phase === "init" || step.phase === "equality_subgraph") return "#6366f1";
    if (step.matchX[i] !== -1) return "#2563eb";
    if (isSearching && sSet.has(i)) return "#ea580c";
    return "#94a3b8";
  }, [step.phase, step.matchX, isSearching, sSet]);

  const yNodeStroke = useCallback((j) => {
    if (step.phase === "init" || step.phase === "equality_subgraph") return "#6366f1";
    if (step.matchY[j] !== -1) return "#2563eb";
    if (isSearching && tSet.has(j)) return "#ea580c";
    return "#94a3b8";
  }, [step.phase, step.matchY, isSearching, tSet]);

  // Timer
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
    }, 1200);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  // Reset on example change
  const switchExample = useCallback((key) => {
    setExampleKey(key);
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const canBack = stepIdx > 0;
  const canForward = stepIdx < steps.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">匈牙利算法 / KM 算法</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              求解二分图最大权完美匹配。可视化展示等价子图构建、匈牙利树搜索、顶标调整和增广路径翻转的完整过程。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_KEYS.map((key) => (
              <Button
                key={key}
                variant={exampleKey === key ? "default" : "outline"}
                className="rounded-2xl shadow-sm"
                onClick={() => switchExample(key)}
              >
                {EXAMPLES[key].n}x{EXAMPLES[key].n}
              </Button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setPlaying((v) => !v)}
            className="rounded-2xl shadow-sm"
            aria-label={playing ? "暂停动画" : "播放动画"}
            disabled={!canForward && !playing}
          >
            <Icon type={playing ? "pause" : "play"} />
            {playing ? "暂停" : "播放"}
          </Button>
          <Button
            variant="outline"
            onClick={() => canBack && setStepIdx((v) => v - 1)}
            className="rounded-2xl"
            aria-label="后退一步"
            disabled={!canBack}
          >
            <Icon type="back" />后退
          </Button>
          <Button
            variant="outline"
            onClick={() => canForward && setStepIdx((v) => v + 1)}
            className="rounded-2xl"
            aria-label="前进一步"
            disabled={!canForward}
          >
            <Icon type="step" />前进
          </Button>
          <Button
            variant="outline"
            onClick={() => { setStepIdx(0); setPlaying(false); }}
            className="rounded-2xl"
            aria-label="重置动画"
          >
            <Icon type="reset" />重置
          </Button>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              步骤 {stepIdx + 1} / {steps.length}
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Graph visualization */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">二分图</div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${PHASE_COLORS[step.phase] || ""}`}>
                  {PHASE_LABELS[step.phase] || step.phase}
                </span>
              </div>

              <svg
                viewBox={`0 0 600 ${svgH}`}
                className="w-full rounded-2xl bg-white"
                style={{ height: `${svgH}px`, maxHeight: "480px" }}
                role="img"
                aria-label="匈牙利算法二分图可视化"
              >
                {/* Column labels */}
                <text x={130} y={24} textAnchor="middle" className="text-sm font-semibold fill-slate-400">X</text>
                <text x={470} y={24} textAnchor="middle" className="text-sm font-semibold fill-slate-400">Y</text>

                {/* Edges */}
                {xNodes.map((xn) =>
                  yNodes.map((yn) => {
                    const key = `${xn.id}-${yn.id}`;
                    const inEq = equalitySet.has(key);
                    const inMatch = matchSet.has(key);
                    const inAugment = augmentSet.has(key);
                    const weight = weights[xn.id][yn.id];

                    let color = "#cbd5e1";
                    let highlighted = false;
                    let dashed = false;
                    let bold = false;

                    if (inAugment && isAugmentPhase) {
                      color = "#f97316";
                      highlighted = true;
                      bold = true;
                    } else if (inMatch) {
                      color = "#ef4444";
                      highlighted = true;
                      bold = true;
                    } else if (inEq && (step.phase === "equality_subgraph" || step.phase === "init")) {
                      color = "#10b981";
                      highlighted = true;
                    } else if (inEq) {
                      color = "#10b981";
                      highlighted = false;
                    }

                    return (
                      <GraphEdge
                        key={key}
                        x1={xn.x + nodeRadius}
                        y1={xn.y}
                        x2={yn.x - nodeRadius}
                        y2={yn.y}
                        weight={weight}
                        highlighted={highlighted}
                        color={color}
                        dashed={dashed}
                        bold={bold}
                      />
                    );
                  })
                )}

                {/* X nodes */}
                {xNodes.map((node) => (
                  <GraphNode
                    key={`x${node.id}`}
                    x={node.x}
                    y={node.y}
                    label={`X${node.id}`}
                    subLabel={`l=${step.lx[node.id]}`}
                    radius={nodeRadius}
                    fillColor={xNodeFill(node.id)}
                    strokeColor={xNodeStroke(node.id)}
                    highlighted={isSearching && sSet.has(node.id)}
                    dim={false}
                  />
                ))}

                {/* Y nodes */}
                {yNodes.map((node) => (
                  <GraphNode
                    key={`y${node.id}`}
                    x={node.x}
                    y={node.y}
                    label={`Y${node.id}`}
                    subLabel={`l=${step.ly[node.id]}`}
                    radius={nodeRadius}
                    fillColor={yNodeFill(node.id)}
                    strokeColor={yNodeStroke(node.id)}
                    highlighted={isSearching && tSet.has(node.id)}
                    dim={false}
                  />
                ))}

                {/* Legend */}
                <g transform={`translate(20, ${svgH - 40})`}>
                  <line x1={0} y1={0} x2={20} y2={0} stroke="#10b981" strokeWidth={2.5} />
                  <text x={24} y={4} className="text-xs fill-slate-500">等价子图</text>
                  <line x1={80} y1={0} x2={100} y2={0} stroke="#ef4444" strokeWidth={3} />
                  <text x={104} y={4} className="text-xs fill-slate-500">匹配</text>
                  <line x1={140} y1={0} x2={160} y2={0} stroke="#f97316" strokeWidth={3} />
                  <text x={164} y={4} className="text-xs fill-slate-500">增广路</text>
                  <circle cx={220} cy={0} r={6} fill="#3b82f6" />
                  <text x={230} y={4} className="text-xs fill-slate-500">已匹配</text>
                  <circle cx={280} cy={0} r={6} fill="#f97316" />
                  <text x={290} y={4} className="text-xs fill-slate-500">搜索中</text>
                </g>
              </svg>
            </CardContent>
          </Card>

          {/* Info panels */}
          <div className="space-y-5">
            {/* Step description */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">当前步骤</div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stepIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm leading-6 text-slate-700"
                  >
                    {step.description}
                  </motion.p>
                </AnimatePresence>
                {isLabelAdjust && step.delta != null && (
                  <div className="mt-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700">
                    delta = {step.delta}
                  </div>
                )}
                {step.phase === "done" && step.totalWeight != null && (
                  <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                    Total weight = {step.totalWeight}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Labels table */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">顶标 (Labels)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-400">X (left)</div>
                    {step.lx.map((val, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="font-medium">X{i}</span>
                        <motion.span
                          key={`${stepIdx}-lx-${i}`}
                          initial={{ scale: 1.2, color: "#7c3aed" }}
                          animate={{ scale: 1, color: "#334155" }}
                          transition={{ duration: 0.4 }}
                          className="font-mono"
                        >
                          {val}
                        </motion.span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-slate-400">Y (right)</div>
                    {step.ly.map((val, j) => (
                      <div key={j} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="font-medium">Y{j}</span>
                        <motion.span
                          key={`${stepIdx}-ly-${j}`}
                          initial={{ scale: 1.2, color: "#7c3aed" }}
                          animate={{ scale: 1, color: "#334155" }}
                          transition={{ duration: 0.4 }}
                          className="font-mono"
                        >
                          {val}
                        </motion.span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matching */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-500">匹配</div>
                  <span className="text-sm text-slate-400">{step.matchCount} / {n}</span>
                </div>
                {step.matchCount > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {step.matchX.map((yj, xi) => {
                      if (yj === -1) return null;
                      const w = weights[xi][yj];
                      return (
                        <span
                          key={xi}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                        >
                          X{xi}&ndash;Y{yj}
                          <span className="text-xs text-blue-400">({w})</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">暂无匹配</p>
                )}
              </CardContent>
            </Card>

            {/* Legend / How to read */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 pt-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">读图方式</div>
                <ul className="list-disc space-y-1 pl-4">
                  <li><span className="font-medium text-emerald-600">绿色边</span>：等价子图（l(x)+l(y)=w）</li>
                  <li><span className="font-medium text-red-500">红色粗边</span>：当前匹配</li>
                  <li><span className="font-medium text-orange-500">橙色节点/边</span>：搜索中的 S/T 集合或增广路</li>
                  <li><span className="font-medium text-blue-500">蓝色节点</span>：已匹配节点</li>
                  <li>节点下方显示当前顶标值 l</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
