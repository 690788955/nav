# Ops Nav

一个面向团队与个人使用的现代化网址导航系统，基于 **Next.js 15 + React 19 + Prisma + shadcn/ui** 构建，提供公共导航页、后台管理、数据导入导出、反馈收集、收藏与访问统计等能力。

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 功能概览

### 前台导航

- 分类式网址导航与标签切换
- 站内搜索与快速访问
- 收藏、点赞、反馈提交
- 暗黑模式 / 跟随系统主题
- 古诗词展示与首页内容增强
- 响应式界面，适配桌面端和移动端

### 后台管理

- 仪表盘统计：站点、访问、排行、趋势
- 网站管理：新增、编辑、排序、发布状态控制
- 分类管理：增删改查与排序
- 数据管理：导入 / 导出 JSON 与 Chrome 书签
- 系统设置：站点标题、Logo、Favicon、备案、外链等
- 管理员资料维护与登录认证
- 反馈管理与内容审核

### 工程与部署特性

- TypeScript 严格类型约束
- Prisma ORM，支持 **本地 SQLite** 与 **Docker PostgreSQL**
- Docker 多阶段构建，默认生产镜像使用 PostgreSQL Prisma Client
- 容器首启自动初始化数据库、执行迁移 / 同步并补齐管理员初始数据
- 同时提供 **GitHub Actions** 与 **GitLab CI** 两套工作流

## 截图预览

<table>
  <tr>
    <td><img src="screenshots/01-home.png" alt="首页" /></td>
    <td><img src="screenshots/02-search.png" alt="搜索" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/03-dashboard.png" alt="仪表盘" /></td>
    <td><img src="screenshots/04-data.png" alt="数据管理" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/05-sites.png" alt="网站管理" /></td>
    <td><img src="screenshots/06-category.png" alt="分类管理" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/07-system.png" alt="系统设置" /></td>
    <td><img src="screenshots/08-login.png" alt="登录页" /></td>
  </tr>
</table>

## 技术栈

- **框架**：Next.js 15（App Router）、React 19
- **语言**：TypeScript 5
- **UI**：shadcn/ui、Tailwind CSS、Lucide Icons、Recharts
- **后端**：Next.js Route Handlers / Server Actions
- **数据库**：Prisma ORM + SQLite / PostgreSQL
- **认证**：单管理员 Cookie 登录体系
- **部署**：Docker Compose、GitHub Actions、GitLab CI

## 目录结构

```text
.
├─ app/             # App Router 页面与 API
├─ components/      # 前台、后台与通用 UI 组件
├─ hooks/           # 自定义 Hook
├─ lib/             # 服务、工具函数、业务逻辑
├─ prisma/          # Prisma schema、迁移与 seed
├─ public/          # 静态资源
├─ docs/            # 补充文档
├─ Dockerfile       # 多阶段镜像构建
├─ docker-compose.yml
└─ entrypoint.sh    # 容器启动初始化脚本
```

## 环境要求

### 本地开发

- Node.js `>= 20`
- npm `>= 10`
- Git

### Docker 部署

- Docker Engine `>= 24`
- Docker Compose v2

## 快速开始（本地开发）

### 1. 克隆并安装依赖

```bash
git clone git@gitlab.bangcle.com:junguang.chen/ops_nav.git
cd ops_nav
npm install
```

> `npm install` 会自动触发 `postinstall`，执行 `prisma generate`。

### 2. 配置环境变量

```bash
cp .env.example .env
```

最少需要确认以下配置：

```bash
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
PORT=3000
```

> 本地开发默认使用 SQLite，因此 `DATABASE_URL` 应保持 `file:` 协议。

### 3. 初始化数据库

```bash
npm run db:push
```

`npm run db:push` 会：

- 同步数据库 schema
- 执行基础 seed
- 初始化默认管理员与系统设置（如果数据库为空）

如果你修改了 Prisma schema，仍然可以手动执行：

```bash
npx prisma generate
```

如果你想填充更多演示数据：

```bash
npm run db:seed:full
```

### 4. 启动开发服务

```bash
npm run dev
```

默认访问地址：

- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`
- 健康检查：`http://localhost:3000/api/health`

### 5. 默认管理员账号

- 邮箱：`admin@example.com`
- 密码：`admin123`

首次登录后请立即修改默认密码。

## 常用命令

```bash
npm run dev                # 本地开发
npm run build              # 生产构建
npm start                  # 启动生产服务
npm run lint               # 运行 ESLint
npm run db:push            # 同步 schema 并执行基础 seed
npm run db:seed            # 基础 seed
npm run db:seed:full       # 完整演示数据
npm run db:migrate:deploy  # 生产迁移
npm run db:migrate:dev     # 开发迁移
npm run db:studio          # 打开 Prisma Studio
```

## 数据库策略

本项目采用两套固定运行模式：

- **本地开发（npm）**：SQLite
- **Docker / 生产部署**：PostgreSQL

原因是 Prisma Client 会在构建阶段绑定 `provider`，不能在运行时随意切换。

换句话说：

- 本地 npm 开发默认假设 `prisma/schema.prisma` 使用 SQLite
- Docker 生产镜像默认按 `PRISMA_PROVIDER=postgresql` 构建
- `DATABASE_URL` 必须和当前构建出的 Prisma Client / schema provider 保持一致

相关文档：

- [`docs/DATABASE.md`](docs/DATABASE.md)

## Docker 部署

