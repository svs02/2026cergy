#!/bin/bash
set -euo pipefail

DEPLOY_DIR="/var/www/cergy2026"

echo "=== Cergy2026 수동 배포 ==="

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$DEPLOY_DIR"

echo "1/5 최신 코드 가져오는 중..."
git fetch origin main
git reset --hard origin/main

echo "2/5 의존성 설치 중..."
pnpm install --frozen-lockfile

echo "3/5 백엔드 빌드 중..."
pnpm build:backend

echo "4/5 프론트엔드 빌드 중..."
cd frontend && pnpm build && cd ..

echo "5/5 PM2 재시작 중..."
mkdir -p logs
pm2 reload ecosystem.config.cjs --update-env
pm2 save

echo ""
echo "=== 배포 완료 ==="
echo "헬스 체크:"
curl -sf http://localhost:4000/health || echo "헬스 체크 실패"
echo ""
