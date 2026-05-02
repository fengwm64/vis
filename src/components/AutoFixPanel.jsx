import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const initialForm = {
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

export default function AutoFixPanel({ animation }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  if (!animation) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          animationId: animation.id,
          animationTitle: animation.title,
          animationPath: animation.path,
        }),
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
    <section className="bg-slate-50 px-6 pb-10">
      <Card className="mx-auto max-w-6xl rounded-3xl border-dashed border-slate-300 bg-white/90 shadow-sm">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>发现这个动画可以改进？</CardTitle>
            <CardDescription className="mt-2">
              提交关于「{animation.title}」的 bug、交互问题或优化建议，Agent 会自动创建修复 PR。
            </CardDescription>
          </div>
          <Button
            type="button"
            variant={open ? 'secondary' : 'default'}
            onClick={() => setOpen((value) => !value)}
            className="rounded-2xl"
          >
            {open ? '收起建议表单' : '提交优化建议'}
          </Button>
        </CardHeader>

        {open && (
          <CardContent>
            <form className="grid gap-4 lg:grid-cols-[180px_1fr]" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">问题类型</span>
                <select
                  value={form.area}
                  onChange={(event) => updateField('area', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                >
                  {areaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">一句话标题</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="例如：播放按钮和下一步按钮行为重复"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">具体说明</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={5}
                    placeholder="说明你看到的问题、期望如何改、最好附上复现步骤。"
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
                    已创建修复 Issue #{result.issueNumber}：
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

                <Button type="submit" disabled={submitting} className="rounded-2xl">
                  {submitting ? '提交中…' : '提交给 Auto-Fix Agent'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </section>
  )
}
