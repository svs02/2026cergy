import { test, expect } from '@playwright/test'

test('GET /health는 200과 ok 상태를 반환한다', async ({ request }) => {
  const response = await request.get('/health')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.status).toBe('ok')
})
