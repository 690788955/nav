# 工具台优化：从网址导航到工具平台

## TL;DR

> **Quick Summary**: 将现有的 Conan Nav 网址导航系统升级为工具台平台，支持用户收藏工具、点赞工具和反馈、提交结构化反馈建议，同时保持单管理员架构和无需用户登录的轻量设计。
> 
> **Deliverables**:
> - 扩展数据库模型（Site 新增字段 + Feedback 模型 + Tag 模型）
> - 前台新增页面：工具详情页、反馈中心、我的收藏
> - 后台新增功能：反馈管理、标签管理
> - 收藏和点赞功能（localStorage + Server Actions）
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Wave 1 (Schema) → Wave 2 (Actions) → Wave 3 (Frontend) → Wave 4 (Verification)

---

## Context

### Original Request
用户希望将现有的网址导航系统优化为「工具台」，让用户可以收集各种工具，并提供反馈来建议工具如何优化。

### Interview Summary
**Key Discussions**:
- 用户收集模式：无需登录，浏览器本地缓存收藏（localStorage）
- 反馈机制：投票/点赞机制，工具和反馈都能点赞
- 用户认证：保持单管理员架构，不引入用户系统
- 工具元数据扩展（中度）：tags（混合模式）、platforms（多选）、screenshots（多张）、useCases
- 反馈提交：结构化表单（类型+内容+联系方式）
- 反馈展示：独立反馈页面 `/feedback`
- 收藏功能：简单收藏列表，localStorage 存储
- 审核流程：工具需审核，反馈直接公开
- 数据库初始化：Prisma migrate + seed + 旧数据兼容
- Site 模型：保留名称，不重命名为 Tool
- 测试策略：不需要单元测试，通过 Agent QA 场景验证

**Research Findings**:
- 项目使用 Next.js 15 + React 19 + Prisma + shadcn/ui
- 当前数据库：SQLite (dev) / PostgreSQL (prod)
- 现有模型：Category, Site, User, SystemSettings, Visit
- 已有网站收录功能（submitterContact, submitterIp, isPublished）
- 所有 Server Actions 集中在 `lib/actions.ts` (1087 lines)
- 管理后台侧边栏在 `components/admin/admin-sidebar.tsx`
- 前台首页在 `app/(public)/page.tsx`，使用 ISR (revalidate = 10s)

### Metis Review
**Identified Gaps** (addressed):
- SQLite JSON 兼容性：使用 String 字段 + JSON 序列化，Tag 使用关系表
- 点赞防重复：localStorage + IP 基础检查（无需独立 Like 表）
- Site.updatedAt 字段修正：从 `@default(now())` 改为 `@updatedAt`
- Feedback.toolId：必填（必须关联工具）
- useCases：简单 String 字段（文本描述）
- screenshots：URL 输入（管理后台表单）
- 工具详情页 URL：`/tool/[id]`（Site 无 slug）
- 反馈类型枚举：`feature_request` | `bug_report` | `improvement`
- Tag slug 生成：使用 transliteration 库（项目已有）
- 反馈速率限制：IP 限制每天 5 条
- 点赞支持取消：toggle 模式
- 并发点赞：Prisma 原子 increment
- localStorage 边界：try/catch 包裹，降级为内存状态

---

## Work Objectives

### Core Objective
将 Conan Nav 从「网址导航」升级为「工具台」，支持用户收藏、点赞、反馈功能，同时保持轻量化设计（无需用户登录）。

### Concrete Deliverables
- 数据库迁移文件：`prisma/migrations/YYYYMMDDHHMMSS_add_tool_platform_features/migration.sql`
- 新增数据模型：`Feedback`、`Tag`
- 扩展 Site 模型：`tags`、`platforms`、`screenshots`、`useCases`、`likesCount`
- 前台页面：`/tool/[id]`、`/feedback`、`/favorites`
- 后台页面：`/admin/feedback`、`/admin/tags`
- Server Actions：`lib/actions/feedback.ts`、`lib/actions/likes.ts`、`lib/actions/tags.ts`
- 自定义 Hooks：`hooks/use-favorites.ts`、`hooks/use-likes.ts`
- 工具函数：`lib/utils/ip.ts`、`lib/utils/rate-limit.ts`

### Definition of Done
- [ ] `npx prisma migrate dev` 成功执行，现有数据不丢失
- [ ] `npm run db:seed` 填充预设标签和示例数据
- [ ] 前台可以收藏工具、点赞工具、提交反馈、查看反馈
- [ ] 后台可以管理反馈（删除）、管理标签（CRUD + 审核）
- [ ] 所有新增页面响应式设计，符合 shadcn/ui 规范
- [ ] 点赞和反馈有基础速率限制（IP）

### Must Have
- 数据库迁移保证现有数据完整性
- 收藏功能使用 localStorage，无需后端
- 点赞功能防重复（localStorage + IP）
- 反馈直接公开，管理员可删除
- 标签混合管理（官方 + 用户提交审核）
- 工具详情页展示截图轮播、标签、平台、使用场景
- 反馈中心支持筛选（按工具、按类型）和排序（按热度、按时间）

### Must NOT Have (Guardrails)
- ❌ 不引入用户注册/登录系统
- ❌ 不修改现有首页布局和导航结构
- ❌ 不删除或重命名现有数据库列
- ❌ 不修改现有 `lib/actions.ts` 文件（新增 Actions 放在独立文件）
- ❌ 不实现收藏分组/文件夹功能
- ❌ 不实现反馈状态流转（open/closed）
- ❌ 不实现评论区或星级评分
- ❌ 不实现"相关工具"推荐算法
- ❌ 不实现图片上传（仅 URL 输入）
- ❌ 不实现标签层级/父子关系
- ❌ 不实现反馈邮件通知

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO（项目无测试框架）
- **Automated tests**: 不需要单元测试
- **Framework**: N/A
- **Agent QA**: 每个任务必须包含 agent-executed QA 场景

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Database**: Use Bash (sqlite3/psql) — Query tables, assert data integrity

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.

```
Wave 1 (Start Immediately — foundation, 5 parallel):
├── Task 1: Prisma schema 扩展 + 迁移文件生成 [quick]
├── Task 2: 工具函数：IP 获取 + 速率限制 [quick]
├── Task 3: localStorage Hooks：useFavorites [quick]
├── Task 4: localStorage Hooks：useLikes [quick]
└── Task 5: Tag slug 生成工具函数 [quick]

Wave 2 (After Wave 1 — backend actions, 6 parallel):
├── Task 6: Seed 数据更新：预设标签 + 示例工具扩展 (depends: 1) [quick]
├── Task 7: Server Actions：Feedback CRUD (depends: 1, 2) [unspecified-high]
├── Task 8: Server Actions：Like toggle (depends: 1, 2) [quick]
├── Task 9: Server Actions：Tag CRUD + 审核 (depends: 1, 5) [unspecified-high]
├── Task 10: 扩展现有 Site Actions：支持新字段 (depends: 1) [quick]
└── Task 11: API Routes：/api/feedback, /api/likes (depends: 7, 8) [quick]

Wave 3 (After Wave 2 — frontend pages, 5 parallel):
├── Task 12: 工具详情页：/tool/[id] (depends: 3, 4, 10) [visual-engineering]
├── Task 13: 反馈中心页：/feedback (depends: 7, 11) [visual-engineering]
├── Task 14: 我的收藏页：/favorites (depends: 3, 10) [visual-engineering]
├── Task 15: 更新 SiteCard：添加收藏和点赞按钮 (depends: 3, 4) [visual-engineering]
└── Task 16: 反馈提交对话框组件 (depends: 7, 11) [visual-engineering]

Wave 4 (After Wave 2 — admin pages, 3 parallel):
├── Task 17: 后台反馈管理页：/admin/feedback (depends: 7, 11) [unspecified-high]
├── Task 18: 后台标签管理页：/admin/tags (depends: 9) [unspecified-high]
└── Task 19: 更新后台网站表单：新增字段 (depends: 10) [visual-engineering]

Wave FINAL (After ALL tasks — verification, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright skill)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 6-11 → Task 12-19 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

- **1**: — — 6-11, 1
- **2**: — — 7-8, 1
- **3**: — — 12, 14-15, 2
- **4**: — — 12, 15, 2
- **5**: — — 9, 1
- **6**: 1 — —, 2
- **7**: 1, 2 — 11, 13, 16-17, 3
- **8**: 1, 2 — 11, 3
- **9**: 1, 5 — 18, 3
- **10**: 1 — 12, 19, 3
- **11**: 7, 8 — 13, 16-17, 3
- **12**: 3, 4, 10 — —, 3
- **13**: 7, 11 — —, 3
- **14**: 3, 10 — —, 3
- **15**: 3, 4 — —, 3
- **16**: 7, 11 — —, 3
- **17**: 7, 11 — —, 4
- **18**: 9 — —, 4
- **19**: 10 — —, 4
- **F1-F4**: 1-19 — —, FINAL

### Agent Dispatch Summary

- **Wave 1**: 5 tasks → `quick` (all)
- **Wave 2**: 6 tasks → T6 `quick`, T7 `unspecified-high`, T8 `quick`, T9 `unspecified-high`, T10 `quick`, T11 `quick`
- **Wave 3**: 5 tasks → `visual-engineering` (all)
- **Wave 4**: 3 tasks → T17-18 `unspecified-high`, T19 `visual-engineering`
- **Wave FINAL**: 4 tasks → F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high` + `playwright`, F4 `deep`

---

## TODOs

