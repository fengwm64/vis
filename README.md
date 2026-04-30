# 算法可视化 | Algorithm Visualizations

一个基于 Web 的交互式算法可视化平台，通过动画直观展示经典算法的运行过程。

🔗 **在线预览**: [https://alg.102465.xyz/](https://alg.102465.xyz/) *(部署后替换)*

---

## 技术栈

- **框架**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **路由**: [React Router v6](https://reactrouter.com/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **部署**: [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动，支持热更新。

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览构建产物

```bash
npm run preview
```

---

## 项目结构

```
├── public/                        # 静态资源
│   └── _redirects                 # Cloudflare Pages SPA 路由回退规则
├── src/
│   ├── main.jsx                   # 应用入口
│   ├── App.jsx                    # 根组件（首页 + 路由配置）
│   ├── index.css                  # Tailwind 基础样式
│   ├── components/ui/             # 通用 UI 组件
│   │   ├── button.jsx             # Button 组件
│   │   └── card.jsx               # Card 组件
│   └── animations/                # 算法动画页面
│       └── pagerank_process_animation.jsx
├── animations/                    # 原始动画组件备份
├── index.html                     # HTML 入口
├── vite.config.js                 # Vite 配置
├── tailwind.config.js             # Tailwind CSS 配置
├── wrangler.toml                  # Cloudflare Pages 部署配置
└── package.json
```

---

## 添加新的算法动画

1. **创建动画组件**

   在 `src/animations/` 目录下新建 `.jsx` 文件，例如：

   ```jsx
   // src/animations/dijkstra_animation.jsx
   export default function DijkstraAnimation() {
     return (
       <div className="min-h-screen bg-slate-50 p-6">
         <h1 className="text-3xl font-bold">Dijkstra 最短路径</h1>
         {/* 你的可视化逻辑 */}
       </div>
     )
   }
   ```

2. **注册到路由**

   在 `src/App.jsx` 的 `animations` 数组中添加配置：

   ```js
   import DijkstraAnimation from './animations/dijkstra_animation'

   const animations = [
     // ... 已有动画
     {
       id: 'dijkstra',
       title: 'Dijkstra 最短路径',
       description: '可视化贪心策略下的单源最短路径求解过程。',
       path: '/animations/dijkstra',
       component: DijkstraAnimation,
     },
   ]
   ```

3. **完成**

   首页会自动展示新卡片，路由和导航栏均已配置完毕。

---

## 部署

### 部署到 Cloudflare Pages

#### 方式一：Git 集成（推荐）

1. 将代码推送到 GitHub / GitLab
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Pages**
3. 点击「创建项目」→ 连接 Git 仓库
4. 构建设置：
   - **构建命令**: `npm run build`
   - **输出目录**: `dist`
5. 保存并部署

#### 方式二：Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist
```

> `public/_redirects` 已配置 SPA 路由回退规则，确保刷新页面不会 404。

---

## 已有可视化

| 算法 | 路径 | 说明 |
|------|------|------|
| PageRank | `/animations/pagerank` | 有向图上的 PageRank 迭代传播与收敛过程 |

---

## 贡献

欢迎提交 Issue 或 PR 来添加新的算法可视化！

---

## License

[MIT](LICENSE)
