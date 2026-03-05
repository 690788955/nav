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
