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
