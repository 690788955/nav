# Everisk Nav

一个简洁现代化的网址导航系统，基于 Next.js 15、Prisma 和 shadcn/ui 构建。

[![GitHub stars](https://img.shields.io/github/stars/kenanlabs/nav?style=social)](https://github.com/690788955/nav/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/kenanlabs/nav?style=social)](https://github.com/690788955/nav/network/members)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)


## ✨ 特性

### 前台导航
- 📂 **分类导航** - shadcn/ui Tabs 风格，按类别组织网站
- 🔍 实时搜索 - 毫秒级响应，无需页面跳转
- 📱 响应式设计 - 完美适配移动端
- 🎨 简洁优雅 - 严格遵循 shadcn/ui 设计规范
- 🖼️ 智能图标 - 自动获取网站图标，加载失败时显示首字母
- 🌓 暗黑模式 - 右上角一键切换（支持浅色/深色/跟随系统）
- 📜 **古诗词展示** - 每日诗词自动获取，优雅的竖向排版
- 📝 **网站收录** - 访客可提交网站，管理员审核后发布

### 后台管理
- 📊 数据统计 - 访问频次图表、网站排行
- 🌐 网站管理 - 增删改查、发布状态、图标显示
- 📁 分类管理 - 自定义分类和排序
- 📦 **数据管理** - 导入/导出书签，支持JSON和Chrome书签格式
  - JSON格式：完整数据备份（包含描述、排序、发布状态等所有字段）
  - Chrome书签：浏览器兼容格式（仅包含名称、URL和图标）
- 👤 管理员系统 - 单管理员设计，侧边栏头像直接编辑
- ⚙️ 系统设置 - 网站名称、Logo、Favicon、GitHub链接、ICP备案等
- 📈 访问追踪 - 可开启/关闭的网站访问统计

### 技术亮点
- **单管理员架构** - 无需复杂的用户权限系统
- **动态配置** - 后台实时修改网站设置
- **分页优化** - 所有列表页支持分页
- **类型安全** - 完整的 TypeScript 类型定义，零 any 类型
- **生产环境优化** - 统一日志管理，生产环境静默
- **数据可视化** - 使用 Recharts 展示访问频次统计
- **性能优化** - 数据库索引优化，客户端实时搜索（< 10ms 响应）
- **智能图标** - 用户配置 > 智能 Favicon > 首字母图标（优雅降级）
- **ICP备案支持** - 前台底部可配置显示 ICP 备案号和链接
- **shadcn/ui 最佳实践** - 完整的组件组合模式（Card + CardHeader + CardTitle + CardAction）

## 📸 截图预览

<table>
  <tr>
    <td><img src="screenshots/01-home.png" alt="首页" /></td>
    <td><img src="screenshots/02-search.png" alt="搜索" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/03-dashboard.png" alt="仪表盘" /></td>
    <td><img src="screenshots/04-data.png" alt="编辑管理员信息" /></td>
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


## 🛠️ 技术栈

- **前端**: Next.js 15 (App Router)、React 19、TypeScript
- **UI**: shadcn/ui、Tailwind CSS、Lucide Icons
- **图表**: Recharts
- **后端**: Next.js Server Actions、Prisma ORM
- **数据库**: SQLite（默认）/ PostgreSQL（可选）
- **认证**: 简单 Cookie 认证（单管理员）
- **部署**: Docker、GitHub Actions CI/CD

## 🚀 快速开始

### 本地启动（开发模式）

#### 0）前置条件

- Node.js `>=20`
- npm `>=10`
- Git

可选：
- Docker Desktop（如果你想用 Docker 启动）

---

#### 1）拉取代码并安装依赖

```bash
git clone https://github.com/690788955/nav.git
cd nav
npm install
```

---

#### 2）配置环境变量

```bash
cp .env.example .env
```

最少需要确认这几项：

```bash
# 必填：会话加密密钥
NEXTAUTH_SECRET=your-nextauth-secret-here

# 本地访问地址
NEXTAUTH_URL=http://localhost:3000

# 本地默认使用 SQLite
DATABASE_URL="file:./dev.db"

# 应用端口（可改）
PORT=3000
```

> ⚠️ 注意：`DATABASE_URL` 协议必须与 `prisma/schema.prisma` 里的 `provider` 一致。

---

#### 3）初始化数据库（首次必做）

```bash
# 生成 Prisma Client
npx prisma generate

# 同步 schema + 初始化基础数据（会执行 seed）
npm run db:push
```

如果你想要更多演示数据：

```bash
npm run db:seed:full
```

---

#### 4）启动开发服务

```bash
npm run dev
```

默认访问地址：
- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`
- 健康检查：`http://localhost:3000/api/health`

如果 3000 端口被占用：

```bash
npm run dev -- -p 3010
```

---

#### 5）默认管理员账号

- 邮箱：`admin@example.com`
- 密码：`admin123`

⚠️ 首次登录后请立即修改默认密码。

## 📦 生产部署

### 方式一：Docker Compose（推荐）

仓库已提供完整 Dockerfile（多阶段构建）和 `docker-compose.yml`，支持应用 + 数据库一键启动。

#### 0）服务器前置条件

- Docker Engine `>=24`
- Docker Compose v2（`docker compose version` 可用）
- 服务器放通业务端口（默认 3000）

---

#### 1）准备环境变量

```bash
cp .env.example .env
```

至少修改以下项：

```bash
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://你的域名或IP:3000

# 建议修改默认数据库密码
POSTGRES_PASSWORD=change-this-password
```

可选项（有默认值）：

```bash
POSTGRES_USER=nav
POSTGRES_DB=nav
POSTGRES_PORT=5432
PORT=3000
```

---

#### 2）启动服务

```bash
# 启动（首次会自动拉取镜像）
docker compose up -d

# 查看状态
docker compose ps

# 追踪日志
docker compose logs -f nav
```

访问地址：
- 前台：`http://你的域名或IP:3000`
- 后台：`http://你的域名或IP:3000/admin`
- 健康检查：`http://你的域名或IP:3000/api/health`

---

#### 3）首启行为说明（重要）

`nav` 容器内 `entrypoint.sh` 会自动执行：
1. 检查并执行 Prisma 迁移 / schema 同步
2. 检查管理员是否存在
3. 若未初始化则执行 `seed init`（仅创建管理员账号和系统设置）
4. 最后启动 Next.js 服务

**首次启动后数据库是干净的**——没有预置分类和网站数据。所有分类和网站请通过后台管理界面创建。

如需灌入演示数据（开发/测试用途），可手动执行：

```bash
# 基础演示数据（4 个分类 + 4 个网站）
docker compose exec nav npx tsx prisma/seed.ts basic

# 完整演示数据（10 个分类 + 50+ 网站）
docker compose exec nav npx tsx prisma/seed.ts full
```

首次启动时间会比平时长，属于正常现象。

---

#### 4）升级与回滚

升级：

```bash
docker compose pull
docker compose up -d
```

查看当前镜像与容器状态：

```bash
docker compose ps
docker compose images
```

停止服务：

```bash
docker compose down
```

删除服务 + 数据卷（会删除数据库）：

```bash
docker compose down -v
```

---

#### 5）发布镜像（CI/CD）

本项目当前同时提供两套 CI 方案：

- **GitHub Actions**：推送 tag（`v*.*.*`）后自动构建并发布到 GHCR
  - 镜像地址：`ghcr.io/kenanlabs/nav:latest`
- **GitLab CI**：推送 tag（`v*.*.*`）后自动构建 Docker 镜像，并保存为可下载 artifact（默认不推送到镜像仓库）
  - 说明文档：[`docs/GITLAB_RUNNER.md`](docs/GITLAB_RUNNER.md)

发布新版本：

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

#### 6）部署常见坑（建议先看）

1. `NEXTAUTH_URL` 写错（协议、域名或端口不匹配）会导致登录/回调异常。  
2. `NEXTAUTH_SECRET` 过短或为空会引发会话问题。  
3. `DATABASE_URL` 协议与 Prisma provider 不一致会导致 Prisma 启动失败。  
4. 端口冲突（3000/5432 被占用）会导致容器起不来。  
5. 首次启动数据库初始化未完成前，`/api/health` 可能短暂失败。

### 方式二：使用 PM2 + Nginx

```bash
# 1. 克隆代码
git clone https://github.com/690788955/nav.git
cd nav

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 DATABASE_URL 和 NEXTAUTH_SECRET

# 4. 初始化数据库
npx prisma generate
npm run db:push

# 5. 构建并启动
npm run build
npm start

# 或使用 PM2 管理
npm install -g pm2
pm2 start npm --name "nav" -- start
pm2 startup  # 设置开机自启
pm2 save
```

## ⚙️ 环境变量

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `DATABASE_URL` | 数据库连接串（本地默认 SQLite，Docker 默认 PostgreSQL） | `file:./dev.db` / `postgresql://user:pass@localhost:5432/nav` | ❌（Docker Compose）/ ⚠️（本地可用默认） |
| `NEXTAUTH_SECRET` | 加密密钥 | 随机字符串（`openssl rand -base64 32`） | ✅ |
| `NEXTAUTH_URL` | 应用完整 URL | `http://localhost:3000` 或 `https://your-domain.com` | ✅ |

**Docker 部署**：只需配置 `NEXTAUTH_SECRET`（建议同时设置 `NEXTAUTH_URL`），`DATABASE_URL` 由 compose 自动注入。

**本地开发**：默认可直接使用 `file:./dev.db`，如需换 PostgreSQL 再手动修改 `DATABASE_URL`。

## 📁 项目结构

```
.
├── app/                  # Next.js App Router
│   ├── (public)/         # 前台页面
│   ├── admin/            # 后台管理
│   └── api/              # API 路由
├── components/           # React 组件
│   ├── ui/              # shadcn/ui 组件
│   ├── layout/          # 布局组件
│   │   ├── jinrishici-card.tsx         # 古诗词卡片组件
│   │   └── jinrishici-card-wrapper.tsx # 古诗词卡片包装器（动画）
│   ├── admin/           # 后台组件
│   ├── poetry-toggle.tsx         # 古诗词开关按钮
│   └── theme-provider/  # 主题提供者
├── hooks/
│   └── use-poetry-toggle.ts  # 古诗词显示状态管理 hook
├── lib/                 # 工具函数和 Server Actions
├── prisma/              # 数据库模型和种子数据
├── public/              # 静态资源
└── screenshots/         # 项目截图
```

## 🔄 升级指南

从 **v0.0.8** 开始支持自动数据库迁移（版本化）。

### 从 v0.0.8 升级（含）之后的版本

**Docker**（自动）：
```bash
docker compose pull && docker compose up -d
# entrypoint.sh 自动执行数据库迁移
# ✅ 无需手动操作，安全可靠
```

**npm**：
```bash
git pull && npm install && npm run db:migrate:deploy && npm start
```


---

## 🔧 常见问题

### npx prisma generate 和 npm run db:push 的区别？

- **`npx prisma generate`**：生成 Prisma Client（数据库访问代码），只在 schema 变化时需要
- **`npm run db:push`**：同步数据库结构 + 填充初始数据，首次安装或 schema 变化时需要

**首次安装必须两步都做**。

### 为什么数据库连接失败？

1. `.env` 文件中的 `DATABASE_URL` 协议是否与 `prisma/schema.prisma` 的 `provider` 一致
2. 如果是 SQLite：`dev.db` 文件路径与读写权限是否正常
3. 如果是 PostgreSQL：服务是否启动、账号密码是否正确、数据库是否已创建

### 如何重置管理员密码？

**方法 1**（推荐）：登录后台 → 点击侧边栏头像 → 编辑资料 → 修改密码

**方法 2**：连接数据库删除管理员后重新初始化
```bash
# 1. 连接数据库删除管理员
psql -h localhost -U nav -d nav -c "DELETE FROM \"User\" WHERE email = 'admin@example.com';"

# 2. 重新初始化数据库
npm run db:push
```

### 为什么直接修改数据库后前台不更新？

#### 数据更新流程

1. **后台管理界面操作**（推荐）
   - 在后台添加/修改网站或分类
   - 前台会在 10 秒内自动刷新
   - ✅ **无需重启服务或重新构建**

2. **直接操作数据库**
   - 使用 SQL、Prisma Studio 等工具直接修改数据库
   - 前台**不会立即更新**（缓存有效期 10 秒）
   - ⚠️ **需要等待缓存过期（最多 10 秒）或手动清除**

#### 最佳实践

- ✅ **优先使用后台管理界面**进行所有数据操作
- ✅ 避免直接操作数据库（除非进行批量导入或高级操作）
- ✅ 如果必须直接操作数据库，操作后重启服务以立即生效

### 系统管理页面为什么没有用户管理？

Everisk Nav 采用**单管理员架构**，管理员信息的编辑已集成到侧边栏的头像组件中，设计更加简洁直观。

### 如何备份数据库？

**⚠️ 重要提示**：在执行任何数据库操作前，请务必备份数据库！

#### Docker 环境

```bash
# 1. 停止服务
docker compose down

# 2. 备份数据库（包含所有数据）
docker compose exec postgresql pg_dump -U nav nav > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. 重新启动服务
docker compose up -d
```

#### npm 环境

```bash
# 1. 备份数据库
pg_dump -h localhost -U nav nav > backup_$(date +%Y%m%d_%H%M%S).sql

# 或备份为 Docker 容器的数据卷
docker run --rm -v nav_postgresql_data:/data -v $(pwd):/backup ubuntu tar czf /backup/backup_$(date +%Y%m%d_%H%M%S).tar.gz /data
```

#### 如何恢复备份？

```bash
# Docker 环境
docker compose exec postgresql psql -U nav nav < backup_20260121_143000.sql

# npm 环境
psql -h localhost -U nav nav < backup_20260121_143000.sql
```

#### 备份策略建议

1. **定期自动备份**：使用 cron 定时任务每日备份
2. **异地备份**：将备份文件上传到云存储（S3/OSS）
3. **备份验证**：定期测试备份文件是否可恢复
4. **备份保留**：保留至少 30 天的备份文件

#### 导出数据（不包含访问统计）

如果只需要网站和分类数据（不包含访问统计），可以使用后台的"数据管理"功能：

- 导出为 JSON 格式：包含所有网站、分类、系统设置
- 不包含：访问记录、管理员账号

这适合数据迁移和部分恢复场景。

## 💡 相关资源

- 📘 [完整文档](https://deepwiki.com/kenanlabs/nav)
- 📬 [问题反馈](../../issues)
- 💬 [讨论区](../../discussions)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=kenanlabs/nav&type=date&legend=top-left)](https://www.star-history.com/#kenanlabs/nav&type=date&legend=top-left)

## 🤝 贡献

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 License

MIT

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
