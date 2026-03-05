## Task 5: Tag Slug 生成工具函数 (2026-03-05)

### 实现模式
- transliterate(name) 接受纯字符串参数（非对象），直接调用即可
- 处理管道：中文→拼音 → 转小写 → 空格→连字符 → 去除特殊字符 → 合并/修剪连字符
- 函数添加位置：lib/utils.ts，与 cn 函数同文件

### transliteration 库用法
- 版本：v2.6.0（package.json line 55）
- 导入：import { transliterate } from 'transliteration'
- 调用：transliterate(name) — 字符串输入，字符串输出
- 中文"人工智能"→"ren gong zhi neng"（词间有空格，需后续 replace 处理）

### Slug 正则管道（顺序重要）
1. toLowerCase() — 统一小写
2. replace(/\s+/g, '-') — 空格→连字符（包括拼音词间空格）
3. replace(/[^\w-]/g, '') — 去除 & 等特殊字符
4. replace(/-+/g, '-') — 合并连续连字符
5. replace(/^-+|-+$/g, '') — 修剪首尾连字符

### 测试结果（全部通过）
- "人工智能" → "ren-gong-zhi-neng" PASS
- "AI Tools" → "ai-tools" PASS
- "前端开发" → "qian-duan-kai-fa" PASS
- "Design & UX" → "design-ux" PASS

### 注意事项
- 不需要唯一性检查，由数据库 unique 约束保证
- 测试脚本：test-tag-slug.js（项目根目录）
- 证据文件：.sisyphus/evidence/task-5-tag-slug-test.txt


## Task 2: IP Extraction & Rate Limiting (2026-03-05)

### IP Extraction Pattern
- Function: `getClientIp(headers: Headers): string | null`
- Priority order: `x-forwarded-for` > `x-real-ip` > `x-client-ip` > `null`
- Handles multiple IPs in `x-forwarded-for` by splitting on comma and taking first
- All operations wrapped in try/catch, returns null on error
- Location: `lib/utils/ip.ts`

### Rate Limiting Implementation
- Function: `checkRateLimit(ip: string, key: string, maxRequests: number, windowMs: number): boolean`
- Data structure: In-memory `Map<string, RateLimitRecord>` with `count` and `resetTime`
- Fixed-window algorithm: resets counter when `resetTime < now`
- Auto-cleanup: `setInterval` every 1 hour with `.unref()` to prevent blocking process exit
- Returns `true` = allowed, `false` = rate limited
- Fails open (returns `true`) on error
- Location: `lib/utils/rate-limit.ts`

### Test Results (All Pass)
- IP extraction: x-forwarded-for (1.2.3.4), x-real-ip (9.10.11.12), no headers (null) ✅
- Rate limiting: 5 requests allowed, requests 6-7 blocked ✅
- Evidence: `.sisyphus/evidence/task-2-ip-test.txt`, `.sisyphus/evidence/task-2-rate-limit-test.txt`

### Edge Cases Handled
- Multiple IPs in x-forwarded-for header (takes first after trim)
- Missing headers (returns null)
- Rate limit window expiration (auto-reset)
- Process exit (setInterval.unref() prevents hanging)
- Error conditions (try/catch with safe defaults)

### Notes
- No external dependencies (in-memory only, no Redis)
- Simple fixed-window is sufficient for this use case
- Both utilities follow existing project patterns (error handling, TypeScript strict mode)

## Task 4: useLikes Hook (2026-03-06)

### Implementation Pattern
- Hook: `useLikes()` manages liked sites and feedbacks via localStorage
- State: Two separate `Set<string>` for O(1) lookup performance
- localStorage keys: `"liked-sites"`, `"liked-feedbacks"` (stored as JSON arrays)
- Location: `hooks/use-likes.ts`

### Hook API
- Returns: `{ likedSites: Set<string>, likedFeedbacks: Set<string>, toggleLike, isLiked, mounted }`
- `toggleLike(type: 'site' | 'feedback', id: string)` — add/remove ID from Set, persist to localStorage
- `isLiked(type: 'site' | 'feedback', id: string): boolean` — O(1) lookup
- `mounted: boolean` — indicates initialization complete

### Edge Cases Handled
- localStorage unavailable (privacy mode, quota exceeded) — fallback to memory state
- JSON parse failure — reset to empty Set
- localStorage write failure during toggle — keep state in memory
- Initialization wraps all operations in try/catch

### Implementation Details
- Initialize from localStorage on mount (parse JSON array → convert to Set)
- Convert Set to array for JSON serialization (Set not JSON-serializable)
- Separate try/catch for each localStorage operation (read/write)
- Follows existing pattern from `use-poetry-toggle.ts`
- No external dependencies, pure React hooks

