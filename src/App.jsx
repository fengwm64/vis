import React from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import Submit from './pages/Submit'
import Status from './pages/Status'
import { Button } from './components/ui/button'
import AutoFixPanel from './components/AutoFixPanel'

const animationModules = import.meta.glob('./animations/*/index.jsx', { eager: true })
const animationMetaModules = import.meta.glob('./animations/*/meta.js', { eager: true })

const animations = Object.entries(animationMetaModules)
  .map(([metaPath, metaModule]) => {
    const id = metaPath.match(/\.\/animations\/([^/]+)\/meta\.js$/)?.[1]
    const component = animationModules[`./animations/${id}/index.jsx`]?.default

    if (!id || !component) return null

    return {
      id,
      title: metaModule.title,
      description: metaModule.description,
      path: metaModule.path || `/animations/${id}`,
      category: metaModule.category || 'other',
      order: metaModule.order ?? 1000,
      component,
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.order - b.order)

const categoryConfig = {
  sorting: {
    label: '排序算法',
    eyebrow: 'Sorting',
    description: '比较、交换、分治与稳定性，一眼看清数据如何归位。',
    accent: 'from-orange-400 to-rose-500',
    surface: 'from-orange-50 to-rose-50',
  },
  search: {
    label: '查找算法',
    eyebrow: 'Search',
    description: '定位目标、缩小范围、验证边界，适合理解查找策略。',
    accent: 'from-sky-400 to-cyan-500',
    surface: 'from-sky-50 to-cyan-50',
  },
  graph: {
    label: '图算法',
    eyebrow: 'Graph',
    description: '节点、边、传播和路径，把抽象关系变成可观察过程。',
    accent: 'from-emerald-400 to-teal-500',
    surface: 'from-emerald-50 to-teal-50',
  },
  dynamic: {
    label: '动态规划',
    eyebrow: 'Dynamic Programming',
    description: '状态、转移和最优子结构，适合拆解复杂决策过程。',
    accent: 'from-indigo-400 to-blue-500',
    surface: 'from-indigo-50 to-blue-50',
  },
  dataStructure: {
    label: '数据结构',
    eyebrow: 'Data Structure',
    description: '栈、队列、树、堆等结构的操作过程与不变量。',
    accent: 'from-lime-400 to-green-500',
    surface: 'from-lime-50 to-green-50',
  },
  other: {
    label: '其他算法',
    eyebrow: 'More',
    description: '还没有明确归类的算法动画会暂时放在这里。',
    accent: 'from-slate-400 to-slate-600',
    surface: 'from-slate-50 to-stone-50',
  },
}

const categoryOrder = ['sorting', 'search', 'graph', 'dynamic', 'dataStructure', 'other']

const categoryGroups = Array.from(
  new Set([...categoryOrder, ...animations.map((item) => item.category)])
)
  .map((category) => ({
    id: category,
    ...(categoryConfig[category] || {
      label: category,
      eyebrow: 'Custom',
      description: '自定义算法分类。',
      accent: 'from-slate-400 to-slate-600',
      surface: 'from-slate-50 to-stone-50',
    }),
    items: animations.filter((item) => item.category === category),
  }))
  .filter((group) => group.items.length > 0)

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
            href="https://github.com/fengwm64/AlgorithmVisualizations"
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
  const categoryCount = categoryGroups.length
  const latestAnimation = animations[0]

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f2e8] text-slate-950 flex flex-col">
      <main className="relative flex-1">
        <div className="pointer-events-none absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10rem] top-36 h-[28rem] w-[28rem] rounded-full bg-orange-300/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/70 bg-white/60 px-5 py-3 shadow-sm backdrop-blur">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                AV
              </span>
              <span>
                <span className="block text-sm font-black tracking-tight">Algorithm Visuals</span>
                <span className="block text-xs text-slate-500">多 Agent 驱动的算法动画库</span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/status')} className="rounded-full bg-white/80">
                查看进度
              </Button>
              <Button onClick={() => navigate('/submit')} className="rounded-full bg-slate-950 px-5">
                提交算法需求
              </Button>
            </div>
          </header>

          <section className="grid gap-8 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
            <div>
              <div className="inline-flex rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-600 shadow-sm">
                Interactive algorithm studio
              </div>
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                把抽象算法拆成可观察的每一步
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
                用动画理解比较、查找、图传播和状态变化。你也可以直接提交需求，让 Agent 团队自动补齐新的算法可视化。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => navigate(latestAnimation?.path || '/submit')} className="h-12 rounded-full bg-slate-950 px-6 text-base">
                  开始探索
                </Button>
                <Button variant="outline" onClick={() => navigate('/submit')} className="h-12 rounded-full border-slate-300 bg-white/75 px-6 text-base">
                  让 Agent 新增动画
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-slate-950/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-950/10 bg-slate-950 p-5 text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Library snapshot</p>
                    <h2 className="mt-2 text-2xl font-black">算法地图</h2>
                  </div>
                  <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">
                    Live
                  </span>
                </div>

                <div className="grid gap-3 py-5 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <div className="text-3xl font-black">{animations.length}</div>
                    <div className="mt-1 text-xs text-slate-300">动画数量</div>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <div className="text-3xl font-black">{categoryCount}</div>
                    <div className="mt-1 text-xs text-slate-300">算法分组</div>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <div className="text-3xl font-black">4</div>
                    <div className="mt-1 text-xs text-slate-300">Agent 角色</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {categoryGroups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between rounded-3xl bg-white p-4 text-slate-950">
                      <div className="flex items-center gap-3">
                        <span className={`h-10 w-2 rounded-full bg-gradient-to-b ${group.accent}`} />
                        <div>
                          <div className="font-black">{group.label}</div>
                          <div className="text-xs text-slate-500">{group.eyebrow}</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">
                        {group.items.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="pb-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">Algorithm groups</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">按学习路径浏览</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                分类来自每个动画目录的 `meta.js`。新增算法只要声明 `category`，首页会自动归组，不需要改路由入口。
              </p>
            </div>

            <div className="space-y-8">
              {categoryGroups.map((group) => (
                <section
                  key={group.id}
                  className={`overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br ${group.surface} p-5 shadow-sm`}
                >
                  <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                    <div className="rounded-[1.5rem] bg-white/70 p-6 shadow-sm">
                      <div className={`mb-5 h-2 w-20 rounded-full bg-gradient-to-r ${group.accent}`} />
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{group.eyebrow}</p>
                      <h3 className="mt-3 text-3xl font-black tracking-tight">{group.label}</h3>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{group.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.path}
                          className="group relative overflow-hidden rounded-[1.5rem] border border-slate-950/10 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${group.accent}`} />
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{item.id}</p>
                              <h4 className="mt-3 text-xl font-black tracking-tight text-slate-950 group-hover:text-slate-700">
                                {item.title}
                              </h4>
                            </div>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black transition group-hover:bg-slate-950 group-hover:text-white">
                              →
                            </span>
                          </div>
                          <p className="mt-5 text-sm leading-6 text-slate-600">
                            {item.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="mb-16 overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl sm:p-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-200">Auto development</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">没有你想看的算法？</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                  提交一个需求，PM、算法、前端和 QA Agent 会在 GitHub Actions 中生成实现并发起 PR。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => navigate('/status')} className="h-11 rounded-full px-5">
                  查看任务进度
                </Button>
                <Button onClick={() => navigate('/submit')} className="h-11 rounded-full bg-cyan-300 px-5 text-slate-950 hover:bg-cyan-200">
                  提交新算法
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
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
        <AutoFixPanel animation={current} />
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