- [x] 1. Prisma schema 扩展 + 迁移文件生成

  **What to do**:
  - 扩展 `Site` 模型，添加新字段：
    - `tags String @default("[]")` — JSON 数组字符串
    - `platforms String @default("[]")` — JSON 数组字符串
    - `screenshots String @default("[]")` — JSON 数组字符串
    - `useCases String?` — 可选文本字段
    - `likesCount Int @default(0)` — 点赞计数
    - 修正 `updatedAt` 从 `@default(now())` 改为 `@updatedAt`
  - 新增 `Feedback` 模型：
    - `id String @id @default(cuid())`
    - `toolId String` — 关联 Site
    - `type String` — 反馈类型（枚举：feature_request, bug_report, improvement）
    - `content String` — 反馈内容
    - `contact String?` — 可选联系方式
    - `likesCount Int @default(0)` — 点赞数
    - `ipAddress String?` — 提交者 IP
    - `isDeleted Boolean @default(false)` — 软删除标记
    - `createdAt DateTime @default(now())`
    - `updatedAt DateTime @updatedAt`
    - 索引：`@@index([toolId])`, `@@index([likesCount])`, `@@index([createdAt])`
    - 关系：`tool Site @relation(fields: [toolId], references: [id], onDelete: Cascade)`
  - 新增 `Tag` 模型：
    - `id String @id @default(cuid())`
    - `name String @unique`
    - `slug String @unique`
    - `isOfficial Boolean @default(false)` — 是否官方预设标签
    - `isApproved Boolean @default(false)` — 用户提交标签是否已审核
    - `createdAt DateTime @default(now())`
    - `updatedAt DateTime @updatedAt`
  - 在 `Site` 模型添加关系：`feedbacks Feedback[]`
  - 运行 `npx prisma migrate dev --name add_tool_platform_features` 生成迁移文件
  - 运行 `npx prisma generate` 更新 Prisma Client

  **Must NOT do**:
  - 不删除或重命名任何现有字段
  - 不修改现有字段的类型或约束
  - 不使用 `Json` 类型（SQLite 兼容性问题），使用 `String` + JSON 序列化

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema 扩展是明确的 additive 操作，无复杂逻辑
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 6-11 (所有依赖 schema 的任务)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `prisma/schema.prisma:13-21` — Category 模型示例（字段定义、索引、关系）
  - `prisma/schema.prisma:23-44` — Site 模型当前结构（需要扩展的模型）
  - `prisma/schema.prisma:86-98` — Visit 模型示例（关系定义、索引、级联删除）

  **External References**:
  - Prisma 文档：https://www.prisma.io/docs/concepts/components/prisma-schema/data-model
  - Prisma 迁移：https://www.prisma.io/docs/concepts/components/prisma-migrate

  **WHY Each Reference Matters**:
  - Category 模型展示了如何定义索引和一对多关系
  - Site 模型是本次扩展的目标，需要添加新字段但保持现有结构
  - Visit 模型展示了 `onDelete: Cascade` 的用法，Feedback 需要相同的级联删除策略

  **Acceptance Criteria**:

  - [ ] 迁移文件生成：`prisma/migrations/YYYYMMDDHHMMSS_add_tool_platform_features/migration.sql`
  - [ ] Prisma Client 更新：`node_modules/.prisma/client/index.d.ts` 包含新字段和模型
  - [ ] 现有数据完整性：运行迁移后，现有 Site/Category/User 数据不丢失

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Schema 迁移成功且不破坏现有数据
    Tool: Bash (sqlite3)
    Preconditions: 现有数据库有至少 1 条 Site 记录
    Steps:
      1. 备份数据库：cp prisma/dev.db prisma/dev.db.backup
      2. 运行迁移：npx prisma migrate dev --name add_tool_platform_features
      3. 检查迁移状态：npx prisma migrate status
      4. 查询新字段：sqlite3 prisma/dev.db "SELECT id, tags, platforms, screenshots, useCases, likesCount FROM Site LIMIT 1;"
      5. 查询现有数据：sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Site;"
    Expected Result: 
      - 迁移状态显示 "All migrations have been applied"
      - 新字段存在且有默认值（tags="[]", platforms="[]", screenshots="[]", useCases=null, likesCount=0）
      - Site 记录数与迁移前一致
    Failure Indicators: 
      - 迁移失败（非零退出码）
      - 新字段不存在
      - Site 记录数减少
    Evidence: .sisyphus/evidence/task-1-schema-migration.txt

  Scenario: Feedback 和 Tag 模型创建成功
    Tool: Bash (sqlite3)
    Preconditions: 迁移已执行
    Steps:
      1. 查询 Feedback 表结构：sqlite3 prisma/dev.db ".schema Feedback"
      2. 查询 Tag 表结构：sqlite3 prisma/dev.db ".schema Tag"
      3. 验证索引：sqlite3 prisma/dev.db ".indexes Feedback"
    Expected Result:
      - Feedback 表包含所有字段（toolId, type, content, contact, likesCount, ipAddress, isDeleted, createdAt, updatedAt）
      - Tag 表包含所有字段（name, slug, isOfficial, isApproved, createdAt, updatedAt）
      - Feedback 有 3 个索引（toolId, likesCount, createdAt）
    Failure Indicators:
      - 表不存在
      - 字段缺失或类型错误
      - 索引缺失
    Evidence: .sisyphus/evidence/task-1-new-models.txt
  ```

  **Evidence to Capture**:
  - [ ] task-1-schema-migration.txt — 迁移命令输出 + 数据完整性检查
  - [ ] task-1-new-models.txt — 新模型表结构和索引验证

  **Commit**: YES
  - Message: `feat(db): add tool platform schema extensions`
  - Files: `prisma/schema.prisma`, `prisma/migrations/*`
  - Pre-commit: `npx prisma generate`

- [x] 2. 工具函数：IP 获取 + 速率限制

  **What to do**:
  - 创建 `lib/utils/ip.ts`：
    - `getClientIp(headers: Headers): string | null` — 从 Next.js headers 获取客户端 IP
    - 优先级：`x-forwarded-for` > `x-real-ip` > `x-client-ip` > fallback
    - 处理多 IP 情况（取第一个）
  - 创建 `lib/utils/rate-limit.ts`：
    - 使用内存 Map 存储 IP 访问记录（简单实现，生产环境可用 Redis）
    - `checkRateLimit(ip: string, key: string, maxRequests: number, windowMs: number): boolean`
    - 返回 true 表示允许，false 表示超限
    - 自动清理过期记录（每小时清理一次）

  **Must NOT do**:
  - 不引入 Redis 或其他外部依赖（保持简单）
  - 不实现复杂的滑动窗口算法（固定窗口即可）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 工具函数逻辑简单，无复杂依赖
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 7, 8 (Feedback 和 Like Actions 需要速率限制)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `lib/utils.ts` — 现有工具函数示例（cn 函数）
  - `middleware.ts:19-21` — 获取 cookie 的 headers 用法示例

  **External References**:
  - Next.js headers API: https://nextjs.org/docs/app/api-reference/functions/headers

  **WHY Each Reference Matters**:
  - `lib/utils.ts` 展示了工具函数的组织方式和导出模式
  - `middleware.ts` 展示了如何从 Next.js request 中获取 headers 和 cookies

  **Acceptance Criteria**:

  - [ ] 文件创建：`lib/utils/ip.ts`, `lib/utils/rate-limit.ts`
  - [ ] IP 获取函数正确处理反向代理场景
  - [ ] 速率限制函数正确计数和过期清理

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: IP 获取函数正确解析 headers
    Tool: Bash (bun)
    Preconditions: 文件已创建
    Steps:
      1. 创建测试脚本 test-ip.ts：
         import { getClientIp } from './lib/utils/ip'
         const headers1 = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
         const headers2 = new Headers({ 'x-real-ip': '9.10.11.12' })
         console.log('Test 1:', getClientIp(headers1)) // Expected: 1.2.3.4
         console.log('Test 2:', getClientIp(headers2)) // Expected: 9.10.11.12
      2. 运行：bun run test-ip.ts
    Expected Result: 输出 "Test 1: 1.2.3.4" 和 "Test 2: 9.10.11.12"
    Failure Indicators: 输出不匹配或抛出错误
    Evidence: .sisyphus/evidence/task-2-ip-test.txt

  Scenario: 速率限制函数正确限流
    Tool: Bash (bun)
    Preconditions: 文件已创建
    Steps:
      1. 创建测试脚本 test-rate-limit.ts：
         import { checkRateLimit } from './lib/utils/rate-limit'
         const ip = '1.2.3.4'
         const key = 'feedback'
         for (let i = 0; i < 7; i++) {
           const allowed = checkRateLimit(ip, key, 5, 60000) // 5 requests per minute
           console.log(`Request ${i+1}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`)
         }
      2. 运行：bun run test-rate-limit.ts
    Expected Result: 前 5 次 ALLOWED，后 2 次 BLOCKED
    Failure Indicators: 限流逻辑错误
    Evidence: .sisyphus/evidence/task-2-rate-limit-test.txt
  ```

  **Evidence to Capture**:
  - [ ] task-2-ip-test.txt — IP 获取函数测试输出
  - [ ] task-2-rate-limit-test.txt — 速率限制函数测试输出

  **Commit**: NO (groups with 1)

- [x] 3. localStorage Hooks：useFavorites

  **What to do**:
  - 创建 `hooks/use-favorites.ts`：
    - `useFavorites()` 返回 `{ favorites: string[], toggleFavorite: (id: string) => void, isFavorite: (id: string) => boolean }`
    - 使用 `useState` + `useEffect` 管理状态
    - localStorage key: `"favorites"`
    - 初始化时从 localStorage 读取，解析 JSON
    - `toggleFavorite` 添加/移除 ID，更新 localStorage
    - 边界处理：localStorage 不可用时降级为内存状态（try/catch）
    - 边界处理：JSON 解析失败时重置为空数组

  **Must NOT do**:
  - 不实现收藏分组/文件夹功能
  - 不实现收藏排序功能
  - 不实现收藏导出功能

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准 React Hook 模式，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 12, 14, 15 (前台页面需要收藏功能)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `hooks/use-poetry-toggle.ts` — 现有 localStorage Hook 示例
  - `hooks/use-toast.ts` — 现有 Hook 导出模式

  **WHY Each Reference Matters**:
  - `use-poetry-toggle.ts` 展示了如何使用 localStorage + useState + useEffect 管理状态
  - `use-toast.ts` 展示了 Hook 的导出和类型定义模式

  **Acceptance Criteria**:

  - [ ] 文件创建：`hooks/use-favorites.ts`
  - [ ] Hook 正确读取和写入 localStorage
  - [ ] 边界情况处理（localStorage 不可用、JSON 解析失败）

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: useFavorites Hook 正常工作
    Tool: Playwright
    Preconditions: 前台首页可访问
    Steps:
      1. Navigate to http://localhost:3000
      2. Execute JS: localStorage.clear()
      3. Execute JS: 
         import { useFavorites } from '@/hooks/use-favorites'
         const { favorites, toggleFavorite, isFavorite } = useFavorites()
         toggleFavorite('test-id-1')
         console.log('Favorites:', favorites)
         console.log('Is Favorite:', isFavorite('test-id-1'))
      4. Execute JS: JSON.parse(localStorage.getItem('favorites'))
    Expected Result: 
      - favorites 数组包含 'test-id-1'
      - isFavorite('test-id-1') 返回 true
      - localStorage 中存储 ["test-id-1"]
    Failure Indicators: Hook 不工作或 localStorage 未更新
    Evidence: .sisyphus/evidence/task-3-favorites-hook.png (screenshot)

  Scenario: localStorage 不可用时降级
    Tool: Playwright
    Preconditions: 前台首页可访问
    Steps:
      1. Navigate to http://localhost:3000
      2. Execute JS: 
         Object.defineProperty(window, 'localStorage', {
           get() { throw new Error('localStorage disabled') }
         })
      3. Execute JS: 
         import { useFavorites } from '@/hooks/use-favorites'
         const { toggleFavorite, favorites } = useFavorites()
         toggleFavorite('test-id-2')
         console.log('Favorites (memory):', favorites)
    Expected Result: Hook 不抛出错误，favorites 在内存中工作
    Failure Indicators: 抛出错误或 Hook 不工作
    Evidence: .sisyphus/evidence/task-3-favorites-fallback.png
  ```

  **Evidence to Capture**:
  - [ ] task-3-favorites-hook.png — Hook 正常工作截图
  - [ ] task-3-favorites-fallback.png — localStorage 不可用降级截图

  **Commit**: NO (groups with 1)

- [x] 4. localStorage Hooks：useLikes

  **What to do**:
  - 创建 `hooks/use-likes.ts`：
    - `useLikes()` 返回 `{ likedSites: Set<string>, likedFeedbacks: Set<string>, toggleLike: (type: 'site' | 'feedback', id: string) => void, isLiked: (type: 'site' | 'feedback', id: string) => boolean }`
    - 使用 `useState` + `useEffect` 管理状态
    - localStorage keys: `"liked-sites"`, `"liked-feedbacks"`
    - 初始化时从 localStorage 读取，解析 JSON 为 Set
    - `toggleLike` 添加/移除 ID，更新 localStorage
    - 边界处理：localStorage 不可用时降级为内存状态
    - 边界处理：JSON 解析失败时重置为空 Set

  **Must NOT do**:
  - 不实现点赞历史记录功能
  - 不实现点赞通知功能

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 与 useFavorites 类似，标准 Hook 模式
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Tasks 12, 15 (前台页面需要点赞功能)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `hooks/use-favorites.ts` — 同类型 Hook（Task 3 创建）
  - `hooks/use-poetry-toggle.ts` — localStorage Hook 示例

  **WHY Each Reference Matters**:
  - `use-favorites.ts` 是同类型 Hook，可以复用大部分逻辑
  - `use-poetry-toggle.ts` 展示了 localStorage 的边界处理模式

  **Acceptance Criteria**:

  - [ ] 文件创建：`hooks/use-likes.ts`
  - [ ] Hook 正确管理 Site 和 Feedback 的点赞状态
  - [ ] 边界情况处理（localStorage 不可用、JSON 解析失败）

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: useLikes Hook 正常工作
    Tool: Playwright
    Preconditions: 前台首页可访问
    Steps:
      1. Navigate to http://localhost:3000
      2. Execute JS: localStorage.clear()
      3. Execute JS:
         import { useLikes } from '@/hooks/use-likes'
         const { toggleLike, isLiked } = useLikes()
         toggleLike('site', 'site-id-1')
         toggleLike('feedback', 'feedback-id-1')
         console.log('Site liked:', isLiked('site', 'site-id-1'))
         console.log('Feedback liked:', isLiked('feedback', 'feedback-id-1'))
      4. Execute JS: 
         console.log('Sites:', JSON.parse(localStorage.getItem('liked-sites')))
         console.log('Feedbacks:', JSON.parse(localStorage.getItem('liked-feedbacks')))
    Expected Result:
      - isLiked 返回 true
      - localStorage 中存储 ["site-id-1"] 和 ["feedback-id-1"]
    Failure Indicators: Hook 不工作或 localStorage 未更新
    Evidence: .sisyphus/evidence/task-4-likes-hook.png

  Scenario: Toggle 点赞（取消点赞）
    Tool: Playwright
    Preconditions: 前台首页可访问
    Steps:
      1. Navigate to http://localhost:3000
      2. Execute JS:
         import { useLikes } from '@/hooks/use-likes'
         const { toggleLike, isLiked } = useLikes()
         toggleLike('site', 'site-id-2')
         console.log('First toggle:', isLiked('site', 'site-id-2')) // true
         toggleLike('site', 'site-id-2')
         console.log('Second toggle:', isLiked('site', 'site-id-2')) // false
    Expected Result: 第一次 toggle 后 isLiked 为 true，第二次 toggle 后为 false
    Failure Indicators: Toggle 不工作
    Evidence: .sisyphus/evidence/task-4-likes-toggle.png
  ```

  **Evidence to Capture**:
  - [ ] task-4-likes-hook.png — Hook 正常工作截图
  - [ ] task-4-likes-toggle.png — Toggle 功能截图

  **Commit**: NO (groups with 1)

- [x] 5. Tag slug 生成工具函数

  **What to do**:
  - 在 `lib/utils.ts` 中添加 `generateTagSlug(name: string): string` 函数
  - 使用项目已有的 `transliteration` 库（package.json 中已安装）
  - 逻辑：
    - 中文转拼音：`transliterate(name)` 
    - 转小写、替换空格为连字符、移除特殊字符
    - 例如："人工智能" → "ren-gong-zhi-neng"，"AI Tools" → "ai-tools"
  - 导出函数供 Tag 管理使用

  **Must NOT do**:
  - 不实现 slug 唯一性检查（由数据库 unique 约束保证）
  - 不实现自定义 slug 编辑功能（自动生成即可）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的字符串处理函数
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 9 (Tag CRUD Actions 需要 slug 生成)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `lib/utils.ts:6-8` — 现有 `cn` 函数示例（工具函数模式）
  - `package.json:55` — transliteration 依赖已安装

  **External References**:
  - transliteration 文档: https://www.npmjs.com/package/transliteration

  **WHY Each Reference Matters**:
  - `lib/utils.ts` 展示了工具函数的组织和导出方式
  - `package.json` 确认 transliteration 库可用，无需额外安装

  **Acceptance Criteria**:

  - [ ] 函数添加到 `lib/utils.ts`
  - [ ] 中文标签正确转换为拼音 slug
  - [ ] 英文标签正确转换为小写连字符格式

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Tag slug 生成正确
    Tool: Bash (bun)
    Preconditions: 函数已添加到 lib/utils.ts
    Steps:
      1. 创建测试脚本 test-tag-slug.ts：
         import { generateTagSlug } from './lib/utils'
         console.log('Test 1:', generateTagSlug('人工智能')) // Expected: ren-gong-zhi-neng
         console.log('Test 2:', generateTagSlug('AI Tools')) // Expected: ai-tools
         console.log('Test 3:', generateTagSlug('前端开发')) // Expected: qian-duan-kai-fa
         console.log('Test 4:', generateTagSlug('Design & UX')) // Expected: design-ux
      2. 运行：bun run test-tag-slug.ts
    Expected Result: 所有输出符合预期格式
    Failure Indicators: 输出不匹配或包含特殊字符
    Evidence: .sisyphus/evidence/task-5-tag-slug-test.txt
  ```

  **Evidence to Capture**:
  - [ ] task-5-tag-slug-test.txt — Slug 生成测试输出

  **Commit**: NO (groups with 1)

- [x] 6. Seed 数据更新：预设标签 + 示例工具扩展

  **What to do**:
  - 更新 `prisma/seed.ts`：
    - 添加预设标签数据（官方标签，`isOfficial: true`, `isApproved: true`）：
      - 设计、开发、AI、效率工具、营销、数据分析、协作、学习、娱乐、其他
    - 为现有示例网站添加 tags、platforms、useCases 数据
    - 例如：GitHub → tags: ["开发"], platforms: ["Web"], useCases: "代码托管和协作开发"
    - 保持现有的 basic/full 模式逻辑
  - 确保 seed 脚本幂等性（已存在的标签不重复创建）

  **Must NOT do**:
  - 不修改现有的分类和网站创建逻辑
  - 不删除现有的 seed 数据

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 数据填充脚本，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: None
  - **Blocked By**: Task 1 (需要 schema 迁移完成)

  **References**:

  **Pattern References**:
  - `prisma/seed.ts:6-26` — 现有分类数据定义
  - `prisma/seed.ts:28-54` — 现有网站数据定义
  - `prisma/seed.ts:195-211` — 分类创建逻辑（幂等性处理）
  - `prisma/seed.ts:220-248` — 网站创建逻辑（幂等性处理）

  **WHY Each Reference Matters**:
  - 现有数据定义展示了数据结构和组织方式
  - 幂等性处理逻辑需要复用到标签创建中

  **Acceptance Criteria**:

  - [ ] 预设标签创建成功（至少 10 个官方标签）
  - [ ] 示例网站扩展了新字段（tags, platforms, useCases）
  - [ ] Seed 脚本可重复运行不报错

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Seed 数据填充成功
    Tool: Bash (sqlite3)
    Preconditions: 迁移已执行
    Steps:
      1. 运行 seed：npm run db:seed
      2. 查询标签数量：sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Tag WHERE isOfficial = 1;"
      3. 查询示例网站的新字段：sqlite3 prisma/dev.db "SELECT name, tags, platforms, useCases FROM Site WHERE name = 'GitHub';"
      4. 重复运行 seed：npm run db:seed
      5. 再次查询标签数量（应该不变）
    Expected Result:
      - 官方标签数量 >= 10
      - GitHub 的 tags 包含 "开发"，platforms 包含 "Web"，useCases 有内容
      - 重复运行后标签数量不变（幂等性）
    Failure Indicators: Seed 失败或数据不符合预期
    Evidence: .sisyphus/evidence/task-6-seed-data.txt
  ```

  **Evidence to Capture**:
  - [ ] task-6-seed-data.txt — Seed 执行输出 + 数据验证

  **Commit**: NO (groups with 2)

- [x] 7. Server Actions：Feedback CRUD

  **What to do**:
  - 创建 `lib/actions/feedback.ts`：
    - `submitFeedback(data: { toolId: string, type: string, content: string, contact?: string })` — 提交反馈
      - 获取客户端 IP（使用 Task 2 的 `getClientIp`）
      - 速率限制检查：每 IP 每天最多 5 条反馈（使用 Task 2 的 `checkRateLimit`）
      - 验证 type 枚举值：`feature_request` | `bug_report` | `improvement`
      - 创建 Feedback 记录
      - 返回 `{ success: boolean, data?: Feedback, error?: string }`
    - `getFeedbacks(params: { toolId?: string, type?: string, page?: number, pageSize?: number, sortBy?: 'likes' | 'time' })` — 获取反馈列表
      - 支持按工具筛选、按类型筛选
      - 支持分页
      - 支持按点赞数或时间排序
      - 过滤 `isDeleted: false`
    - `deleteFeedback(id: string)` — 软删除反馈（管理员）
      - 设置 `isDeleted: true`
      - 需要管理员权限检查（复用现有 auth 逻辑）
    - `likeFeedback(id: string)` — 点赞反馈
      - 原子操作：`prisma.feedback.update({ where: { id }, data: { likesCount: { increment: 1 } } })`
      - 返回更新后的 likesCount

  **Must NOT do**:
  - 不实现反馈状态流转（open/closed）
  - 不实现管理员回复功能
  - 不实现邮件通知

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及多个 CRUD 操作、权限检查、速率限制，逻辑较复杂
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8, 9, 10, 11)
  - **Blocks**: Tasks 11, 13, 16, 17 (API 和前台页面需要这些 Actions)
  - **Blocked By**: Tasks 1, 2 (需要 schema 和工具函数)

  **References**:

  **Pattern References**:
  - `lib/actions.ts:10-26` — getCategories 函数示例（Server Action 模式）
  - `lib/actions.ts:61-103` — getCategoriesWithPagination 示例（分页逻辑）
  - `lib/actions.ts:200-230` — createSite 示例（数据创建和验证）
  - `lib/actions.ts:1050-1070` — 管理员权限检查示例

  **API/Type References**:
  - `prisma/schema.prisma` — Feedback 模型定义（Task 1 创建）
  - `lib/utils/ip.ts` — getClientIp 函数（Task 2 创建）
  - `lib/utils/rate-limit.ts` — checkRateLimit 函数（Task 2 创建）

  **WHY Each Reference Matters**:
  - getCategories 展示了 Server Action 的基本结构和错误处理
  - getCategoriesWithPagination 展示了分页和筛选的实现方式
  - createSite 展示了数据验证和创建的模式
  - 管理员权限检查逻辑需要复用到 deleteFeedback 中

  **Acceptance Criteria**:

  - [ ] 文件创建：`lib/actions/feedback.ts`
  - [ ] submitFeedback 正确创建反馈并应用速率限制
  - [ ] getFeedbacks 正确筛选、分页、排序
  - [ ] deleteFeedback 正确软删除（仅管理员）
  - [ ] likeFeedback 正确原子递增

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 提交反馈成功
    Tool: Bash (curl)
    Preconditions: Server 运行中，至少有 1 个 Site
    Steps:
      1. 获取 Site ID：curl http://localhost:3000/api/sites | jq -r '.data[0].id'
      2. 提交反馈：curl -X POST http://localhost:3000/api/feedback \
         -H "Content-Type: application/json" \
         -d '{"toolId":"<SITE_ID>","type":"feature_request","content":"希望增加暗色模式","contact":"test@test.com"}'
      3. 验证响应：检查 success: true, data.id 存在
    Expected Result: 201 Created, 返回 feedback 对象
    Failure Indicators: 非 201 状态码或 success: false
    Evidence: .sisyphus/evidence/task-7-submit-feedback.txt

  Scenario: 速率限制生效
    Tool: Bash (curl)
    Preconditions: Server 运行中
    Steps:
      1. 连续提交 6 条反馈（同一 IP）
      2. 检查第 6 条的响应状态
    Expected Result: 前 5 条成功，第 6 条返回 429 Too Many Requests
    Failure Indicators: 第 6 条仍然成功
    Evidence: .sisyphus/evidence/task-7-rate-limit.txt

  Scenario: 获取反馈列表（筛选和排序）
    Tool: Bash (curl)
    Preconditions: 已有至少 2 条反馈
    Steps:
      1. 获取所有反馈：curl http://localhost:3000/api/feedback
      2. 按工具筛选：curl http://localhost:3000/api/feedback?toolId=<SITE_ID>
      3. 按类型筛选：curl http://localhost:3000/api/feedback?type=feature_request
      4. 按点赞数排序：curl http://localhost:3000/api/feedback?sortBy=likes
    Expected Result: 所有请求返回 200，数据正确筛选和排序
    Failure Indicators: 筛选或排序不正确
    Evidence: .sisyphus/evidence/task-7-get-feedbacks.txt
  ```

  **Evidence to Capture**:
  - [ ] task-7-submit-feedback.txt — 提交反馈测试
  - [ ] task-7-rate-limit.txt — 速率限制测试
  - [ ] task-7-get-feedbacks.txt — 获取反馈列表测试

  **Commit**: NO (groups with 2)

- [x] 8. Server Actions：Like toggle

  **What to do**:
  - 创建 `lib/actions/likes.ts`：
    - `likeSite(id: string)` — 点赞工具
      - 原子操作：`prisma.site.update({ where: { id }, data: { likesCount: { increment: 1 } } })`
      - 返回更新后的 likesCount
      - 注意：前端用 localStorage 防重复，后端不做重复检查（简化设计）
    - `unlikeSite(id: string)` — 取消点赞工具
      - 原子操作：`prisma.site.update({ where: { id }, data: { likesCount: { decrement: 1 } } })`
      - 防止负数：`Math.max(0, currentCount - 1)`
    - `likeFeedback(id: string)` — 点赞反馈（同上）
    - `unlikeFeedback(id: string)` — 取消点赞反馈（同上）
  - 所有函数返回 `{ success: boolean, likesCount?: number, error?: string }`

  **Must NOT do**:
  - 不实现点赞历史记录
  - 不实现点赞用户列表
  - 不实现点赞通知

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的原子更新操作
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 9, 10, 11)
  - **Blocks**: Task 11 (API Routes 需要这些 Actions)
  - **Blocked By**: Tasks 1, 2 (需要 schema 和工具函数)

  **References**:

  **Pattern References**:
  - `lib/actions.ts:232-260` — updateSite 示例（原子更新操作）
  - `lib/actions/feedback.ts` — likeFeedback 函数（Task 7 创建，可复用逻辑）

  **API/Type References**:
  - `prisma/schema.prisma` — Site 和 Feedback 的 likesCount 字段

  **WHY Each Reference Matters**:
  - updateSite 展示了 Prisma 的 update 操作模式
  - likeFeedback 是同类型操作，可以复用逻辑

  **Acceptance Criteria**:

  - [ ] 文件创建：`lib/actions/likes.ts`
  - [ ] likeSite/unlikeSite 正确原子更新
  - [ ] likeFeedback/unlikeFeedback 正确原子更新
  - [ ] 防止 likesCount 变为负数

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 点赞工具成功
    Tool: Bash (curl)
    Preconditions: Server 运行中，至少有 1 个 Site
    Steps:
      1. 获取 Site ID 和初始 likesCount：curl http://localhost:3000/api/sites | jq -r '.data[0] | "\(.id) \(.likesCount)"'
      2. 点赞：curl -X POST http://localhost:3000/api/likes/site/<SITE_ID>
      3. 验证响应：检查 likesCount 增加 1
      4. 取消点赞：curl -X DELETE http://localhost:3000/api/likes/site/<SITE_ID>
      5. 验证响应：检查 likesCount 减少 1
    Expected Result: 点赞后 +1，取消后 -1
    Failure Indicators: likesCount 不变或变化错误
    Evidence: .sisyphus/evidence/task-8-like-site.txt

  Scenario: 防止负数
    Tool: Bash (curl)
    Preconditions: Server 运行中，有 likesCount = 0 的 Site
    Steps:
      1. 创建新 Site（likesCount 默认 0）
      2. 尝试取消点赞：curl -X DELETE http://localhost:3000/api/likes/site/<NEW_SITE_ID>
      3. 查询 likesCount：curl http://localhost:3000/api/sites/<NEW_SITE_ID> | jq '.data.likesCount'
    Expected Result: likesCount 仍为 0（不变为负数）
    Failure Indicators: likesCount < 0
    Evidence: .sisyphus/evidence/task-8-prevent-negative.txt
  ```

  **Evidence to Capture**:
  - [ ] task-8-like-site.txt — 点赞和取消点赞测试
  - [ ] task-8-prevent-negative.txt — 防止负数测试

  **Commit**: NO (groups with 2)

- [x] 9. Server Actions：Tag CRUD + 审核

  **What to do**:
  - 创建 `lib/actions/tags.ts`：
    - `getTags(params: { isOfficial?: boolean, isApproved?: boolean })` — 获取标签列表
      - 支持筛选官方标签、已审核标签
    - `createTag(data: { name: string, isOfficial?: boolean })` — 创建标签
      - 自动生成 slug（使用 Task 5 的 `generateTagSlug`）
      - 用户创建的标签默认 `isOfficial: false, isApproved: false`
      - 管理员创建的标签可设置 `isOfficial: true, isApproved: true`
    - `updateTag(id: string, data: { name?: string, isOfficial?: boolean, isApproved?: boolean })` — 更新标签（管理员）
      - 如果 name 变更，重新生成 slug
    - `deleteTag(id: string)` — 删除标签（管理员）
    - `approveTag(id: string)` — 审核通过标签（管理员）
      - 设置 `isApproved: true`

  **Must NOT do**:
  - 不实现标签层级/父子关系
  - 不实现标签合并功能
  - 不实现标签使用统计

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及 CRUD + 审核逻辑 + slug 生成
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 10, 11)
  - **Blocks**: Task 18 (后台标签管理页面)
  - **Blocked By**: Tasks 1, 5 (需要 schema 和 slug 生成函数)

  **References**:

  **Pattern References**:
  - `lib/actions.ts:105-145` — createCategory 示例（CRUD 模式）
  - `lib/actions.ts:147-185` — updateCategory 示例
  - `lib/actions.ts:187-198` — deleteCategory 示例
  - `lib/utils.ts` — generateTagSlug 函数（Task 5 创建）

  **WHY Each Reference Matters**:
  - Category CRUD 操作展示了标准的 Server Action CRUD 模式
  - generateTagSlug 用于自动生成 URL 友好的标识符

  **Acceptance Criteria**:

  - [ ] 文件创建：`lib/actions/tags.ts`
  - [ ] getTags 正确筛选标签
  - [ ] createTag 自动生成 slug
  - [ ] updateTag 正确更新（含 slug 重新生成）
  - [ ] deleteTag 正确删除
  - [ ] approveTag 正确审核

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 创建和审核标签
    Tool: Bash (curl + sqlite3)
    Preconditions: Server 运行中，管理员已登录
    Steps:
      1. 创建用户标签：curl -X POST http://localhost:3000/api/tags \
         -H "Content-Type: application/json" \
         -d '{"name":"新标签"}'
      2. 查询标签：sqlite3 prisma/dev.db "SELECT name, slug, isOfficial, isApproved FROM Tag WHERE name = '新标签';"
      3. 审核标签：curl -X PATCH http://localhost:3000/api/tags/<TAG_ID>/approve
      4. 再次查询：sqlite3 prisma/dev.db "SELECT isApproved FROM Tag WHERE id = '<TAG_ID>';"
    Expected Result:
      - 创建后 isApproved = 0
      - 审核后 isApproved = 1
      - slug 自动生成（如 "xin-biao-qian"）
    Failure Indicators: 标签创建失败或审核不生效
    Evidence: .sisyphus/evidence/task-9-tag-crud.txt
  ```

  **Evidence to Capture**:
  - [ ] task-9-tag-crud.txt — 标签 CRUD 和审核测试

  **Commit**: NO (groups with 2)

- [x] 10. 扩展现有 Site Actions：支持新字段

  **What to do**:
  - 修改 `lib/actions.ts` 中的 Site 相关函数：
    - `createSite` — 添加 tags, platforms, screenshots, useCases 参数
    - `updateSite` — 添加 tags, platforms, screenshots, useCases 参数
    - `getSites` — 返回结果包含新字段
    - `getSiteById` — 返回结果包含新字段
  - 注意：tags, platforms, screenshots 存储为 JSON 字符串，需要 `JSON.stringify()` 和 `JSON.parse()`

  **Must NOT do**:
  - 不修改现有函数的核心逻辑
  - 不破坏现有的 API 兼容性

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的字段扩展，不改变核心逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 11)
  - **Blocks**: Tasks 12, 19 (前台详情页和后台表单需要这些字段)
  - **Blocked By**: Task 1 (需要 schema 迁移完成)

  **References**:

  **Pattern References**:
  - `lib/actions.ts:200-230` — createSite 函数（需要扩展）
  - `lib/actions.ts:232-260` — updateSite 函数（需要扩展）
  - `lib/actions.ts:262-280` — getSites 函数（需要扩展）

  **WHY Each Reference Matters**:
  - 这些是需要修改的目标函数，需要添加新字段的处理逻辑

  **Acceptance Criteria**:

  - [ ] createSite 支持新字段
  - [ ] updateSite 支持新字段
  - [ ] getSites 返回新字段
  - [ ] JSON 序列化/反序列化正确

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 创建带新字段的 Site
    Tool: Bash (curl + sqlite3)
    Preconditions: Server 运行中，管理员已登录
    Steps:
      1. 创建 Site：curl -X POST http://localhost:3000/api/sites \
         -H "Content-Type: application/json" \
         -d '{"name":"测试工具","url":"https://test.com","description":"测试","categoryId":"<CAT_ID>","tags":["开发","AI"],"platforms":["Web","Mobile"],"screenshots":["https://test.com/1.png"],"useCases":"测试用例"}'
      2. 查询数据库：sqlite3 prisma/dev.db "SELECT tags, platforms, screenshots, useCases FROM Site WHERE name = '测试工具';"
      3. 通过 API 获取：curl http://localhost:3000/api/sites/<SITE_ID>
    Expected Result:
      - 数据库中 tags/platforms/screenshots 存储为 JSON 字符串
      - API 返回时正确解析为数组
      - useCases 正确存储和返回
    Failure Indicators: JSON 序列化错误或字段缺失
    Evidence: .sisyphus/evidence/task-10-site-new-fields.txt
  ```

  **Evidence to Capture**:
  - [ ] task-10-site-new-fields.txt — 新字段创建和查询测试

  **Commit**: NO (groups with 2)

- [x] 11. API Routes：/api/feedback, /api/likes

  **What to do**:
  - 创建 `app/api/feedback/route.ts`：
    - GET — 调用 `getFeedbacks`，支持查询参数（toolId, type, page, pageSize, sortBy）
    - POST — 调用 `submitFeedback`，从 request body 获取数据
  - 创建 `app/api/feedback/[id]/route.ts`：
    - DELETE — 调用 `deleteFeedback`（管理员）
  - 创建 `app/api/likes/site/[id]/route.ts`：
    - POST — 调用 `likeSite`
    - DELETE — 调用 `unlikeSite`
  - 创建 `app/api/likes/feedback/[id]/route.ts`：
    - POST — 调用 `likeFeedback`
    - DELETE — 调用 `unlikeFeedback`
  - 所有 API 返回统一格式：`{ success: boolean, data?: any, error?: string }`

  **Must NOT do**:
  - 不实现复杂的权限控制（除了 DELETE feedback 需要管理员）
  - 不实现 API 版本控制

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的 API 路由，调用已有 Actions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10)
  - **Blocks**: Tasks 13, 16, 17 (前台和后台页面需要这些 API)
  - **Blocked By**: Tasks 7, 8 (需要 Actions 先创建)

  **References**:

  **Pattern References**:
  - `app/api/visit/route.ts` — 现有 API Route 示例
  - `app/api/settings/route.ts` — GET API 示例
  - `lib/actions/feedback.ts` — submitFeedback 等函数（Task 7 创建）
  - `lib/actions/likes.ts` — likeSite 等函数（Task 8 创建）

  **WHY Each Reference Matters**:
  - 现有 API Routes 展示了 Next.js App Router 的 API 路由模式
  - Actions 是 API 需要调用的后端逻辑

  **Acceptance Criteria**:

  - [ ] 文件创建：`app/api/feedback/route.ts`, `app/api/feedback/[id]/route.ts`, `app/api/likes/site/[id]/route.ts`, `app/api/likes/feedback/[id]/route.ts`
  - [ ] 所有 API 正确调用对应 Actions
  - [ ] 错误处理和响应格式统一

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Feedback API 端点正常工作
    Tool: Bash (curl)
    Preconditions: Server 运行中
    Steps:
      1. POST 提交反馈：curl -X POST http://localhost:3000/api/feedback \
         -H "Content-Type: application/json" \
         -d '{"toolId":"<SITE_ID>","type":"feature_request","content":"测试反馈"}'
      2. GET 获取反馈：curl http://localhost:3000/api/feedback
      3. GET 筛选反馈：curl "http://localhost:3000/api/feedback?toolId=<SITE_ID>&sortBy=likes"
    Expected Result: 所有请求返回 200/201，数据正确
    Failure Indicators: 非 2xx 状态码或数据错误
    Evidence: .sisyphus/evidence/task-11-feedback-api.txt

  Scenario: Likes API 端点正常工作
    Tool: Bash (curl)
    Preconditions: Server 运行中
    Steps:
      1. POST 点赞工具：curl -X POST http://localhost:3000/api/likes/site/<SITE_ID>
      2. DELETE 取消点赞：curl -X DELETE http://localhost:3000/api/likes/site/<SITE_ID>
      3. POST 点赞反馈：curl -X POST http://localhost:3000/api/likes/feedback/<FEEDBACK_ID>
    Expected Result: 所有请求返回 200，likesCount 正确变化
    Failure Indicators: 非 200 状态码或 likesCount 不变
    Evidence: .sisyphus/evidence/task-11-likes-api.txt
  ```

  **Evidence to Capture**:
  - [ ] task-11-feedback-api.txt — Feedback API 测试
  - [ ] task-11-likes-api.txt — Likes API 测试

  **Commit**: YES
  - Message: `feat(api): add feedback, likes, tags server actions`
  - Files: `lib/actions/feedback.ts`, `lib/actions/likes.ts`, `lib/actions/tags.ts`, `lib/actions.ts`, `app/api/feedback/*`, `app/api/likes/*`
  - Pre-commit: `npm run lint`

- [ ] 12. 工具详情页：/tool/[id]

  **What to do**:
  - 创建 `app/(public)/tool/[id]/page.tsx`：
    - 使用 `getSiteById` 获取工具详情
    - 展示：
      - 工具名称、描述、URL
      - 图标（复用 SiteCard 的图标逻辑）
      - 标签（Badge 组件）
      - 平台（Badge 组件，带图标）
      - 使用场景（文本段落）
      - 截图轮播（如果有）— 使用 shadcn/ui Carousel 或简单的图片网格
      - 点赞按钮（使用 Task 4 的 `useLikes` Hook）
      - 收藏按钮（使用 Task 3 的 `useFavorites` Hook）
      - 访问按钮（跳转到工具 URL）
    - 响应式设计：移动端单列，桌面端双列布局
    - 使用 shadcn/ui 组件：Card, Badge, Button, Separator

  **Must NOT do**:
  - 不实现评论区
  - 不实现星级评分
  - 不实现"相关工具"推荐

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端 UI 页面，需要响应式设计和组件组合
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: 提供 shadcn/ui 组件最佳实践和响应式布局指导

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13, 14, 15, 16)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 4, 10 (需要 Hooks 和扩展的 Site Actions)

  **References**:

  **Pattern References**:
  - `components/layout/site-card.tsx` — 工具卡片组件（图标、名称、描述展示）
  - `app/(public)/page.tsx` — 前台首页布局（shadcn/ui 组件使用）
  - `hooks/use-favorites.ts` — 收藏 Hook（Task 3 创建）
  - `hooks/use-likes.ts` — 点赞 Hook（Task 4 创建）

  **API/Type References**:
  - `lib/actions.ts` — getSiteById 函数（Task 10 扩展）

  **WHY Each Reference Matters**:
  - SiteCard 展示了工具信息的展示模式，可以复用图标和描述逻辑
  - 前台首页展示了 shadcn/ui 组件的组合方式
  - Hooks 提供收藏和点赞的状态管理

  **Acceptance Criteria**:

  - [ ] 文件创建：`app/(public)/tool/[id]/page.tsx`
  - [ ] 页面正确展示工具详情
  - [ ] 收藏和点赞按钮正常工作
  - [ ] 响应式设计正确

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 工具详情页正确展示
    Tool: Playwright
    Preconditions: Server 运行中，至少有 1 个 Site（带新字段）
    Steps:
      1. Navigate to http://localhost:3000
      2. Click on first site card
      3. Assert: URL 变为 /tool/[id]
      4. Assert: 页面显示工具名称、描述、标签、平台、使用场景
      5. Assert: 收藏按钮和点赞按钮存在
      6. Take screenshot
    Expected Result: 所有元素正确展示
    Failure Indicators: 页面 404 或元素缺失
    Evidence: .sisyphus/evidence/task-12-tool-detail-page.png

  Scenario: 收藏和点赞按钮交互
    Tool: Playwright
    Preconditions: 工具详情页已打开
    Steps:
      1. Click 收藏按钮
      2. Execute JS: JSON.parse(localStorage.getItem('favorites'))
      3. Assert: 数组包含当前工具 ID
      4. Click 点赞按钮
      5. Assert: 点赞数 +1（页面更新）
      6. Execute JS: JSON.parse(localStorage.getItem('liked-sites'))
      7. Assert: 数组包含当前工具 ID
    Expected Result: 收藏和点赞状态正确更新
    Failure Indicators: localStorage 未更新或页面未响应
    Evidence: .sisyphus/evidence/task-12-interactions.png
  ```

  **Evidence to Capture**:
  - [ ] task-12-tool-detail-page.png — 详情页展示截图
  - [ ] task-12-interactions.png — 交互功能截图

  **Commit**: NO (groups with 3)

- [ ] 13. 反馈中心页：/feedback

  **What to do**:
  - 创建 `app/(public)/feedback/page.tsx`：
    - 使用 `getFeedbacks` 获取反馈列表
    - 顶部：反馈提交按钮（打开 Task 16 的对话框）
    - 筛选器：
      - 按工具筛选（下拉选择，显示所有工具）
      - 按类型筛选（feature_request/bug_report/improvement）
      - 排序方式（按热度/按时间）
    - 反馈列表：
      - 每条反馈显示：工具名、类型标签、内容、点赞数、提交时间
      - 点赞按钮（使用 Task 4 的 `useLikes` Hook）
    - 分页（使用 shadcn/ui Pagination 组件）
    - 空状态：无反馈时显示友好提示
    - 响应式设计

  **Must NOT do**:
  - 不实现反馈状态流转
  - 不实现管理员回复功能
  - 不实现反馈编辑功能

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端列表页面，需要筛选、排序、分页
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 14, 15, 16)
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 11 (需要 Feedback Actions 和 API)

  **References**:

  **Pattern References**:
  - `app/admin/sites/page.tsx` — 后台网站列表页（分页、筛选示例）
  - `components/layout/site-card.tsx` — 卡片展示模式
  - `hooks/use-likes.ts` — 点赞 Hook（Task 4 创建）
  - `lib/actions/feedback.ts` — getFeedbacks 函数（Task 7 创建）

  **WHY Each Reference Matters**:
  - 后台网站列表展示了分页和筛选的实现方式
  - SiteCard 展示了卡片布局模式
  - useLikes Hook 提供点赞状态管理

  **Acceptance Criteria**:

  - [ ] 文件创建：`app/(public)/feedback/page.tsx`
  - [ ] 反馈列表正确展示
  - [ ] 筛选和排序正常工作
  - [ ] 分页正常工作
  - [ ] 点赞按钮正常工作

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 反馈中心页正确展示
    Tool: Playwright
    Preconditions: Server 运行中，至少有 2 条反馈
    Steps:
      1. Navigate to http://localhost:3000/feedback
      2. Assert: 页面显示反馈列表
      3. Assert: 筛选器存在（工具、类型、排序）
      4. Assert: 每条反馈显示工具名、类型、内容、点赞数
      5. Take screenshot
    Expected Result: 所有元素正确展示
    Failure Indicators: 页面 404 或反馈列表为空
    Evidence: .sisyphus/evidence/task-13-feedback-center.png

  Scenario: 筛选和排序功能
    Tool: Playwright
    Preconditions: 反馈中心页已打开
    Steps:
      1. Select 工具筛选器 → 选择特定工具
      2. Assert: 列表只显示该工具的反馈
      3. Select 类型筛选器 → 选择 "feature_request"
      4. Assert: 列表只显示该类型的反馈
      5. Select 排序方式 → "按热度"
      6. Assert: 列表按 likesCount 降序排列
    Expected Result: 筛选和排序正确生效
    Failure Indicators: 筛选或排序不生效
    Evidence: .sisyphus/evidence/task-13-filter-sort.png
  ```

  **Evidence to Capture**:
  - [ ] task-13-feedback-center.png — 反馈中心页截图
  - [ ] task-13-filter-sort.png — 筛选排序功能截图

  **Commit**: NO (groups with 3)

- [ ] 14. 我的收藏页：/favorites

  **What to do**:
  - 创建 `app/(public)/favorites/page.tsx`：
    - 使用 `useFavorites` Hook 获取收藏的工具 ID 列表
    - 使用 `getSites` 获取工具详情（传入 ID 列表）
    - 展示：
      - 收藏的工具列表（复用 SiteCard 组件）
      - 空状态：无收藏时显示友好提示 + "去首页逛逛"按钮
    - 响应式设计：网格布局（同首页）

  **Must NOT do**:
  - 不实现收藏分组/文件夹
  - 不实现收藏排序
  - 不实现收藏导出

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端列表页面，简单的数据展示
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 15, 16)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 10 (需要 useFavorites Hook 和扩展的 Site Actions)

  **References**:

  **Pattern References**:
  - `app/(public)/page.tsx` — 前台首页（工具网格布局）
  - `components/layout/site-card.tsx` — 工具卡片组件
  - `hooks/use-favorites.ts` — 收藏 Hook（Task 3 创建）

  **WHY Each Reference Matters**:
  - 前台首页展示了工具网格布局模式
  - SiteCard 是工具展示的标准组件
  - useFavorites Hook 提供收藏状态管理

  **Acceptance Criteria**:

  - [ ] 文件创建：`app/(public)/favorites/page.tsx`
  - [ ] 收藏列表正确展示
  - [ ] 空状态友好提示
  - [ ] 响应式设计正确

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 我的收藏页正确展示
    Tool: Playwright
    Preconditions: Server 运行中，localStorage 中有收藏的工具 ID
    Steps:
      1. Execute JS: localStorage.setItem('favorites', JSON.stringify(['<SITE_ID_1>', '<SITE_ID_2>']))
      2. Navigate to http://localhost:3000/favorites
      3. Assert: 页面显示 2 个工具卡片
      4. Assert: 卡片内容与收藏的工具匹配
      5. Take screenshot
    Expected Result: 收藏的工具正确展示
    Failure Indicators: 页面 404 或工具列表为空
    Evidence: .sisyphus/evidence/task-14-favorites-page.png

  Scenario: 空状态展示
    Tool: Playwright
    Preconditions: Server 运行中
    Steps:
      1. Execute JS: localStorage.clear()
      2. Navigate to http://localhost:3000/favorites
      3. Assert: 页面显示空状态提示
      4. Assert: "去首页逛逛"按钮存在
      5. Click 按钮
      6. Assert: 跳转到首页
    Expected Result: 空状态友好提示，按钮正常工作
    Failure Indicators: 空状态不显示或按钮不工作
    Evidence: .sisyphus/evidence/task-14-empty-state.png
  ```

  **Evidence to Capture**:
  - [ ] task-14-favorites-page.png — 收藏页面截图
  - [ ] task-14-empty-state.png — 空状态截图

  **Commit**: NO (groups with 3)

- [ ] 15. 更新 SiteCard：添加收藏和点赞按钮

  **What to do**:
  - 修改 `components/layout/site-card.tsx`：
    - 添加收藏按钮（心形图标，使用 `useFavorites` Hook）
    - 添加点赞按钮（拇指图标，使用 `useLikes` Hook）
    - 按钮位置：卡片右上角（CardAction 区域）
    - 按钮状态：
      - 未收藏/未点赞：灰色图标
      - 已收藏/已点赞：彩色图标（红色心形/蓝色拇指）
    - 点击交互：
      - 收藏：toggle localStorage，图标状态切换
      - 点赞：调用 API + toggle localStorage，显示点赞数变化
    - 防止事件冒泡：点击按钮不触发卡片的跳转

  **Must NOT do**:
  - 不修改卡片的核心布局和样式
  - 不添加其他交互功能（如分享、评论）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端组件修改，需要交互逻辑和样式调整
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14, 16)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 4 (需要 Hooks)

  **References**:

  **Pattern References**:
  - `components/layout/site-card.tsx:98-140` — 现有 SiteCard 组件（需要修改）
  - `hooks/use-favorites.ts` — 收藏 Hook（Task 3 创建）
  - `hooks/use-likes.ts` — 点赞 Hook（Task 4 创建）

  **WHY Each Reference Matters**:
  - SiteCard 是需要修改的目标组件
  - Hooks 提供收藏和点赞的状态管理

  **Acceptance Criteria**:

  - [ ] SiteCard 组件添加收藏和点赞按钮
  - [ ] 按钮状态正确切换
  - [ ] 点击不触发卡片跳转
  - [ ] 点赞数实时更新

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: SiteCard 收藏和点赞按钮正常工作
    Tool: Playwright
    Preconditions: Server 运行中，首页有工具卡片
    Steps:
      1. Navigate to http://localhost:3000
      2. Hover over first site card
      3. Assert: 收藏按钮和点赞按钮可见
      4. Click 收藏按钮
      5. Assert: 图标变为彩色（已收藏状态）
      6. Execute JS: JSON.parse(localStorage.getItem('favorites'))
      7. Assert: 数组包含该工具 ID
      8. Click 点赞按钮
      9. Assert: 点赞数 +1
      10. Assert: 图标变为彩色（已点赞状态）
    Expected Result: 收藏和点赞功能正常，状态正确
    Failure Indicators: 按钮不工作或状态不切换
    Evidence: .sisyphus/evidence/task-15-site-card-buttons.png

  Scenario: 防止事件冒泡
    Tool: Playwright
    Preconditions: 首页已打开
    Steps:
      1. Click 收藏按钮
      2. Assert: 页面 URL 仍为首页（未跳转到工具详情页）
      3. Click 点赞按钮
      4. Assert: 页面 URL 仍为首页
    Expected Result: 点击按钮不触发卡片跳转
    Failure Indicators: 页面跳转到详情页
    Evidence: .sisyphus/evidence/task-15-no-bubble.png
  ```

  **Evidence to Capture**:
  - [ ] task-15-site-card-buttons.png — 按钮功能截图
  - [ ] task-15-no-bubble.png — 防止冒泡测试截图

  **Commit**: NO (groups with 3)

- [ ] 16. 反馈提交对话框组件

  **What to do**:
  - 创建 `components/layout/feedback-dialog.tsx`：
    - 使用 shadcn/ui Dialog 组件
    - 表单字段：
      - 工具选择（下拉，显示所有已发布的工具）
      - 反馈类型（单选：功能建议/Bug反馈/体验改进）
      - 反馈内容（Textarea，必填，最多 500 字）
      - 联系方式（Input，可选，最多 100 字）
    - 提交逻辑：
      - 调用 `/api/feedback` POST
      - 成功：显示 toast 提示，关闭对话框，清空表单
      - 失败：显示错误提示（如速率限制）
    - 使用 react-hook-form + zod 验证
  - 在反馈中心页（Task 13）和工具详情页（Task 12）添加触发按钮

  **Must NOT do**:
  - 不实现富文本编辑器
  - 不实现图片上传
  - 不实现反馈草稿保存

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端表单组件，需要验证和交互逻辑
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14, 15)
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 11 (需要 Feedback Actions 和 API)

  **References**:

  **Pattern References**:
  - `components/layout/site-submission-dialog.tsx` — 现有网站提交对话框（表单模式）
  - `components/admin/site-form-dialog.tsx` — 后台网站表单（react-hook-form + zod）
  - `lib/actions/feedback.ts` — submitFeedback 函数（Task 7 创建）

  **WHY Each Reference Matters**:
  - site-submission-dialog 展示了前台表单对话框的实现模式
  - site-form-dialog 展示了 react-hook-form + zod 的使用方式
  - submitFeedback 是表单需要调用的 API

  **Acceptance Criteria**:

  - [ ] 文件创建：`components/layout/feedback-dialog.tsx`
  - [ ] 表单验证正确
  - [ ] 提交成功和失败处理正确
  - [ ] 对话框在反馈中心和工具详情页可触发

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 反馈提交对话框正常工作
    Tool: Playwright
    Preconditions: Server 运行中，反馈中心页已打开
    Steps:
      1. Navigate to http://localhost:3000/feedback
      2. Click "提交反馈"按钮
      3. Assert: 对话框打开
      4. Select 工具 → 选择第一个工具
      5. Select 反馈类型 → "功能建议"
      6. Fill 反馈内容 → "希望增加暗色模式"
      7. Fill 联系方式 → "test@test.com"
      8. Click "提交"按钮
      9. Assert: Toast 提示"提交成功"
      10. Assert: 对话框关闭
    Expected Result: 反馈提交成功，对话框关闭
    Failure Indicators: 提交失败或对话框不关闭
    Evidence: .sisyphus/evidence/task-16-feedback-dialog.png

  Scenario: 表单验证
    Tool: Playwright
    Preconditions: 反馈对话框已打开
    Steps:
      1. Click "提交"按钮（不填写任何字段）
      2. Assert: 显示验证错误提示（工具、类型、内容必填）
      3. Fill 反馈内容 → 超过 500 字的文本
      4. Assert: 显示"不能超过 500 字"错误
    Expected Result: 表单验证正确
    Failure Indicators: 验证不生效或错误提示不显示
    Evidence: .sisyphus/evidence/task-16-validation.png
  ```

  **Evidence to Capture**:
  - [ ] task-16-feedback-dialog.png — 对话框提交截图
  - [ ] task-16-validation.png — 表单验证截图

  **Commit**: YES
  - Message: `feat(ui): add tool detail, feedback center, favorites pages`
  - Files: `app/(public)/tool/*`, `app/(public)/feedback/*`, `app/(public)/favorites/*`, `components/layout/site-card.tsx`, `components/layout/feedback-dialog.tsx`
  - Pre-commit: `npm run lint`

- [ ] 17. 后台反馈管理页：/admin/feedback

  **What to do**:
  - 创建 `app/admin/feedback/page.tsx`：
    - 使用 `getFeedbacks` 获取反馈列表
    - 表格展示：
      - 列：工具名、反馈类型、内容（截断显示）、联系方式、点赞数、提交时间、操作
      - 操作：删除按钮（软删除）
    - 筛选器：
      - 按工具筛选
      - 按类型筛选
      - 按时间范围筛选
    - 分页
    - 批量删除功能（可选）
  - 更新 `components/admin/admin-sidebar.tsx`：
    - 添加"反馈管理"菜单项（图标：MessageSquare）

  **Must NOT do**:
  - 不实现反馈状态流转
  - 不实现管理员回复功能
  - 不实现反馈编辑功能

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 后台管理页面，需要表格、筛选、删除逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 18, 19)
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 11 (需要 Feedback Actions 和 API)

  **References**:

  **Pattern References**:
  - `app/admin/sites/page.tsx` — 后台网站管理页（表格、筛选、分页）
  - `components/admin/admin-sidebar.tsx:37-63` — 侧边栏菜单项定义
  - `lib/actions/feedback.ts` — getFeedbacks, deleteFeedback 函数（Task 7 创建）

  **WHY Each Reference Matters**:
  - 后台网站管理页展示了后台列表页的标准模式
  - 侧边栏菜单项定义展示了如何添加新菜单
  - Feedback Actions 提供数据操作接口

  **Acceptance Criteria**:

  - [ ] 文件创建：`app/admin/feedback/page.tsx`
  - [ ] 侧边栏添加"反馈管理"菜单项
  - [ ] 反馈列表正确展示
  - [ ] 删除功能正常工作
  - [ ] 筛选和分页正常工作

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 后台反馈管理页正确展示
    Tool: Playwright
    Preconditions: Server 运行中，管理员已登录，至少有 2 条反馈
    Steps:
      1. Navigate to http://localhost:3000/admin
      2. Assert: 侧边栏显示"反馈管理"菜单项
      3. Click "反馈管理"
      4. Assert: URL 变为 /admin/feedback
      5. Assert: 表格显示反馈列表
      6. Assert: 每行显示工具名、类型、内容、点赞数、操作按钮
      7. Take screenshot
    Expected Result: 反馈管理页正确展示
    Failure Indicators: 页面 404 或表格为空
    Evidence: .sisyphus/evidence/task-17-admin-feedback.png

  Scenario: 删除反馈功能
    Tool: Playwright
    Preconditions: 反馈管理页已打开
    Steps:
      1. 记录当前反馈数量
      2. Click 第一条反馈的"删除"按钮
      3. Assert: 确认对话框出现
      4. Click "确认"
      5. Assert: Toast 提示"删除成功"
      6. Assert: 反馈数量 -1
      7. Navigate to http://localhost:3000/feedback
      8. Assert: 前台反馈中心不显示已删除的反馈
    Expected Result: 反馈软删除成功，前台不显示
    Failure Indicators: 删除失败或前台仍显示
    Evidence: .sisyphus/evidence/task-17-delete-feedback.png
  ```

  **Evidence to Capture**:
  - [ ] task-17-admin-feedback.png — 反馈管理页截图
  - [ ] task-17-delete-feedback.png — 删除功能截图

  **Commit**: NO (groups with 4)

- [ ] 18. 后台标签管理页：/admin/tags

  **What to do**:
  - 创建 `app/admin/tags/page.tsx`：
    - 使用 `getTags` 获取标签列表
    - 表格展示：
      - 列：标签名、Slug、类型（官方/用户提交）、状态（已审核/待审核）、操作
      - 操作：编辑、删除、审核（仅用户提交的标签）
    - 新增标签按钮（打开对话框）
    - 标签表单对话框：
      - 字段：标签名、是否官方标签（仅管理员可设置）
      - 自动生成 slug（使用 Task 5 的函数）
    - 审核功能：点击"审核通过"按钮，调用 `approveTag`
  - 更新 `components/admin/admin-sidebar.tsx`：
    - 添加"标签管理"菜单项（图标：Tag）

  **Must NOT do**:
  - 不实现标签层级/父子关系
  - 不实现标签合并功能
  - 不实现标签使用统计

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 后台管理页面，需要 CRUD + 审核逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 19)
  - **Blocks**: None
  - **Blocked By**: Task 9 (需要 Tag Actions)

  **References**:

  **Pattern References**:
  - `app/admin/categories/page.tsx` — 后台分类管理页（CRUD 模式）
  - `components/admin/category-form-dialog.tsx` — 分类表单对话框
  - `components/admin/admin-sidebar.tsx:37-63` — 侧边栏菜单项定义
  - `lib/actions/tags.ts` — Tag CRUD Actions（Task 9 创建）

  **WHY Each Reference Matters**:
  - 后台分类管理页展示了后台 CRUD 页面的标准模式
  - 分类表单对话框展示了表单对话框的实现方式
  - Tag Actions 提供数据操作接口

  **Acceptance Criteria**:

  - [ ] 文件创建：`app/admin/tags/page.tsx`
  - [ ] 侧边栏添加"标签管理"菜单项
  - [ ] 标签列表正确展示
  - [ ] CRUD 功能正常工作
  - [ ] 审核功能正常工作

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 后台标签管理页正确展示
    Tool: Playwright
    Preconditions: Server 运行中，管理员已登录，至少有 5 个标签
    Steps:
      1. Navigate to http://localhost:3000/admin
      2. Assert: 侧边栏显示"标签管理"菜单项
      3. Click "标签管理"
      4. Assert: URL 变为 /admin/tags
      5. Assert: 表格显示标签列表
      6. Assert: 每行显示标签名、slug、类型、状态、操作按钮
      7. Take screenshot
    Expected Result: 标签管理页正确展示
    Failure Indicators: 页面 404 或表格为空
    Evidence: .sisyphus/evidence/task-18-admin-tags.png

  Scenario: 创建和审核标签
    Tool: Playwright
    Preconditions: 标签管理页已打开
    Steps:
      1. Click "新增标签"按钮
      2. Fill 标签名 → "测试标签"
      3. Uncheck "官方标签"
      4. Click "创建"
      5. Assert: Toast 提示"创建成功"
      6. Assert: 表格新增一行，状态为"待审核"
      7. Click 该行的"审核通过"按钮
      8. Assert: 状态变为"已审核"
    Expected Result: 标签创建和审核成功
    Failure Indicators: 创建失败或审核不生效
    Evidence: .sisyphus/evidence/task-18-tag-crud.png
  ```

  **Evidence to Capture**:
  - [ ] task-18-admin-tags.png — 标签管理页截图
  - [ ] task-18-tag-crud.png — CRUD 和审核功能截图

  **Commit**: NO (groups with 4)

- [ ] 19. 更新后台网站表单：新增字段

  **What to do**:
  - 修改 `components/admin/site-form-dialog.tsx`：
    - 添加表单字段：
      - 标签（多选，从 `getTags` 获取已审核的标签）
      - 平台（多选：Web/Desktop/Mobile/API）
      - 截图 URL（可添加多个，每个一行输入框）
      - 使用场景（Textarea）
    - 表单提交时，将 tags/platforms/screenshots 转换为 JSON 字符串
    - 表单加载时，将 JSON 字符串解析为数组

  **Must NOT do**:
  - 不实现图片上传功能（仅 URL 输入）
  - 不实现截图预览功能
  - 不修改现有字段的逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 前端表单扩展，需要多选、动态输入框
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 18)
  - **Blocks**: None
  - **Blocked By**: Task 10 (需要扩展的 Site Actions)

  **References**:

  **Pattern References**:
  - `components/admin/site-form-dialog.tsx:52-248` — 现有网站表单（需要扩展）
  - `lib/actions.ts` — createSite, updateSite 函数（Task 10 扩展）
  - `lib/actions/tags.ts` — getTags 函数（Task 9 创建）

  **WHY Each Reference Matters**:
  - site-form-dialog 是需要修改的目标组件
  - Site Actions 提供新字段的后端支持
  - getTags 提供标签选项数据

  **Acceptance Criteria**:

  - [ ] 网站表单添加新字段
  - [ ] 多选和动态输入框正常工作
  - [ ] JSON 序列化/反序列化正确
  - [ ] 表单提交和加载正常

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: 后台网站表单新增字段正常工作
    Tool: Playwright
    Preconditions: Server 运行中，管理员已登录，至少有 3 个标签
    Steps:
      1. Navigate to http://localhost:3000/admin/sites
      2. Click "新增网站"按钮
      3. Fill 基本字段（名称、URL、描述、分类）
      4. Select 标签 → 选择 2 个标签
      5. Select 平台 → 选择 "Web" 和 "Mobile"
      6. Fill 截图 URL → 添加 2 个 URL
      7. Fill 使用场景 → "适合开发者使用"
      8. Click "创建"
      9. Assert: Toast 提示"创建成功"
      10. Navigate to 工具详情页
      11. Assert: 标签、平台、截图、使用场景正确展示
    Expected Result: 新字段创建和展示成功
    Failure Indicators: 创建失败或字段不展示
    Evidence: .sisyphus/evidence/task-19-site-form-new-fields.png

  Scenario: 编辑现有网站的新字段
    Tool: Playwright
    Preconditions: 后台网站列表已打开
    Steps:
      1. Click 第一个网站的"编辑"按钮
      2. Assert: 表单加载现有数据（包括新字段）
      3. Modify 标签 → 添加 1 个新标签
      4. Modify 平台 → 取消选择 "Mobile"
      5. Click "保存"
      6. Assert: Toast 提示"更新成功"
      7. Navigate to 工具详情页
      8. Assert: 修改后的标签和平台正确展示
    Expected Result: 编辑功能正常，新字段更新成功
    Failure Indicators: 编辑失败或更新不生效
    Evidence: .sisyphus/evidence/task-19-edit-site.png
  ```

  **Evidence to Capture**:
  - [ ] task-19-site-form-new-fields.png — 新字段表单截图
  - [ ] task-19-edit-site.png — 编辑功能截图

  **Commit**: YES
  - Message: `feat(admin): add feedback and tag management pages`
  - Files: `app/admin/feedback/*`, `app/admin/tags/*`, `components/admin/site-form-dialog.tsx`, `components/admin/admin-sidebar.tsx`
  - Pre-commit: `npm run lint`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run lint`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(db): add tool platform schema extensions` — prisma/schema.prisma, prisma/migrations/*, lib/utils/*, hooks/*
- **Wave 2**: `feat(api): add feedback, likes, tags server actions` — lib/actions/*, app/api/*
- **Wave 3**: `feat(ui): add tool detail, feedback center, favorites pages` — app/(public)/*, components/layout/*
- **Wave 4**: `feat(admin): add feedback and tag management pages` — app/admin/*, components/admin/*
- **Final**: `chore: final verification and cleanup` — .sisyphus/evidence/*

---

## Success Criteria

### Verification Commands
```bash
# 数据库迁移成功
npx prisma migrate status
# Expected: All migrations have been applied

# Seed 数据填充成功
npm run db:seed
# Expected: 创建预设标签（设计、开发、AI 等）

# 前台页面可访问
curl -I http://localhost:3000/tool/[id]
# Expected: 200 OK

curl -I http://localhost:3000/feedback
# Expected: 200 OK

curl -I http://localhost:3000/favorites
# Expected: 200 OK

# 后台页面可访问（需登录）
curl -I http://localhost:3000/admin/feedback
# Expected: 200 OK (with auth cookie)

curl -I http://localhost:3000/admin/tags
# Expected: 200 OK (with auth cookie)

# API 端点可用
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"toolId":"xxx","type":"feature_request","content":"test"}'
# Expected: 201 Created

curl -X POST http://localhost:3000/api/likes/site/[id]
# Expected: 200 OK, likesCount incremented
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] 数据库迁移不破坏现有数据
- [ ] 前台新增页面响应式设计
- [ ] 后台新增功能集成到侧边栏
- [ ] 收藏和点赞功能正常工作
- [ ] 反馈提交和展示正常
- [ ] 标签管理和审核流程正常
- [ ] 速率限制生效（IP）
- [ ] localStorage 边界情况处理（quota/privacy mode）
