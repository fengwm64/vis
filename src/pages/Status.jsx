import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const stageLabels = {
  submitted: '已提交',
  pm_triage: 'PM 评估',
  pm_drafting_prd: 'PM 写 PRD',
  prd_done: 'PRD 完成',
  rejected: '已拒绝',
  algorithm_designing: '算法设计',
  algorithm_coding: '算法实现',
  algorithm_testing: '算法自检',
  algorithm_done: '算法完成',
  frontend_designing: '前端设计',
  frontend_coding: '前端实现',
  frontend_done: '前端完成',
  qa_running: 'QA 验证',
  qa_passed: 'QA 通过',
  pr_opened: 'PR 已创建',
  aborted: '已中止',
  merged: '已合并',
}

const stageTone = {
  rejected: 'bg-rose-100 text-rose-700 ring-rose-200',
  aborted: 'bg-rose-100 text-rose-700 ring-rose-200',
  pr_opened: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  merged: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  qa_passed: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  frontend_coding: 'bg-sky-100 text-sky-700 ring-sky-200',
  algorithm_coding: 'bg-amber-100 text-amber-800 ring-amber-200',
  pm_drafting_prd: 'bg-violet-100 text-violet-700 ring-violet-200',
}

const pipelineLabels = {
  'auto-dev': '新算法',
  'auto-fix': '修复优化',
}

const pipelineTone = {
  'auto-dev': 'bg-cyan-100 text-cyan-700 ring-cyan-200',
  'auto-fix': 'bg-orange-100 text-orange-700 ring-orange-200',
}

const continueInitialForm = {
  area: 'interaction',
  title: '',
  description: '',
}

const areaOptions = [
  { value: 'interaction', label: '交互问题' },
  { value: 'visual', label: '视觉优化' },
  { value: 'content', label: '文案/讲解' },
  { value: 'algorithm', label: '算法逻辑' },
  { value: 'performance', label: '性能/兼容性' },
]