仓库提供了完整的 `Dockerfile` 与 `docker-compose.yml`。

需要特别注意：

- `Dockerfile` 用于从源码构建镜像
- **默认 `docker-compose.yml` 不会本地 build**，而是直接拉取远程预构建镜像
- 当前 compose 中的应用镜像地址是：`ghcr.nju.edu.cn/690788955/nav`
- 并且配置了 `pull_policy: always`，也就是每次启动都会优先拉最新远程镜像

### 1. 准备环境变量

```bash
cp .env.example .env
```

至少需要配置：

```bash
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://your-domain-or-ip:3000
POSTGRES_PASSWORD=change-this-password
```

可选项：

```bash
POSTGRES_USER=nav
POSTGRES_DB=nav
POSTGRES_PORT=5432
PORT=3000
```

### 2. 启动服务

```bash
docker compose up -d
docker compose ps
docker compose logs -f nav
```

> 如果你希望从当前源码本地构建，而不是拉远程镜像，请使用 `docker build` 自己构建，或改写 compose 文件中的 `image:` / `build:` 配置。

默认 compose 会启动：

- `postgresql`：PostgreSQL 15
- `nav`：Next.js 应用容器

### 3. 首次启动会发生什么

容器内的 `entrypoint.sh` 会自动执行：

1. 检查 `DATABASE_URL` 与 Prisma provider 是否匹配
2. PostgreSQL 下执行 `migrate deploy` 或 `db push` + baseline 兼容处理
3. 检查管理员是否存在
4. 如未初始化则执行 `seed init`
5. 启动 Next.js 服务

这意味着你不需要手动在容器内先跑一遍初始化命令。

### 4. 演示数据导入

```bash
docker compose exec nav npx tsx prisma/seed.ts basic
docker compose exec nav npx tsx prisma/seed.ts full
```

### 5. 升级 / 回滚

```bash
docker compose pull
docker compose up -d

docker compose down
docker compose down -v  # 会删除数据库卷
```

> 当前 `docker-compose.yml` 默认使用远程镜像地址，并且等价于部署远程 `latest`。如果你是从 GitLab CI 下载的本地镜像 artifact 部署，请把 compose 中的 `image:` 改成你本地 `docker load` 后的标签；如果你希望部署固定版本，也应该显式改成具体 tag，而不是继续使用默认的未固定镜像。

## CI / CD 说明

### GitHub Actions

仓库保留了 GitHub Actions Docker 发布流程：

- 触发条件：推送 tag `v*.*.*`
- 行为：构建 Docker 镜像并发布到 GHCR

注意：GitHub Actions 发布目标是 `ghcr.io`，而默认 `docker-compose.yml` 当前使用的是 `ghcr.nju.edu.cn` 地址。README 这里只说明“存在 GitHub 发布流程”，不应把这两个地址理解成完全相同的拉取端点。

### GitLab CI

仓库新增了 GitLab CI 工作流，适合**暂时没有镜像仓库**的场景：

- 触发条件：推送 tag `v*.*.*`
- 行为：构建 Docker 镜像，执行 `docker save`，并把镜像包上传为 GitLab artifact
- 产物示例：
  - `nav-v1.0.0.tar.gz`
  - `nav-v1.0.0.tar.gz.sha256`

相关文档（用于 Runner 配置与 artifact 下载/加载）：

- [`docs/GITLAB_RUNNER.md`](docs/GITLAB_RUNNER.md)

## GitLab Runner 快速说明

如果你要跑 `.gitlab-ci.yml`，推荐：

- 使用 **GitLab Runner + Docker executor**
- 在 `/etc/gitlab-runner/config.toml` 中开启 `privileged = true`
- 让 Runner 具备 Docker in Docker 能力

详细安装、注册、artifact 下载与 `docker load` 步骤请看：

- [`docs/GITLAB_RUNNER.md`](docs/GITLAB_RUNNER.md)

## 验证与排错

### 代码校验

```bash
npm run lint
npm run build
```

### 常见问题

#### 1. 为什么本地 build 会提示 `DATABASE_URL`？

项目中的部分页面在构建阶段会触发数据库相关逻辑（例如 sitemap 或系统设置读取）。

因此建议你：

- 本地开发时始终准备好 `.env`
- 使用 SQLite 开发时保持 `DATABASE_URL="file:./dev.db"`
- 如果你改成 PostgreSQL 构建或运行，也要同步保证 Prisma provider 与 `DATABASE_URL` 协议一致

否则即使构建最终成功，也可能在构建日志里看到 Prisma 初始化错误提示。

#### 2. 为什么 Docker 启动时报 provider 不匹配？

因为 Prisma 的 `provider` 在镜像构建时就已经确定。Docker 生产默认使用 `PRISMA_PROVIDER=postgresql`；本地 npm 开发默认是 SQLite。

#### 3. 为什么 GitLab CI 不推镜像仓库？

这是当前设计选择：先产出本地可下载镜像 artifact，等你后续接入 Harbor、Docker Hub 或 GitLab Container Registry 后，再改成 push。

## 补充文档

- [`docs/DATABASE.md`](docs/DATABASE.md) — 解释 SQLite / PostgreSQL 双模式、Prisma provider 锁定和构建期数据库选择
- [`docs/GITLAB_RUNNER.md`](docs/GITLAB_RUNNER.md) — 解释 GitLab Runner 注册、`privileged` 配置以及本地镜像 artifact 的下载与 `docker load` 使用方式

## License

MIT
