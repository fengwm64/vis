import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PageRankProcessAnimation from './animations/pagerank_process_animation'

const animations = [
  {
    id: 'pagerank',
    title: 'PageRank 过程动画',
    description: '可视化 PageRank 算法在有向图上的迭代传播过程，展示每个节点的重要性分数如何收敛。',
    path: '/animations/pagerank',
    component: PageRankProcessAnimation,
  },
]

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-16">
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
    </div>
  )
}

function AnimationLayout({ children }) {
  const location = useLocation()
  const current = animations.find((a) => location.pathname.startsWith(a.path))

  return (
    <div>
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
      {children}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
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
