# Decisions - Tool Platform Optimization

## Architectural Choices

(Tasks will append decisions here)

- Decision: resolve merge artifacts in `prisma/seed.ts` by removing duplicated conflicting block and normalizing `presetTags` to explicit `{ name, slug }` entries, instead of introducing helper-based slug generation path.
- Decision: keep `bcryptjs` import in main repo seed script to match installed dependencies and avoid unrelated package churn during build-fix task.
