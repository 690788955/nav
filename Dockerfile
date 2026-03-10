# Stage 1: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 复制 package 文件和 Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# 选择 Prisma provider（构建时决定，不能运行时切换）
# 生产默认使用 PostgreSQL；如需 SQLite，构建时传 PRISMA_PROVIDER=sqlite
ARG PRISMA_PROVIDER=postgresql
RUN if [ "$PRISMA_PROVIDER" = "postgresql" ]; then \
      cp prisma/schema.postgresql.prisma prisma/schema.prisma; \
    elif [ "$PRISMA_PROVIDER" = "sqlite" ]; then \
      true; \
    else \
      echo "Unsupported PRISMA_PROVIDER: $PRISMA_PROVIDER" && exit 1; \
    fi

# 安装所有依赖
RUN npm ci && \
    npm cache clean --force

# 复制剩余源代码
COPY . .

# COPY . . 会把仓库里的本地 SQLite schema.prisma 覆盖回来，
# 这里必须在完整源码复制后再次选择一次目标 provider，确保生产镜像保留 PostgreSQL schema。
RUN if [ "$PRISMA_PROVIDER" = "postgresql" ]; then \
      cp prisma/schema.postgresql.prisma prisma/schema.prisma; \
    elif [ "$PRISMA_PROVIDER" = "sqlite" ]; then \
      true; \
    else \
      echo "Unsupported PRISMA_PROVIDER: $PRISMA_PROVIDER" && exit 1; \
    fi

# 构建
RUN npm run build


# Stage 2: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV="production"
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# SQLite 数据目录（可挂载 volume）
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# 复制运行时依赖（数据库初始化和 seed 脚本需要）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制启动脚本
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# 切换到非 root 用户
USER nextjs

EXPOSE 3000

# 执行启动脚本
CMD ["sh", "/app/entrypoint.sh"]