### Testing Notes
- LSP diagnostics: clean (no errors/warnings)
- Ready for integration with site/feedback components

## Task 9: Tag Server Actions (2026-03-06)

### 文件与职责
- 新增文件：`lib/actions/tags.ts`
- 使用 `"use server"`，集中实现 Tag CRUD + 审核动作
- Prisma 导入路径统一为 `@/lib/prisma`

### 核心实现模式
- `getTags(params)`：支持可选过滤 `isOfficial` / `isApproved`，按 `name asc` 排序
- `createTag(data)`：统一通过 `generateTagSlug(name)` 生成 slug
  - 非管理员创建：强制 `isOfficial=false`、`isApproved=false`
  - 管理员创建：允许传入并设置 `isOfficial`/`isApproved`
- `updateTag(id, data)`：管理员限定；name 变化时自动重算 slug
- `deleteTag(id)`：管理员限定，硬删除
- `approveTag(id)`：管理员限定，仅更新 `isApproved=true`

### 鉴权实现
- 复用现有 cookie 约定：`user_id` + `user_role`
- 新增 `isAdminUser()`：先校验 cookie，再回查 DB 的 `user.role` 双重确认 ADMIN

### 与已有约束保持一致
- slug 唯一冲突不做手工去重，交由数据库 unique 约束处理
- 不引入标签层级、合并、统计等额外逻辑

## Task 7: Feedback Server Actions CRUD (2026-03-06)

### Implemented File
- Created `lib/actions/feedback.ts` with four server actions: `submitFeedback`, `getFeedbacks`, `deleteFeedback`, `likeFeedback`
- File uses `"use server"` and unified return shape: `{ success: boolean, data?: any, error?: string }`

### submitFeedback Pattern
- Uses `headers()` from `next/headers` + `getClientIp(headers)` from `lib/utils/ip.ts`
- Rate-limit enforced with exact call: `checkRateLimit(ip, 'feedback', 5, 86400000)`
- Validates feedback type enum strictly: `feature_request | bug_report | improvement`
- Persists: `toolId`, `type`, `content`, optional `contact`, `ipAddress`

### getFeedbacks Pattern
- Params: `{ toolId?, type?, page?, pageSize?, sortBy?: 'likes' | 'time' }`
- Base filter: `isDeleted: false`; optional `toolId` and `type`
- Sort mapping: `likes -> { likesCount: 'desc' }`, `time -> { createdAt: 'desc' }`
- Pagination via `skip/take`, plus total count with `Promise.all`
- Includes tool relation with site name (`tool: { select: { id, name } }`)

### deleteFeedback Pattern
- Admin-only via cookie-backed guard (`user_id`, `user_role`) + DB role verification
- Soft delete only (`isDeleted: true`), no hard delete

### likeFeedback Pattern
- Uses Prisma atomic increment for concurrency safety:
  - `data: { likesCount: { increment: 1 } }`

### Verification
- LSP diagnostics on changed file (`lib/actions/feedback.ts`): clean
- Build: `npm run build` passed (project has pre-existing unrelated lint warnings)

## Task 15: SiteCard 收藏/点赞按钮集成 (2026-03-06)

### 组件改造模式
- 文件：`components/layout/site-card.tsx`
- 保持卡片主布局不变，仅在 `CardAction` 顶部右侧动作区追加交互按钮
- 使用 `mounted` 门控交互区渲染，避免 localStorage 初始化导致 SSR hydration mismatch

### Hook 接入约定
- 收藏：`useFavorites` 为默认导出，使用 `toggleFavorite(site.id)` / `isFavorite(site.id)`
- 点赞：`useLikes` 为具名导出，使用 `toggleLike('site', site.id)` / `isLiked('site', site.id)`
- 交互按钮点击均需 `e.preventDefault()` + `e.stopPropagation()`，避免触发卡片外链跳转

### 点赞计数与服务端同步
- UI 显示 `site.likesCount` 的本地状态镜像（`likesCount`）
- 点赞按钮采用 optimistic update：先本地 `toggleLike` + 计数增减，再调用 `/api/likes/site/${site.id}`
- 请求方法：点赞 `POST`，取消点赞 `DELETE`
- API 失败时执行本地回滚（恢复 liked 状态与计数）

### 视觉状态规则
- Heart 未激活：灰色；激活：`fill-red-500 text-red-500`
- ThumbsUp 未激活：灰色；激活：`fill-blue-500 text-blue-500`
- 点赞数与点赞激活色同步（激活蓝色，未激活灰色）

