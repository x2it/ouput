# Changelog

本项目的所有重要变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.2.0] - 2026-08-13

### 新增：SEO / GEO 深度优化

#### GEO（生成式引擎优化）
- **JSON-LD 结构化数据**：主页注入 Schema.org `@graph`（WebSite + ProfilePage + Person + ItemList），让 Google / Bing / ChatGPT / Perplexity 等引擎能结构化提取站点实体与作品列表
- **动态 OG 分享图**：`opengraph-image.tsx` 运行时生成 1200×630 PNG 分享卡片（跟随白标站名 / Slogan / 作品数）

#### SEO（搜索引擎优化）
- **sitemap.xml**：动态生成站点地图（跟随部署域名，含主页与嵌入页）
- **robots.txt 强化**：禁爬 `/login` 管理入口、引用 sitemap 地址
- **canonical URL**：根布局注入规范链接，防止重复内容
- **Twitter Card**：补充 `summary_large_image` 分享卡片元数据
- **嵌入页 noindex**：`/embed` 页面禁止被搜索引擎收录，避免与主页重复内容

## [1.1.0] - 2026-08-13

### 新增：后台个性化（白标）
- **版权信息配置**：`site_config` 表新增 `copyright_text` 字段，后台「网站设置」可填写自定义版权文本；页脚优先显示自定义版权，留空时自动显示「© 年份 + 站名」
- **登录页白标**：登录页标题由硬编码改为动态读取 `site_name`
- **统一默认配置**：新增 `DEFAULT_CONFIG` 常量，替换 3 处硬编码 fallback（home-client / config/seo / init-config）
- **同步 API**：`/api/config/seo` 返回 `copyright_text`；`init.sql` 与线上表结构同步新增该列

## [1.0.0] - 2026-07-31

### 里程碑：正式版发布

### 新增
- **品牌 Favicon**：添加 7喵仓库品牌图标（SVG + ICO 双格式 + apple-touch-icon）
- **登录页简化**：移除调试入口、公网域名提示、复制链接按钮等与登录无关内容
- **登录页平衡**：保留标题与副标题作为品牌标识，形成简洁而有品牌感的视觉层次

### 安全强化
- **HMAC 签名认证**：将明文 `'authenticated'` cookie 替换为 HMAC-SHA256 签名 token，防止 cookie 被窃取后无限期使用
- **API 鉴权**：为所有写接口（works/POST|PUT|DELETE, config/POST, batch, pin, reorder, init-config, backup, export）添加统一鉴权
- **CORS 白名单**：限制 `Access-Control-Allow-Origin` 为白名单域名，防止任意网站跨域调用
- **安全响应头**：添加 `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`
- **Token 防重放**：HMAC token 包含 nonce + 时间戳 + 签名，防止重放攻击
- **时序攻击防护**：使用 `crypto.timingSafeEqual` 比较 token
- **默认密码警告**：未设置 `ADMIN_PASSWORD` 环境变量时输出醒目警告

### Bug 修复
- **page.tsx 认证验证**：修复使用旧的明文比较，改为调用 `verifyToken()` 进行 HMAC 验证
- **Work interface 类型**：修复 `link`/`image` 字段类型从 `string` 改为 `string | null`
- **embed-content.tsx order 字段**：删除多余的 `order` 字段，统一使用 `sort_order`
- **reorderWorks 性能优化**：从串行逐条 UPDATE 改为 `Promise.all` 并行执行

### 代码质量
- **清理调试日志**：移除 `[DEBUG]` 日志，生产构建移除 `console.log`
- **添加全局错误边界**：创建 `error.tsx`
- **dnd-kit hydration 修复**：使用 ClientOnly 包装解决 SSR/CSR 不一致问题
- **退出功能修复**：多 Set-Cookie 同名覆盖问题

## [0.2.0] - 2026-07-31

### 安全修复
- **HMAC 签名认证**：将明文 `'authenticated'` cookie 替换为 HMAC-SHA256 签名 token，防止 cookie 被窃取后无限期使用
- **API 鉴权**：为所有写接口（works/POST|PUT|DELETE, config/POST, batch, pin, reorder, init-config, backup, export）添加统一鉴权
- **CORS 白名单**：限制 `Access-Control-Allow-Origin` 为白名单域名（`COZE_PROJECT_DOMAIN_DEFAULT` + `localhost`），防止任意网站跨域调用
- **安全响应头**：添加 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **debug 页面保护**：`/debug` 页面和 `/api/auth/debug` 接口要求登录，未授权访问返回 401 或重定向到 `/login`
- **Token 防重放**：HMAC token 包含 8 字节 nonce + 时间戳 + 签名，防止重放攻击
- **时序攻击防护**：使用 `crypto.timingSafeEqual` 比较 token，防止时序攻击
- **默认密码警告**：未设置 `ADMIN_PASSWORD` 环境变量时输出醒目警告日志

### Bug 修复
- **page.tsx 认证验证**：修复 `getAuthFromCookies` 使用旧的明文比较，改为调用 `verifyToken()` 进行 HMAC 验证
- **Work interface 类型**：修复 `home-client.tsx` 和 `embed-content.tsx` 中 `link`/`image` 字段类型从 `string` 改为 `string | null`，与数据库 schema 一致
- **embed-content.tsx order 字段**：删除多余的 `order` 字段，统一使用 `sort_order`
- **embed/page.tsx RawWork 类型**：修复 `link`/`image` 类型不匹配
- **embed-content.tsx href 处理**：修复 `href={work.link}` 当 link 为 null 时的处理，改为 `href={work.link || '#'}`
- **getSupabaseAdmin fallback**：当 `COZE_SUPABASE_SERVICE_ROLE_KEY` 未设置时，输出醒目警告而非静默降级
- **reorderWorks 性能优化**：从串行逐条 UPDATE 改为 `Promise.all` 并行执行，减少数据库请求次数

### 代码质量
- **清理调试日志**：移除 `supabase-client.ts` 中的 `[DEBUG]` 日志
- **生产环境 console 清理**：在 `next.config.ts` 中配置生产构建时移除 `console.log`（保留 `error`/`warn` 用于错误处理）
- **添加全局错误边界**：创建 `error.tsx` 提供友好的错误恢复界面

### 性能优化
- **reorderWorks 并行化**：使用 `Promise.all` 并行执行排序更新，减少总等待时间

## [0.1.0] - 2026-07-03

### 新增
- 初始版本发布
- 基于 Next.js 16 + React 19 + TypeScript 的全栈应用
- Supabase 数据库集成
- 作品管理（增删改查、排序、置顶、批量导入）
- 站点配置管理
- 嵌入页面（支持第三方网站嵌入）
- 登录认证系统
- 响应式设计（移动端/平板/桌面）
- 多主题支持（10+ 种配色方案）

