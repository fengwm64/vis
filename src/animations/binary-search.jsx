import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeSteps } from "./binary-search/algorithm";

const DEFAULT_ARRAY = [-10, -3, 0, 5, 8, 12, 25, 37];
const DEFAULT_TARGET = 5;

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

function randomSortedArray(length) {
  const arr = Array.from(
    { length },
    () => Math.floor(Math.random() * 1999) - 999
  );
  arr.sort((a, b) => a - b);
  return arr;
}

function parseInput(text) {
  return text
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

export default function BinarySearchAnimation() {
  const [inputText, setInputText] = useState(DEFAULT_ARRAY.join(", "));
  const [targetText, setTargetText] = useState(String(DEFAULT_TARGET));
  const [arrayLength, setArrayLength] = useState(8);

  const [steps, setSteps] = useState(() =>
    computeSteps(DEFAULT_ARRAY, DEFAULT_TARGET)
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);

  const current = steps[stepIndex] ?? steps[steps.length - 1];
  const totalSteps = steps.length;

  const handleRandom = useCallback(() => {
    const arr = randomSortedArray(arrayLength);
    const target = arr[Math.floor(Math.random() * arr.length)];
    setInputText(arr.join(", "));
    setTargetText(String(target));
    const s = computeSteps(arr, target);
    setSteps(s);
    setStepIndex(0);
    setPlaying(false);
  }, [arrayLength]);

  const handleConfirm = useCallback(() => {
    const arr = parseInput(inputText).sort((a, b) => a - b);
    const trimmedTargetText = targetText.trim();
    if (arr.length < 1 || trimmedTargetText === "") return;
    const target = Number(trimmedTargetText);
    if (Number.isNaN(target)) return;
    setInputText(arr.join(", "));
    const s = computeSteps(arr, target);
    setSteps(s);
    setStepIndex(0);
    setPlaying(false);
  }, [inputText, targetText]);

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

  function cellBg(index) {
    if (current.done && current.found && index === current.foundIndex) {
      return "bg-emerald-500 text-white";
    }
    if (current.mid === index) {
      return "bg-blue-500 text-white";
    }
    if (index >= current.left && index <= current.right) {
      return "bg-indigo-100 text-slate-900";
    }
    return "bg-slate-200 text-slate-400";
  }

  function cellBorder(index) {
    if (current.done && current.found && index === current.foundIndex) {
      return "border-emerald-600";
    }
    if (current.mid === index) {
      return "border-blue-600";
    }
    return "border-slate-300";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              二分查找可视化
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              在已排序数组中查找目标值，每步取中间元素与目标比较，根据比较结果缩小一半搜索范围。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPlaying((v) => !v)}
              className="rounded-2xl shadow-sm"
              aria-label={playing ? "暂停" : "播放"}
              disabled={current.done}
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
              disabled={current.done}
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
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">数组</div>
                <div className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  步骤 {stepIndex} / {totalSteps - 1}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                {/* Pointer labels */}
                <div className="flex justify-center gap-1 mb-1">
                  {current.array.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 max-w-[70px] text-center text-[10px] h-4"
                    >
                      {current.left === i && (
                        <span className="text-emerald-600 font-bold">L</span>
                      )}
                      {current.right === i && current.left !== current.right && (
                        <span className="text-rose-600 font-bold">
                          {current.left === current.right ? "" : "R"}
                        </span>
                      )}
                      {current.left === i &&
                        current.right === i &&
                        current.left === current.right && (
                          <span className="text-slate-500 font-bold">L/R</span>
                        )}
                    </div>
                  ))}
                </div>

                {/* Array cells */}
                <div className="flex justify-center gap-1">
                  {current.array.map((value, i) => {
                    const isMid = current.mid === i;
                    const isFound =
                      current.done && current.found && i === current.foundIndex;
                    return (
                      <motion.div
                        key={i}
                        className={`flex-1 max-w-[70px] flex flex-col items-center rounded-lg border-2 p-2 ${cellBg(i)} ${cellBorder(i)}`}
                        animate={{
                          scale: isMid || isFound ? 1.08 : 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        }}
                      >
                        <span className="text-base font-bold">{value}</span>
                        <span className="text-[10px] opacity-60 mt-0.5">
                          [{i}]
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mid pointer arrow */}
                {current.mid !== null && (
                  <div className="flex justify-center gap-1 mt-1">
                    {current.array.map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 max-w-[70px] text-center text-[10px] h-4"
                      >
                        {i === current.mid && (
                          <span className="text-blue-600 font-bold">
                            ▲ mid
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-indigo-100 border border-slate-300" />
                    搜索范围
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-blue-500" />
                    中间元素
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
                    找到目标
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-slate-200" />
                    范围外
                  </span>
                </div>
              </div>

              {/* Result banner */}
              {current.done && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 rounded-xl p-3 text-center font-semibold ${
                    current.found
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {current.found
                    ? `找到目标值 ${current.target}，索引为 ${current.foundIndex}`
                    : `未找到目标值 ${current.target}`}
                </motion.div>
              )}
            </CardContent>
          </Card>

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
                      自定义数组（逗号分隔，自动排序）
                    </label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="例如: -10, -3, 0, 5, 8, 12"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      目标值
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={targetText}
                        onChange={(e) => setTargetText(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="输入目标值"
                      />
                      <Button
                        onClick={handleConfirm}
                        className="rounded-lg text-sm"
                      >
                        查找
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">
                      随机数组长度: {arrayLength}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={30}
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
                    min={200}
                    max={2000}
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

            {/* Pointer info */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 text-sm font-semibold text-slate-500">
                  指针状态
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-lg font-bold text-emerald-600">
                      {current.left}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">left</div>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-lg font-bold text-rose-600">
                      {current.right}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">right</div>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-lg font-bold text-blue-600">
                      {current.mid ?? "-"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">mid</div>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-3">
                    <div className="text-lg font-bold text-amber-600">
                      {current.midValue ?? "-"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      arr[mid]
                    </div>
                  </div>
                </div>
                {current.comparison && (
                  <div className="mt-3 text-center text-sm">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-mono font-semibold">
                      {current.midValue} {current.comparison} {current.target}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Algorithm info */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 text-sm leading-6 text-slate-600">
                <div className="mb-2 font-semibold text-slate-900">
                  算法说明
                </div>
                <p>
                  二分查找在已排序数组中查找目标值。每步取中间元素与目标比较：若相等则找到；若中间值小于目标则在右半部分继续；否则在左半部分继续。时间复杂度 O(log n)，空间复杂度 O(1)。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
