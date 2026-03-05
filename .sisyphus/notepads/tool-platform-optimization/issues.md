# Issues & Gotchas

## Known Issues
- Pre-existing LSP errors in `lib/actions.ts` lines 520-522 (`mode` property on StringFilter) — not introduced by this work
- Site model has `updatedAt DateTime @default(now())` which should be `@updatedAt` — plan includes fix in Task 1

## Gotchas to Watch
- SQLite JSON compatibility: MUST use `String` type, not `Json` type
- localStorage edge cases: quota exceeded, privacy mode — wrap in try/catch, fallback to memory
- Prisma atomic operations: Use `{ increment: 1 }` / `{ decrement: 1 }` for concurrent likes
- Event bubbling: Click on favorite/like buttons should NOT trigger card navigation — use `e.stopPropagation()`
- Tag slug uniqueness: Database has unique constraint, but generate function doesn't check — let DB handle conflicts

## Testing Strategy
- No unit tests (user preference)
- Agent QA scenarios for each task
- Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`
- Final verification: 4 parallel review agents (F1-F4)
