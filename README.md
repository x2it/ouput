# 7喵仓库 🐱📦

一个轻量、美观的个人作品集展示网站。支持拖拽排序、嵌入第三方网站、自定义主题色等特性。

> 作品，即答案。

## ✨ 功能特性

- 🖼️ **作品集展示**：卡片式布局展示个人项目作品
- 🔀 **拖拽排序**：登录后拖拽卡片即可调整作品顺序
- 📌 **置顶功能**：一键置顶重点作品
- 🧩 **嵌入支持**：`/embed` 页面可嵌入任意第三方网站（响应式 + 自动高度）
- 🎨 **主题定制**：支持多种卡片配色主题（colorful / blue / green / dark 等）
- ⚙️ **后台个性化（白标）**：登录后台可配置站点名称、Slogan、SEO 标题/描述、页脚版权信息，开源后一键改成自己的品牌
- 🔒 **安全认证**：HMAC 签名 token、写操作鉴权、CORS 白名单、安全响应头

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| 语言 | TypeScript 5 |
| 数据库 | [Supabase](https://supabase.com) (PostgreSQL) |
| 包管理 | [pnpm](https://pnpm.io) |

## 🚀 本地开发

### 环境要求

- **Node.js ≥ 20**（推荐 24）
- **pnpm ≥ 9**
- **Supabase 账号**（免费额度足够）

### 1. 克隆并安装依赖

```bash
git clone <your-repo-url>
cd <project-dir>
pnpm install
```

### 2. 创建数据库

1. 在 [Supabase](https://supabase.com) 创建一个新项目
2. 打开 **SQL Editor**，粘贴执行 [`public/init.sql`](public/init.sql) 的内容
3. 完成后会创建 `works`（作品表）和 `site_config`（站点配置表）

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，填写真实值：

```bash
cp .env.example .env.local
```

```
# 必填：管理员密码（登录管理后台用）
ADMIN_PASSWORD=请设置一个强密码

# 必填：HMAC 签名密钥（生成登录 token 用，可用 openssl rand -base64 32 生成）
AUTH_SECRET=请生成一个随机字符串

# 必填：Supabase 项目 URL（Dashboard → Settings → API）
COZE_SUPABASE_URL=https://xxxx.supabase.co

# 必填：Supabase 匿名 key（Dashboard → Settings → API → anon public）
COZE_SUPABASE_ANON_KEY=eyJhbGciOi...

# 必填：Supabase service_role key（Dashboard → Settings → API → service_role）
# ⚠️ 该 key 拥有最高权限，仅服务端使用，切勿泄露
COZE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# 可选：公网域名（用于 cookie 域匹配，如 https://your-domain.com）
COZE_PROJECT_DOMAIN_DEFAULT=

# 可选：服务端口（默认 5000）
DEPLOY_RUN_PORT=5000
```

> ⚠️ **安全提醒**：`.env.local` 已被 `.gitignore` 排除，**切勿提交到 Git**。

### 4. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:5000](http://localhost:5000) 访问网站，[http://localhost:5000/login](http://localhost:5000/login) 进入管理后台。

## 🌍 生产部署

### 方式一：Vercel（推荐，免费）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入仓库
3. Framework 选择 **Next.js**
4. 添加环境变量（同 `.env.local` 的 6 个变量）
5. 点击 **Deploy**，完成

### 方式二：自建服务器（Docker / 裸机）

#### 裸机部署

```bash
# 1. 安装依赖
pnpm install

# 2. 构建
pnpm build

# 3. 启动（注意先配置好环境变量）
pnpm start
```

#### Docker 部署

```dockerfile
# Dockerfile
FROM node:24-alpine
WORKDIR /app
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 5000
CMD ["pnpm", "start"]
```

```bash
docker build -t 7miao-warehouse .
docker run -d -p 5000:5000 \
  -e ADMIN_PASSWORD=xxx \
  -e AUTH_SECRET=xxx \
  -e COZE_SUPABASE_URL=xxx \
  -e COZE_SUPABASE_ANON_KEY=xxx \
  -e COZE_SUPABASE_SERVICE_ROLE_KEY=xxx \
  --name 7miao 7miao-warehouse
```

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（热更新） |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm ts-check` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 代码检查 |

## 🧩 嵌入第三方网站

嵌入页地址：`/embed`，支持 URL 参数定制：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `theme` | `colorful` | 卡片主题：colorful/neutral/blue/green/purple/warm/dark/ocean/sunset/neon |
| `cols` | `auto` | 列数：auto(响应式)/1/2/3/4 |
| `gap` | `6` | 卡片间距：2/3/4/5/6/8 |
| `header` | `true` | 是否显示标题区 |
| `footer` | `true` | 是否显示页脚 |
| `limit` | `0` | 作品数量上限（0=全部） |

### 嵌入示例

```html
<iframe
  src="https://your-domain.com/embed?theme=dark&cols=3&header=false"
  width="100%"
  frameborder="0"
  scrolling="no"
></iframe>
```

> 💡 嵌入页内置 `ResizeObserver` + `postMessage` 自动高度同步，无需手动设置 iframe 高度。

## 📁 项目结构

```
src/
├── app/
│   ├── api/                  # API 路由
│   │   ├── auth/            # 认证（login/logout/verify）
│   │   ├── works/           # 作品 CRUD + 排序 + 置顶 + 批量
│   │   ├── config/          # 站点配置
│   │   ├── backup/          # 数据库备份（需登录）
│   │   └── init-config/     # 初始化配置（需登录）
│   ├── embed/               # 嵌入页（第三方网站用）
│   ├── login/               # 登录页
│   ├── page.tsx             # 主页（SSR 预取数据）
│   └── proxy.ts             # 代理中间件（CORS + 安全头）
├── components/ui/           # shadcn/ui 组件
├── storage/database/        # Supabase 数据库操作
└── ...
```

## 📄 环境变量一览

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_PASSWORD` | ✅ | 管理员密码（未设置则禁止登录） |
| `AUTH_SECRET` | ✅ | HMAC token 签名密钥 |
| `COZE_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `COZE_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名 key |
| `COZE_SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 服务端 key（勿泄露） |
| `COZE_PROJECT_DOMAIN_DEFAULT` | ❌ | 公网域名（cookie 域） |
| `DEPLOY_RUN_PORT` | ❌ | 服务端口（默认 5000） |

## 📜 开源许可

本项目基于 MIT 许可证开源，欢迎大家使用、改进、分享。

## 📝 变更日志

版本变更记录见 [CHANGELOG.md](CHANGELOG.md)。
