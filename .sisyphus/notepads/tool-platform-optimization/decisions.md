# Architectural Decisions

## [2026-03-05] Initial Architecture

### Database Design
- **Site Model Extensions**: Added tags, platforms, screenshots (JSON strings), useCases (text), likesCount (int)
- **Feedback Model**: toolId (required), type (enum), content, contact (optional), likesCount, ipAddress, isDeleted (soft delete)
- **Tag Model**: name, slug (unique), isOfficial, isApproved (for user-submitted tags)
- **Migration Strategy**: Additive only — no deletions or renames to preserve existing data

### Frontend State Management
- **Favorites**: Pure localStorage, no backend sync
- **Likes**: Hybrid — localStorage prevents duplicate clicks, server maintains canonical count
- **Rationale**: Lightweight design, no user accounts needed

### Review Workflow
- **Tools**: Need admin review before publishing (existing pattern)
- **Feedback**: Public immediately, admin can soft-delete
- **Tags**: Official tags pre-approved, user tags need admin approval

### API Design
- **Feedback API**: `/api/feedback` (GET/POST), `/api/feedback/[id]` (DELETE)
- **Likes API**: `/api/likes/site/[id]`, `/api/likes/feedback/[id]` (POST/DELETE)
- **Rate Limiting**: IP-based, in-memory Map (simple implementation)