## Task 14: 我的收藏页面 (2026-03-06)

### 页面实现模式
- 新增客户端页面：`app/(public)/favorites/page.tsx`，必须使用 `"use client"`（依赖 localStorage Hook）
- 收藏 ID 读取来源：`useFavorites()`，依赖 `mounted` 作为 localStorage 初始化完成门控
- 数据获取采用 server action：在客户端 `useEffect` 中调用 `getSites()`，再按 `favorites` 过滤并仅保留 `isPublished`

### 状态管理约定
- `!mounted` 或 `loading`：显示加载态容器，避免 hydration 阶段闪烁/误判空状态
- 空状态触发条件：`favorites.length === 0` 或过滤后 `favoriteSites.length === 0`
- 空状态文案：`还没有收藏任何工具` + `浏览首页并点击心形按钮来收藏喜欢的工具`
- 空状态 CTA：`去首页逛逛`，链接到 `/`

### 布局与组件复用
- 页面结构沿用公共页风格：`Header + main + Footer`
- 收藏列表网格：`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3`
- 卡片渲染直接复用 `SiteCard`，确保收藏/点赞交互一致

## Task 12: Tool Detail Page `app/(public)/tool/[id]/page.tsx` (2026-03-06)

### 页面架构模式
- 采用 Server Component 拉取数据：`getSiteById(id)` + `getAllCategories()` + `getSystemSettings()` + `getSites()` 并行请求
- 使用 `SearchableLayout` 复用公共页头/搜索/页脚交互，工具详情作为 children 渲染
- 404 处理使用 `notFound()`（当 `getSiteById` 未返回站点）

### 字段展示映射
- 基础信息：`name`、`description`、`url`、`iconUrl`、`likesCount`
- 标签与平台：`tags[]`/`platforms[]` 直接渲染 `Badge`（无需 JSON.parse）
- 使用场景：`useCases` 文本，不存在时显示占位文案
- 截图：`screenshots[]` 条件渲染网格，移动端 1 列、`sm` 以上 2 列

### 交互集成
- 收藏/点赞交互沿用现有客户端组件 `ToolActions`（内部使用 `useFavorites` + `useLikes`）
- 访问按钮使用 `Button asChild` + 外链 `<a target="_blank" rel="noopener noreferrer">`

### 布局规则
- 详情主体容器 `max-w-6xl`
- 响应式主布局：`grid grid-cols-1 lg:grid-cols-2`（移动单列，桌面双列）
- 图标渲染：有 `iconUrl` 显示图片；否则显示首字母 fallback（与站点卡片同逻辑）

## Task: Admin SiteForm 新增 tags/platforms/screenshots/useCases 字段 (2026-03-06)

### 表单数据结构扩展模式
- 在 `formData` 初始状态直接新增：`tags: string[]`、`platforms: string[]`、`screenshots: string[]`、`useCases: string`
- 编辑态回填时统一设置这些字段，创建态重置时也必须完整重置，避免脏状态泄漏

### JSON 字段回填与提交约定
- 回填阶段：优先容错解析（支持 `string | string[] | null`），解析失败回退空数组
- 提交阶段：在 `handleSubmit` 里先构建 `submitData`，对三类数组字段执行 `JSON.stringify(...)`
- 与现有 action 的双重序列化逻辑兼容（前端传字符串、后端再次序列化），本次按任务要求保持前端显式 `JSON.stringify`

### UI 交互实现模式
- `tags`：使用 `getTags({ isApproved: true })` 拉取已审核标签，`Select + Badge` 实现“选择 + 已选移除”
- `platforms`：固定枚举 `Web/Desktop/Mobile/API`，复用与 tags 相同的多选交互模式
- `screenshots`：动态 URL 输入数组，支持 `+ 添加截图` 和单项 `×` 删除
- `useCases`：使用 `Textarea` 承载长文本说明

### 细节注意点
- 为避免 hooks 依赖告警，分类默认值设置改为 `setFormData(prev => prev.categoryId ? prev : {...})`
- 移除 `any` 强转，改用 `Parameters<typeof createSite>[0]` 派生 payload 类型
## Fix for Next.js 15 route params typing
- Route parameters in Next.js 15 must be treated as Promises. Thus, the signature `{ params }: { params: Promise<{ id: string }> }` must be used instead of `{ params }: { params: { id: string } }`.
- Need to `await params` before extracting variables like `id`.
- Resolved pre-existing build failure by fixing param typings across api routes in Next.js 15.
