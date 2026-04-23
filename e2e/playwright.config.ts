import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4000',
  },
  webServer: {
    command: 'NODE_ENV=test pnpm --filter backend dev',
    url: 'http://localhost:4000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
