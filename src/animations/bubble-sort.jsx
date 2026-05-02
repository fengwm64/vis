import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps } from "./bubble-sort/algorithm";

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

export default function BubbleSortAnimation() {
  // --- Input state ---
  const [inputText, setInputText] = useState(DEFAULT_ARRAY.join(", "));
  const [arrayLength, setArrayLength] = useState(8);

  // --- Playback state ---
  const [steps, setSteps] = useState(() => computeSteps(DEFAULT_ARRAY));
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600); // ms per step

  const current = steps[stepIndex] ?? steps[steps.length - 1];
  const totalSteps = steps.length;
  const maxVal = useMemo(
    () => Math.max(...current.array.map(Math.abs), 1),
    [current.array]
  );

  // --- Input handlers ---
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
    if (arr.length < 2) return;
    const s = computeSteps(arr);
    setSteps(s);
    setStepIndex(0);
    setPlaying(false);
  }, [inputText]);

  // --- Playback controls ---
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

  // Auto-play
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

  // --- Bar colors ---
  function barColor(index) {
    if (current.sorted.includes(index)) return "bg-emerald-500";
    if (
      current.swapping &&
      (index === current.swapping[0] || index === current.swapping[1])
    )
      return "bg-blue-500";
    if (
      current.comparing &&
      (index === current.comparing[0] || index === current.comparing[1])
    )
      return "bg-amber-400";
    return "bg-slate-400";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              冒泡排序可视化
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              依次比较相邻元素，若顺序错误则交换，每轮将当前最大值"冒泡"到末尾。
            </p>
          </div>

          {/* Playback buttons */}
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
              <div className="flex items-end justify-center gap-1 h-[320px] rounded-2xl bg-white p-4">
                {current.array.map((value, i) => {
                  const heightPct =
                    maxVal > 0 ? (Math.abs(value) / maxVal) * 100 : 0;
                  const isComparing =
                    current.comparing &&
                    (i === current.comparing[0] ||
                      i === current.comparing[1]);
                  const isSwapping =
                    current.swapping &&
                    (i === current.swapping[0] ||
                      i === current.swapping[1]);
                  const isSorted = current.sorted.includes(i);

                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center flex-1 max-w-[60px]"
                    >
                      {/* Value label */}
                      <motion.span
                        className="text-xs font-medium mb-1 text-slate-700"
                        layout
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      >
                        {value}
                      </motion.span>

                      {/* Bar */}
                      <motion.div
                        className={`w-full rounded-t-md ${barColor(i)}`}
                        layout
                        initial={false}
                        animate={{
                          height: `${Math.max(4, heightPct * 2.6)}px`,
                          scale: isComparing || isSwapping ? 1.08 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                      />

                      {/* Index label */}
                      <span className="text-[10px] text-slate-400 mt-1">
                        {i}
                      </span>

                      {/* Status indicators */}
                      {isSorted && (
                        <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-amber-400" />
                  比较中
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-blue-500" />
                  交换中
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
                  已就位
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-slate-400" />
                  未排序
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
                  {/* Manual input */}
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      自定义数组（逗号分隔）
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="例如: 64, 34, 25, 12"
                      />
                      <Button
                        onClick={handleConfirm}
                        className="rounded-lg text-sm"
                      >
                        排序
                      </Button>
                    </div>
                  </div>

                  {/* Random generation */}
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      随机数组长度: {arrayLength}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={2}
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
                      {current.round}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">当前轮次</div>
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
                  冒泡排序每轮遍历未排序部分，比较相邻元素并交换顺序错误的对。一轮结束后，当前最大值"冒泡"到正确位置。时间复杂度 O(n²)，空间复杂度 O(1)。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
