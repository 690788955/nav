# Learnings - Tool Platform Optimization

## Conventions & Patterns

(Tasks will append findings here)

## Task 4 - useLikes Hook (2026-03-05)
- Pattern: useState+useEffect with Set<string> for multi-entity like management
- localStorage keys: liked-sites, liked-feedbacks (JSON array serialized)
- try/catch wraps all localStorage ops; fallback to in-memory Set on failure
- toggleLike(id, type) uses Set.has/add/delete pattern
- mounted flag prevents SSR hydration mismatch

## Task 1 - Prisma Schema Extension (2026-03-05)
- Site model extended with 5 new fields: tags, platforms, screenshots, useCases, likesCount
- All new fields use String type with JSON serialization (not Json type for SQLite compatibility)
- Default values: tags="[]", platforms="[]", screenshots="[]", useCases=null, likesCount=0
- Site.updatedAt changed from @default(now()) to @updatedAt for auto-update behavior
- Feedback model: toolId FK with CASCADE delete, includes isDeleted flag for soft deletes
- Tag model: unique constraints on name and slug, isOfficial/isApproved flags for moderation
- Migration pattern: Use DO $$ blocks for idempotent FK constraints (avoid duplicate errors)
- PostgreSQL project uses versioned migrations in prisma/migrations/YYYYMMDDHHMMSS_name/
- Prisma Client regenerates automatically on schema changes (npx prisma generate)

## Task 6 - Seed Data with Tags & Extended Sites (2026-03-05)
- Preset tags: 10 official tags (设计, 开发, AI, 效率工具, 营销, 数据分析, 协作, 学习, 娱乐, 其他)
- Tag slug generation: Chinese names transliterated to English (e.g., 设计→design, 开发→dev)
- Tag creation pattern: findUnique by slug → if not exists → create with isOfficial=true, isApproved=true
- Site data extended with 3 new fields: tags (JSON string array), platforms (JSON string array), useCases (string)
- Example: GitHub → tags: '["开发"]', platforms: '["Web"]', useCases: "代码托管和协作开发"
- Idempotent pattern: Check existence before creating (findFirst by url for sites, findUnique by slug for tags)
- basicSites: 4 sites with tags/platforms/useCases; fullSites: 50+ sites with comprehensive metadata
- Seed script remains idempotent: can run multiple times without errors (checks existence first)
- Prisma Client regeneration: npx prisma generate required after schema changes (Tag model addition)
- bcrypt import issue: @types/bcrypt has no default export (pre-existing, doesn't affect runtime)

## Build Repair - Merge Artifact Cleanup (2026-03-06)
- Build failure root cause was duplicated merge blocks inside `prisma/seed.ts` (duplicate `createdTags` declaration and mixed tag-shape assumptions).
- Effective repair pattern: align broken file with verified worktree logic while preserving current repo dependency reality (`bcryptjs` in main repo).
- Validation sequence that worked: LSP diagnostics on touched TS/TSX files first, then full `npm run build` to confirm zero type errors.
