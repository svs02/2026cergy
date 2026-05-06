# syntax=docker/dockerfile:1.7

# ── 1단계: pnpm 설치된 기본 이미지 ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /repo

# ── 2단계: workspace 의존성 설치 ──
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json ./backend/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter backend...

# ── 3단계: 빌드 (TypeScript → JavaScript) ──
FROM deps AS builder
COPY backend ./backend
RUN pnpm --filter backend build

# ── 4단계: pnpm deploy로 production 번들 생성 ──
FROM deps AS deploy
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm --filter backend deploy --prod --legacy /repo/deploy

# ── 5단계: 실행 ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 expressjs

COPY --from=builder --chown=expressjs:nodejs /repo/backend/dist ./dist
COPY --from=deploy --chown=expressjs:nodejs /repo/deploy/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /repo/backend/package.json ./

RUN mkdir -p /app/uploads && chown expressjs:nodejs /app/uploads

USER expressjs
EXPOSE 4000
CMD ["node", "dist/index.js"]
