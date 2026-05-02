import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps } from "./algorithm";

const DEFAULT_ARRAY = [38, 27, 43, 3, 9, 82, 10];

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
  return Array.from({ length }, () => Math.floor(Math.random() * 99) + 1);
}

function parseInput(text) {
  return text
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

export default function InsertionSortAnimation() {
  const [inputText, setInputText] = useState(DEFAULT_ARRAY.join(", "));
  const [arrayLength, setArrayLength] = useState(7);

  const [steps, setSteps] = useState(() => computeSteps(DEFAULT_ARRAY));
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const current = steps[stepIndex] ?? steps[steps.length - 1];
  const totalSteps = steps.length;

  const { minVal, maxVal, range } = useMemo(() => {
    const values = current.array.filter((v) => v !== null);
    const lo = Math.min(...values, 0);
    const hi = Math.max(...values, 0);
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
    if (arr.length < 2) return;
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
    if (current.inserting && index === current.current)
      return "bg-purple-500";
    if (current.shifting && current.comparing !== null && index === current.comparing - 1)
      return "bg-cyan-500";
    if (current.shifting && current.comparing !== null && index === current.comparing)
      return "bg-blue-500";
    if (current.comparing !== null && index === current.comparing)
      return "bg-amber-400";
    if (current.current !== null && index === current.current)
      return "bg-rose-400";
    if (index < current.sortedEnd) return "bg-emerald-500";
    return "bg-slate-400";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              插入排序可视化
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              将待排列元素划分为「已排序」和「未排序」两部分，每次从「未排序」部分取出一个元素，插入到「已排序」部分的正确位置。
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

              {/* Sorted region indicator */}
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-block h-2 w-6 rounded bg-emerald-500" />
                已排序区间 [0, {current.sortedEnd})
              </div>

              {/* Key holding area */}
              <div className="mb-2 flex items-center justify-center h-12">
                <AnimatePresence mode="wait">
                  {current.keyValue !== null && (
                    <motion.div
                      key="key-held"
                      className="flex items-center gap-2 rounded-full bg-rose-100 border-2 border-rose-400 px-4 py-1.5 shadow-sm"
                      initial={{ opacity: 0, y: -10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <span className="text-xs font-medium text-rose-600">key</span>
                      <span className="text-lg font-bold text-rose-700">{current.keyValue}</span>
                    </motion.div>
                  )}
                  {current.inserting && current.insertTarget !== null && (
                    <motion.div
                      key="key-inserting"
                      className="flex items-center gap-2 rounded-full bg-purple-100 border-2 border-purple-400 px-4 py-1.5 shadow-sm"
                      initial={{ opacity: 0, y: -10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <span className="text-xs font-medium text-purple-600">插入</span>
                      <span className="text-lg font-bold text-purple-700">{current.array[current.insertTarget]}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bar chart */}
              <div className="relative flex items-stretch justify-center gap-1 h-[280px] rounded-2xl bg-white p-4">
                {minVal < 0 && (
                  <div
                    className="absolute left-4 right-4 border-t border-dashed border-slate-300 z-10"
                    style={{ bottom: `${4 + (maxVal / range) * 92}%` }}
                  >
                    <span className="absolute -top-4 -left-1 text-[10px] text-slate-400">0</span>
                  </div>
                )}
                {current.array.map((value, i) => {
                  const isNull = value === null;
                  const absValue = isNull ? 0 : Math.abs(value);
                  const heightPct = (absValue / range) * 92;
                  const isComparing =
                    current.comparing !== null && i === current.comparing;
                  const isCurrent =
                    current.current !== null && i === current.current;
                  const isSorted = i < current.sortedEnd;
                  const isNegative = !isNull && value < 0;
                  const isInsertTarget = current.inserting && current.insertTarget === i;
                  const isShiftSource = current.shifting && current.comparing !== null && i === current.comparing - 1;

                  const zeroBottom = minVal < 0 ? (maxVal / range) * 92 : 0;
                  const barBottom = isNegative ? zeroBottom - heightPct : zeroBottom;
                  const labelBottom = isNegative ? barBottom - 20 : barBottom + heightPct + 4;

                  if (isNull) {
                    return (
                      <div
                        key={i}
                        className="relative flex-1 max-w-[60px]"
                      >
                        <motion.div
                          className="absolute left-1 right-1 bottom-0 rounded-t-md border-2 border-dashed border-slate-300 bg-slate-100"
                          initial={false}
                          animate={{ height: "20%", opacity: 0.5 }}
                          transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        />
                        <span className="absolute top-1/2 left-0 right-0 text-center text-lg text-slate-300 -translate-y-1/2">
                          ∅
                        </span>
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-slate-400">
                          {i}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className="relative flex-1 max-w-[60px]"
                    >
                      <motion.span
                        className="absolute left-0 right-0 text-center text-xs font-medium text-slate-700"
                        style={{ bottom: `${labelBottom}%` }}
                        layout
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      >
                        {value}
                      </motion.span>

                      <motion.div
                        className={`absolute left-0 right-0 ${barColor(i)} ${isNegative ? "rounded-b-md" : "rounded-t-md"}`}
                        layout
                        initial={false}
                        animate={{
                          bottom: `${Math.max(0, barBottom)}%`,
                          height: `${Math.max(2, heightPct)}%`,
                          scale: isComparing || isCurrent || isInsertTarget || isShiftSource ? 1.08 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                      />

                      <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-slate-400">
                        {i}
                      </span>

                      {isSorted && !isNull && (
                        <span className="absolute -bottom-4 left-0 right-0 text-center text-[10px] text-emerald-600 font-medium">
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
                  <span className="inline-block h-3 w-3 rounded bg-cyan-500" />
                  移位源
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-blue-500" />
                  移位目标
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-purple-500" />
                  插入中
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-rose-400" />
                  当前取出
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
                  已排序
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-slate-400" />
                  未排序
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border-2 border-dashed border-slate-300 bg-slate-100" />
                  key 已取出
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
                      placeholder="例如: 38, 27, 43, 3"
                    />
                  </div>

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
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-2xl font-bold text-amber-600">
                      {current.comparisons}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">比较次数</div>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {current.shifts}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">移位次数</div>
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
                  插入排序将数组分为已排序和未排序两部分。从未排序部分取出第一个元素，与已排序部分从右到左逐一比较，找到正确位置后插入。时间复杂度 O(n²)，空间复杂度 O(1)，是稳定排序。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
