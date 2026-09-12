# 雷区 · leiqu.org · 看见真实，提前避坑

面向国内用户的避雷互助社区（域名 **leiqu.org**）。用户可以记录自己看到或经历的不公平事情（租房、饮食、旅游、求职、购物、教培、医疗、金融、装修等），提醒他人提前规避风险；已经踩坑的，也能在「维权指南」里找到可执行的投诉渠道、法律依据和沟通话术。

## 功能

- **避雷帖 + 板块分类**：10 个生活场景板块，帖子包含商家、地区、风险等级、涉及金额、标签等结构化信息。
- **搜索 / 筛选 / 排序**：关键词搜索，按板块、地区、风险等级筛选，支持最新、最多浏览、最多赞同、金额最高排序与分页。
- **互动**：点赞、收藏（基于匿名 `client_id` Cookie 去重）、评论。
- **维权指南**：处理步骤、投诉渠道、法律依据、可一键复制的沟通话术模板。
- **发帖**：无需登录，填写结构化表单即可曝光，含服务端校验。

## 技术栈

- [React Router 7](https://reactrouter.com/)（SSR / 框架模式）
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173 即可。本地使用 D1 的本地存储（`.wrangler/state`）。

> 首次访问时应用会自动建表并写入演示数据，无需手动执行迁移，开箱即用。

## 目录结构

```
app/
  components/          # 通用组件（头部、页脚、帖子卡片、互动条、分页等）
  lib/
    site.ts            # 站点配置（品牌名、域名 leiqu.org、tagline）
    meta.ts            # SEO 元信息构造（title/description/canonical/og）
    types.ts           # 类型与展示辅助函数
    db.server.ts       # D1 查询封装 + 自动建表/播种
    client-id.server.ts# 匿名身份 Cookie
  routes/
    home.tsx           # 首页
    posts.tsx          # 避雷墙（搜索/筛选/排序/分页）
    post.tsx           # 帖子详情 + 评论
    submit.tsx         # 我要曝光
    guides.tsx         # 维权指南列表
    guide.tsx          # 维权指南详情
    api.reactions.tsx  # 点赞 / 收藏接口
    sitemap.tsx        # 动态 sitemap.xml
  root.tsx             # 全局布局
  routes.ts            # 路由配置
migrations/
  0001_init.sql        # 表结构
  0002_seed.sql        # 演示数据
public/
  robots.txt           # 指向 https://leiqu.org/sitemap.xml
workers/app.ts         # Worker 入口
```

## 域名与 SEO

- 站点品牌与域名集中在 `app/lib/site.ts`，改域名只需改这一处。
- 每个页面都会输出 `title`、`description`、`canonical`、Open Graph 标签（由 `app/lib/meta.ts` 统一生成）。
- 动态 `sitemap.xml` 自动收录首页、板块页、帖子与指南详情页；`robots.txt` 已指向该 sitemap。
- 响应头为 `text/html; charset=utf-8`，保证中文正确解析。

## 响应式

界面基于 Tailwind 移动优先设计：手机端单列布局、可横向滚动的导航与筛选条、折叠式搜索框；平板与桌面端自动切换为多列网格与侧边栏。

## 数据库

表结构见 `migrations/0001_init.sql`：`categories`、`posts`、`comments`、`reactions`、`guides`。

### 本地开发

应用会自动初始化，无需额外操作。也可手动执行迁移：

```bash
npm run db:migrate:local
```

### 生产部署

1. 创建 D1 数据库：

   ```bash
   npx wrangler d1 create liequ-db
   ```

2. 将输出的 `database_id` 填入 `wrangler.json` 的 `d1_databases[0].database_id`（当前为占位符）。

3. 应用迁移并部署：

   ```bash
   npm run db:migrate
   npm run deploy
   ```

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run typecheck` | 生成路由类型并做类型检查 |
| `npm run cf-typegen` | 生成 Cloudflare 绑定类型 |
| `npm run db:migrate` | 对远程 D1 应用迁移 |
| `npm run deploy` | 部署到 Cloudflare Workers |

## 说明

- 未接入账号体系，点赞/收藏通过匿名 Cookie 记录，评论与发帖默认匿名。
- 平台内容为用户自发分享，仅供参考，不构成法律意见。

> 需要 Node.js 22+ 才能运行 `wrangler` 相关命令（迁移、部署、类型生成）。开发服务器与构建在 Node 20 下也可运行。
