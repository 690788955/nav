# 数据库配置说明

本项目采用两套固定运行方式：

- **本地开发（npm）**：SQLite
- **Docker 生产部署**：PostgreSQL

> 注意：Prisma 的 `datasource provider` **不能在运行时通过环境变量切换**，必须在构建镜像（生成 Prisma Client）时确定。
> 因此 Docker 下切换数据库类型的方式是：选择不同的 compose 文件 / build 参数 + 对应的 `DATABASE_URL`。

## 快速选择

| 场景 | 数据库 | 启动方式 |
|------|--------|---------|
| 本地开发 | SQLite | `npm run dev` |
| Docker 生产部署 | PostgreSQL | `docker compose up -d` |

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

## Docker 部署

### PostgreSQL（生产推荐）

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

# 2. 启动（默认 compose 文件，直接拉取 PostgreSQL 版本镜像）
docker compose up -d

# 3. 查看日志
docker compose logs -f nav
```

**数据持久化**: PostgreSQL 数据存储在 `postgresql-data` volume 中

---

## 技术实现

### 为什么本地和 Docker 用不同数据库？

1. **多 Schema 文件（仅用于构建时选择）**:
   - `prisma/schema.prisma` - SQLite（本地开发默认）
   - `prisma/schema.postgresql.prisma` - PostgreSQL（Docker 生产默认）

2. **Docker 运行策略**:
   - `docker-compose.yml`：直接拉取 CI 发布好的 PostgreSQL 镜像（`ghcr.io/690788955/nav:latest`）

3. **Dockerfile 构建参数**:
   - `PRISMA_PROVIDER=sqlite|postgresql`
   - 默认：`postgresql`
   - 构建阶段会在 `npm ci` 前把对应 schema 复制到 `prisma/schema.prisma`，确保 `prisma generate` 生成匹配的 Prisma Client

4. **entrypoint 初始化策略**:
   - SQLite（`DATABASE_URL` 以 `file:` 开头）：执行 `prisma db push`
   - PostgreSQL：按迁移目录执行 `prisma migrate deploy`（含 baseline 兼容逻辑）

---

## 常见问题

### 如何查看当前使用的数据库类型？

```bash
# 查看容器环境变量
docker compose exec nav env | grep DATABASE_URL

# PostgreSQL 输出: postgresql://nav:***@postgresql:5432/nav
```

### SQLite 数据文件在哪里？

本地开发: `./dev.db`

### 如何备份数据？

**PostgreSQL**:
```bash
# 使用 pg_dump
docker compose exec postgresql pg_dump -U nav nav > backup.sql
```

**通用方式**（推荐）:
使用后台管理界面的"数据管理"功能导出 JSON 格式数据

### 使用建议

- 本地开发：始终使用 SQLite，简单、零配置
- 生产部署：始终使用 Docker + PostgreSQL，和 CI 发布镜像保持一致
