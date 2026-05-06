import { defineConfig } from '@playwright/test'

// E2E 테스트는 포트 4001에 NODE_ENV=test 서버를 별도로 시작한다.
// 개발 서버(포트 4000)와 충돌하지 않으며, test-login 엔드포인트가 활성화된다.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4001',
  },
  webServer: {
    command: 'NODE_ENV=test PORT=4001 ADMIN_PASSWORD=test-admin MONGODB_URI=mongodb://localhost:27017/cergy2026-test pnpm --filter backend dev',
    url: 'http://localhost:4001/health',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
