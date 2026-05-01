import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const initialForm = {
  title: '',
  description: '',
  refs: '',
  expectedComplexity: 'medium',
}

const complexityOptions = [
  { value: 'small', label: '小型：单一算法，1 个核心动画视图' },
  { value: 'medium', label: '中型：含步骤解释、播放控制与关键指标' },
  { value: 'large', label: '大型：多状态、多分支或复杂交互' },
]

export default function Submit() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || '提交失败，请稍后重试')
      }

      setResult(payload)
      setForm(initialForm)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-950">
            ← 返回首页
          </Link>
          <Button variant="outline" onClick={() => navigate('/status')}>查看进度总览</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
            <div className="inline-flex rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-slate-950">
              Auto Dev Intake
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight">
              把新算法动画交给 Agent 团队
            </h1>
            <p className="mt-4 leading-7 text-slate-300">
              提交后会自动创建带 <span className="font-semibold text-white">auto-dev</span> label 的 GitHub Issue，
              GitHub Actions 将启动 PM、算法、前端、QA 四个角色协作开发。
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <p>1. PM 评估可行性并写 PRD</p>
              <p>2. 算法工程师实现纯函数与自检</p>
              <p>3. 前端专家接入交互式动画</p>
              <p>4. QA 验证后自动创建 PR</p>
            </div>
          </section>

          <Card className="rounded-[2rem] border-white/80 bg-white/90 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">提交需求</CardTitle>
              <CardDescription>
                描述越具体，Agent 越容易一次生成可合并的动画。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">算法名称</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="例如：二分查找可视化"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">问题描述</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    required
                    minLength={20}
                    maxLength={5000}
                    rows={8}
                    placeholder="说明希望展示的输入规模、关键步骤、交互控件、验收标准等。"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">参考链接</span>
                  <textarea
                    value={form.refs}
                    onChange={(event) => updateField('refs', event.target.value)}
                    rows={3}
                    placeholder="可选。每行一个链接或资料说明。"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">期望复杂度</span>
                  <select
                    value={form.expectedComplexity}
                    onChange={(event) => updateField('expectedComplexity', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  >
                    {complexityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    已创建 Issue #{result.issueNumber}：
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

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-2xl text-base"
                >
                  {submitting ? '提交中…' : '创建自动开发需求'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
