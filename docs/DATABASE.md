# 数据库配置说明

本项目支持 **SQLite** 和 **PostgreSQL** 两种数据库。

> 注意：Prisma 的 `datasource provider` **不能在运行时通过环境变量切换**，必须在构建镜像（生成 Prisma Client）时确定。
> 因此 Docker 下切换数据库类型的方式是：选择不同的 compose 文件 / build 参数 + 对应的 `DATABASE_URL`。

## 快速选择

| 场景 | 推荐数据库 | 启动方式 |
|------|-----------|---------|
| 本地开发 | SQLite | `npm run dev` |
| Docker 轻量部署 | SQLite | `docker compose -f docker-compose.sqlite.yml up -d` |
| Docker 生产部署 | PostgreSQL | `docker compose up -d` |
| 高并发生产环境 | PostgreSQL | `docker compose up -d` |

---

## 本地开发

### SQLite（推荐）

**优点**: 零配置、轻量、快速启动

```bash
# .env 配置
DATABASE_URL="file:./dev.db"

# 启动
npm install
npm run db:push
npm run dev
```

### PostgreSQL

**优点**: 生产环境一致性

```bash
# 1. 启动本地 PostgreSQL（需要预先安装）
# 2. .env 配置
DATABASE_URL="postgresql://nav:password@localhost:5432/nav"

# 3. 启动
npm install
npm run db:push
npm run dev
```

---

## Docker 部署

### 方式一：SQLite（轻量级，推荐小型项目）

**优点**: 
- 无需额外数据库容器
- 启动快、资源占用少
- 数据文件直接持久化到 volume

**限制**:
- 不适合高并发场景
- 不支持多实例部署

```bash
# 1. 配置 .env
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://your-domain.com

# 2. 启动（使用 SQLite compose 文件）
docker compose -f docker-compose.sqlite.yml up -d

# 3. 查看日志
docker compose -f docker-compose.sqlite.yml logs -f nav
```

**数据持久化**: SQLite 数据库文件存储在 `sqlite-data` volume 中（`/app/data/nav.db`）

---

### 方式二：PostgreSQL（生产推荐）

**优点**:
- 高并发性能好
- 支持多实例部署
- 完整的 ACID 事务支持

**资源需求**: 需要额外的 PostgreSQL 容器（约 50MB 内存）

```bash
# 1. 配置 .env
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://your-domain.com
POSTGRES_PASSWORD=change-this-password  # 建议修改默认密码

# 2. 启动（默认 compose 文件）
docker compose up -d

# 3. 查看日志
docker compose logs -f nav
```

**数据持久化**: PostgreSQL 数据存储在 `postgresql-data` volume 中

---

## 数据库切换

### 从 SQLite 切换到 PostgreSQL

```bash
# 1. 导出现有数据（在后台管理 -> 数据管理）
# 2. 停止 SQLite 容器
docker compose -f docker-compose.sqlite.yml down

# 3. 修改 .env，添加 PostgreSQL 配置
POSTGRES_PASSWORD=your-password

# 4. 启动 PostgreSQL 版本
docker compose up -d

# 5. 导入数据（在后台管理 -> 数据管理）
```

### 从 PostgreSQL 切换到 SQLite

```bash
# 1. 导出现有数据
# 2. 停止 PostgreSQL 容器
docker compose down

# 3. 启动 SQLite 版本
docker compose -f docker-compose.sqlite.yml up -d

# 4. 导入数据
```

---

## 技术实现

### Docker 下如何切换数据库类型？

1. **多 Schema 文件（仅用于构建时选择）**:
   - `prisma/schema.prisma` - SQLite（本地开发默认）
   - `prisma/schema.postgresql.prisma` - PostgreSQL（Docker 生产默认）

2. **Dockerfile 构建参数**:
   - `PRISMA_PROVIDER=sqlite|postgresql`
   - 构建阶段会在 `npm ci` 前把对应 schema 复制到 `prisma/schema.prisma`，确保 `prisma generate` 生成匹配的 Prisma Client

3. **entrypoint 初始化策略**:
   - SQLite（`DATABASE_URL` 以 `file:` 开头）：执行 `prisma db push`
   - PostgreSQL：按迁移目录执行 `prisma migrate deploy`（含 baseline 兼容逻辑）

---

## 常见问题

### 如何查看当前使用的数据库类型？

```bash
# 查看容器环境变量
docker compose exec nav env | grep DATABASE_URL

# SQLite 输出: file:/app/data/nav.db
# PostgreSQL 输出: postgresql://nav:***@postgresql:5432/nav
```

### SQLite 数据文件在哪里？

Docker 环境: `/app/data/nav.db`（映射到 `sqlite-data` volume）
本地开发: `./dev.db`

### 如何备份数据？

**SQLite**:
```bash
# 导出 volume 数据
docker run --rm -v nav_sqlite-data:/data -v $(pwd):/backup ubuntu tar czf /backup/sqlite-backup.tar.gz /data
```

**PostgreSQL**:
```bash
# 使用 pg_dump
docker compose exec postgresql pg_dump -U nav nav > backup.sql
```

**通用方式**（推荐）:
使用后台管理界面的"数据管理"功能导出 JSON 格式数据

### 性能对比

| 指标 | SQLite | PostgreSQL |
|------|--------|-----------|
| 启动时间 | ~2s | ~5s |
| 内存占用 | ~100MB | ~150MB |
| 并发读取 | 优秀 | 优秀 |
| 并发写入 | 一般 | 优秀 |
| 适用场景 | 个人/小团队 | 生产/高并发 |