function formatTime(value) {
  if (!value) return '暂无'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function StageBadge({ stage }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${stageTone[stage] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {stageLabels[stage] || stage || '未知'}
    </span>
  )
}

function PipelineBadge({ pipeline }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${pipelineTone[pipeline] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {pipelineLabels[pipeline] || pipeline || '未知'}
    </span>
  )
}

function ContinueFixDialog({
  item,
  form,
  submitting,
  error,
  result,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!item) return null

  const target = item.target

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white text-slate-950 shadow-2xl">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#fff7ed,#ecfeff)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">Follow-up Auto-Fix</p>
              <h2 className="mt-2 text-2xl font-black">继续修复 #{item.issueNumber}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                新 issue 会自动引用原 Issue 和 PR，并要求 QA 重点验证这次的复现步骤。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-500 shadow-sm hover:text-slate-950"
            >
              关闭
            </button>
          </div>
        </div>

        <form className="space-y-5 p-6" onSubmit={onSubmit}>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <div><span className="font-semibold text-slate-900">目标动画：</span>{target?.animationTitle || '未知'}</div>
            <div><span className="font-semibold text-slate-900">路径：</span>{target?.animationPath || '未知'}</div>
            <div><span className="font-semibold text-slate-900">原 Issue：</span>#{item.issueNumber}</div>
            {item.prUrl && <div><span className="font-semibold text-slate-900">原 PR：</span>{item.prUrl}</div>}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">问题类型</span>
            <select
              value={form.area}
              onChange={(event) => onChange('area', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            >
              {areaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">继续修复标题</span>
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="例如：随机生成数组仍然出现负数"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">仍未解决的问题和复现步骤</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              required
              minLength={10}
              maxLength={3000}
              rows={6}
              placeholder="说明上次修复后还存在什么问题、如何复现、这次期望如何验证。"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              已创建继续修复 Issue #{result.issueNumber}：
              <a
                href={result.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-semibold underline"
              >
                查看 GitHub Issue
              </a>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl">
              取消
            </Button>
            <Button type="submit" disabled={submitting || !target} className="rounded-2xl">
              {submitting ? '提交中…' : '创建继续修复 Issue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Status() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [continueItem, setContinueItem] = useState(null)
  const [continueForm, setContinueForm] = useState(continueInitialForm)
  const [continueSubmitting, setContinueSubmitting] = useState(false)
  const [continueError, setContinueError] = useState('')
  const [continueResult, setContinueResult] = useState(null)

  async function loadStatus({ silent = false } = {}) {
    if (!silent) setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/status')
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || '加载失败')
      }

      setItems(payload.items || [])
      setUpdatedAt(payload.generatedAt || new Date().toISOString())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
    const timer = window.setInterval(() => loadStatus({ silent: true }), 10000)
    return () => window.clearInterval(timer)
  }, [])

  function openContinueFix(item) {
    setContinueItem(item)
    setContinueForm(continueInitialForm)
    setContinueError('')
    setContinueResult(null)
  }

  function closeContinueFix() {
    setContinueItem(null)
    setContinueForm(continueInitialForm)
    setContinueError('')
    setContinueResult(null)
  }

  function updateContinueField(field, value) {
    setContinueForm((current) => ({ ...current, [field]: value }))
  }

  async function submitContinueFix(event) {
    event.preventDefault()
    if (!continueItem?.target) return

    setContinueSubmitting(true)
    setContinueError('')
    setContinueResult(null)

    try {
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...continueForm,
          animationId: continueItem.target.animationId,
          animationTitle: continueItem.target.animationTitle,
          animationPath: continueItem.target.animationPath,
          previousIssueNumber: String(continueItem.issueNumber),
          previousIssueUrl: continueItem.issueUrl,
          previousPrUrl: continueItem.prUrl || '',
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || '继续修复提交失败')
      }

      setContinueResult(payload)
      setContinueForm(continueInitialForm)
      loadStatus({ silent: true })
    } catch (submitError) {
      setContinueError(submitError.message)
    } finally {
      setContinueSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white">
            ← 返回首页
          </Link>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/submit')}>提交新需求</Button>
            <Button variant="outline" onClick={() => loadStatus()} disabled={loading}>
              {loading ? '刷新中…' : '立即刷新'}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-white text-slate-950 shadow-2xl">
          <CardHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#e0f2fe)]">
            <CardTitle className="text-3xl">自动开发 / 修复进度</CardTitle>
            <CardDescription>
              同时跟踪 auto-dev 新算法需求和 auto-fix 现有动画修复。最近刷新：{formatTime(updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {!error && loading && (
              <div className="p-8 text-center text-slate-500">正在加载自动开发任务…</div>
            )}

            {!error && !loading && items.length === 0 && (
              <div className="p-8 text-center text-slate-500">暂无 auto-dev 或 auto-fix 自动任务。</div>
            )}

            {!error && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">标题</th>
                      <th className="px-6 py-4">类型</th>
                      <th className="px-6 py-4">当前阶段</th>
                      <th className="px-6 py-4">负责 Agent</th>
                      <th className="px-6 py-4">最近活动</th>
                      <th className="px-6 py-4">Issue</th>
                      <th className="px-6 py-4">PR</th>
                      <th className="px-6 py-4">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.issueNumber} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs text-slate-500">#{item.issueNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <PipelineBadge pipeline={item.pipeline} />
                        </td>
                        <td className="px-6 py-4">
                          <StageBadge stage={item.currentStage} />
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.currentOwner || '未分配'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatTime(item.lastActivityAt)}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={item.issueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sky-700 hover:underline"
                          >
                            打开
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          {item.prUrl ? (
                            <a
                              href={item.prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-emerald-700 hover:underline"
                            >
                              查看 PR
                            </a>
                          ) : (
                            <span className="text-slate-400">暂无</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.pipeline === 'auto-fix' && item.target ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openContinueFix(item)}
                              className="rounded-full"
                            >
                              继续修复
                            </Button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ContinueFixDialog
        item={continueItem}
        form={continueForm}
        submitting={continueSubmitting}
        error={continueError}
        result={continueResult}
        onClose={closeContinueFix}
        onChange={updateContinueField}
        onSubmit={submitContinueFix}
      />
    </div>
  )
}
