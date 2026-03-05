# Issues - Tool Platform Optimization

## Problems & Gotchas

(Tasks will append issues here)

- Worktree and main repo dependency sets diverged for password hashing (`bcrypt` vs `bcryptjs`), so blind full-file copy from worktree would have introduced an unresolved import in main.
