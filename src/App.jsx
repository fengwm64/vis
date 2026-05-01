import React from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import PageRankProcessAnimation from './animations/pagerank_process_animation'
import Submit from './pages/Submit'
import Status from './pages/Status'
import { Button } from './components/ui/button'

const animations = [
  {
    id: 'pagerank',
    title: 'PageRank 过程动画',
    description: '可视化 PageRank 算法在有向图上的迭代传播过程，展示每个节点的重要性分数如何收敛。',
    path: '/animations/pagerank',
    component: PageRankProcessAnimation,
  },
]

function GitHubIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">102465</span>
          <span className="text-slate-300">|</span>
          <span>你的 AI 工具箱</span>
        </div>
        <div className="flex items-center gap-4">
          <span>算法可视化工具箱</span>
          <a
            href="https://alg.102465.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors"
          >
            alg.102465.xyz
          </a>
          <a
            href="https://github.com/fengwm64/vis"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
          >
            <GitHubIcon />
            <span>开源</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <div className="mx-auto max-w-5xl px-6 py-16 flex-1 w-full">
        <div className="mb-10 flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/status')}>
            查看自动开发进度
          </Button>
          <Button onClick={() => navigate('/submit')}>
            提交算法需求
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            算法可视化
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            通过交互式动画直观理解经典算法的运行过程
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animations.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h2>
                <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                  →
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            更多算法动画持续添加中…
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function AnimationLayout({ children }) {
  const location = useLocation()
  const current = animations.find((a) => location.pathname.startsWith(a.path))

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            ← 返回首页
          </Link>
          {current && (
            <span className="text-sm font-semibold text-slate-900">
              {current.title}
            </span>
          )}
          <div className="w-16" />
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/submit" element={<Submit />} />
      <Route path="/status" element={<Status />} />
      {animations.map((item) => (
        <Route
          key={item.id}
          path={item.path}
          element={
            <AnimationLayout>
              <item.component />
            </AnimationLayout>
          }
        />
      ))}
    </Routes>
  )
}

export default App
