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

export default function Status() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

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
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">标题</th>
                      <th className="px-6 py-4">类型</th>
                      <th className="px-6 py-4">当前阶段</th>
                      <th className="px-6 py-4">负责 Agent</th>
                      <th className="px-6 py-4">最近活动</th>
                      <th className="px-6 py-4">Issue</th>
                      <th className="px-6 py-4">PR</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
