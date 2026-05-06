# syntax=docker/dockerfile:1.7

# ── 1단계: pnpm 설치된 기본 이미지 ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /repo

# ── 2단계: workspace 의존성 설치 ──
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY frontend/package.json ./frontend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter frontend...

# ── 3단계: 빌드 (Next.js standalone) ──
FROM deps AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY frontend ./frontend
RUN pnpm --filter frontend build

# ── 4단계: 실행 ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Next.js standalone 출력 구조 (monorepo):
#   .next/standalone/         ← 루트 (node_modules 포함)
#   .next/standalone/frontend/server.js
COPY --from=builder --chown=nextjs:nodejs /repo/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/frontend/public ./frontend/public

USER nextjs
EXPOSE 3000
CMD ["node", "frontend/server.js"]
