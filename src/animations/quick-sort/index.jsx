import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps } from "./algorithm";

const DEFAULT_ARRAY = [64, 34, 25, 12, 22, 11, 90, 1];

function Icon({ type }) {
  const common =
    "mr-2 inline-flex h-4 w-4 items-center justify-center text-sm leading-none";
  const label = {
    play: "▶",
    pause: "‖",
    step: "⏭",
    "step-back": "⏮",
    reset: "↺",
  };
  return (
    <span className={common} aria-hidden="true">
      {label[type]}
    </span>
  );
}

function randomArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 198) - 99);
}

function parseInput(text) {
  return text
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

export default function QuickSortAnimation() {
  const [inputText, setInputText] = useState(DEFAULT_ARRAY.join(", "));
  const [arrayLength, setArrayLength] = useState(8);

  const [steps, setSteps] = useState(() => computeSteps(DEFAULT_ARRAY));
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const current = steps[stepIndex] ?? steps[steps.length - 1];
  const totalSteps = steps.length;

  const { minVal, maxVal, range } = useMemo(() => {
    const lo = Math.min(...current.array, 0);
    const hi = Math.max(...current.array, 0);
    return { minVal: lo, maxVal: hi, range: hi - lo || 1 };
  }, [current.array]);

  const handleRandom = useCallback(() => {
    const arr = randomArray(arrayLength);
    setInputText(arr.join(", "));
    const s = computeSteps(arr);
    setSteps(s);
    setStepIndex(0);
    setPlaying(false);
  }, [arrayLength]);

  const handleConfirm = useCallback(() => {
    const arr = parseInput(inputText);
    if (arr.length < 1) return;
    const s = computeSteps(arr);
    setSteps(s);
    setStepIndex(0);
    setPlaying(false);
  }, [inputText]);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setStepIndex(0);
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    if (stepIndex >= steps.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }, speed);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, steps.length, speed]);

  function barColor(index) {
    if (current.sorted.includes(index)) return "bg-emerald-500";
    if (current.swapping && current.swapping.includes(index))
      return "bg-blue-500";
    if (current.comparing === index) return "bg-amber-400";
    if (current.pivot === index) return "bg-rose-500";
    if (
      current.partitioned.includes(index)
    )
      return "bg-violet-400";
    return "bg-slate-400";
  }

  const inRange =
    current.range[0] <= current.range[1]
      ? (i) => i >= current.range[0] && i <= current.range[1]
      : () => false;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              快速排序可视化
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              选择 pivot 将数组分区，递归排序左右两部分，展示分治过程。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPlaying((v) => !v)}
              className="rounded-2xl shadow-sm"
              aria-label={playing ? "暂停" : "播放"}
            >
              <Icon type={playing ? "pause" : "play"} />
              {playing ? "暂停" : "播放"}
            </Button>
            <Button
              variant="outline"
              onClick={goPrev}
              className="rounded-2xl"
              aria-label="上一步"
            >
              <Icon type="step-back" />
              上一步
            </Button>
            <Button
              variant="outline"
              onClick={goNext}
              className="rounded-2xl"
              aria-label="下一步"
            >
              <Icon type="step" />
              下一步
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-2xl"
              aria-label="重置"
            >
              <Icon type="reset" />
              重置
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* Left: visualization */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">数组状态</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {stepIndex} / {totalSteps - 1}
                </div>
              </div>

              {/* Bar chart */}
              <div className="relative flex items-stretch justify-center gap-1 h-[320px] rounded-2xl bg-white p-4">
                {minVal < 0 && (
                  <div
                    className="absolute left-4 right-4 border-t border-dashed border-slate-300 z-10"
                    style={{
                      bottom: `${4 + (maxVal / range) * 92}%`,
                    }}
                  >
                    <span className="absolute -top-4 -left-1 text-[10px] text-slate-400">
                      0
                    </span>
                  </div>
                )}
                {current.array.map((value, i) => {
                  const heightPct = (Math.abs(value) / range) * 92;
                  const isComparing = current.comparing === i;
                  const isSwapping =
                    current.swapping && current.swapping.includes(i);
                  const isPivot = current.pivot === i;
                  const isSorted = current.sorted.includes(i);
                  const isNegative = value < 0;

                  const zeroBottom = minVal < 0 ? (maxVal / range) * 92 : 0;
                  const barBottom = isNegative
                    ? zeroBottom - heightPct
                    : zeroBottom;
                  const labelBottom = isNegative
                    ? barBottom - 20
                    : barBottom + heightPct + 4;

                  return (
                    <div key={i} className="relative flex-1 max-w-[60px]">
                      {/* Range bracket */}
                      {inRange(i) && (
                        <div className="absolute -top-1 left-0 right-0 h-1 rounded-full bg-indigo-300/50" />
                      )}

                      {/* Value label */}
                      <motion.span
                        className="absolute left-0 right-0 text-center text-xs font-medium text-slate-700"
                        style={{ bottom: `${labelBottom}%` }}
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                      >
                        {value}
                      </motion.span>

                      {/* Bar */}
                      <motion.div
                        className={`absolute left-0 right-0 ${barColor(i)} ${isNegative ? "rounded-b-md" : "rounded-t-md"}`}
                        layout
                        initial={false}
                        animate={{
                          bottom: `${Math.max(0, barBottom)}%`,
                          height: `${Math.max(2, heightPct)}%`,
                          scale: isComparing || isSwapping ? 1.08 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                      />

                      {/* Index label */}
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-slate-400">
                        {i}
                      </span>

                      {/* Status indicators */}
                      {isSorted && (
                        <span className="absolute -bottom-4 left-0 right-0 text-center text-[10px] text-emerald-600 font-medium">
                          ✓
                        </span>
                      )}
                      {isPivot && !isSorted && (
                        <span className="absolute -bottom-4 left-0 right-0 text-center text-[10px] text-rose-600 font-bold">
                          P
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-rose-500" />
                  Pivot
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-amber-400" />
                  比较中
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-blue-500" />
                  交换中
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-violet-400" />
                  已分区
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
                  已排序
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-slate-400" />
                  未处理
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Right: panels */}
          <div className="space-y-5">
            {/* Input controls */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">
                  输入控制
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      自定义数组（逗号分隔）
                    </label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onBlur={handleConfirm}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConfirm();
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="例如: 64, 34, 25, 12"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      随机数组长度: {arrayLength}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={arrayLength}
                        onChange={(e) =>
                          setArrayLength(Number(e.target.value))
                        }
                        className="flex-1 accent-indigo-600"
                      />
                      <Button
                        variant="outline"
                        onClick={handleRandom}
                        className="rounded-lg text-sm"
                      >
                        随机生成
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Speed control */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">
                  播放速度
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">快</span>
                  <input
                    type="range"
                    min={100}
                    max={1500}
                    step={100}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs text-slate-500">慢</span>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    {speed}ms
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Step description */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  当前步骤
                </div>
                <p className="text-sm leading-6 text-slate-700 min-h-[2.5rem]">
                  {current.description}
                </p>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">
                  统计信息
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-2xl font-bold text-indigo-600">
                      {current.recursionDepth}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">递归深度</div>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-2xl font-bold text-amber-600">
                      {current.comparisons}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">比较次数</div>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {current.swaps}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">交换次数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Algorithm info */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">
                  算法说明
                </div>
                <p>
                  快速排序通过选择 pivot 将数组分为两部分：小于 pivot 的元素放左边，大于的放右边，然后递归处理。平均时间复杂度
                  O(n log n)，最坏 O(n²)。空间复杂度 O(log n)。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
