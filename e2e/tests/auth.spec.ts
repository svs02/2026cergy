import { test, expect } from '@playwright/test'

const ADMIN_PASSWORD = 'test-admin'

test('잘못된 비밀번호로 로그인 시 401을 반환한다', async ({ request }) => {
  const response = await request.post('/api/auth/admin/login', {
    data: { password: 'wrong-password' },
  })
  expect(response.status()).toBe(401)
  const body = await response.json()
  expect(body.error).toBeDefined()
})

test('올바른 비밀번호로 로그인 시 200과 isAdmin true를 반환한다', async ({ request }) => {
  const response = await request.post('/api/auth/admin/login', {
    data: { password: ADMIN_PASSWORD },
  })
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body.isAdmin).toBe(true)

  const meResponse = await request.get('/api/auth/admin/me')
  expect(meResponse.status()).toBe(200)
  const me = await meResponse.json()
  expect(me.isAdmin).toBe(true)
})

test('로그아웃 후 me는 isAdmin false를 반환한다', async ({ request }) => {
  await request.post('/api/auth/admin/login', { data: { password: ADMIN_PASSWORD } })
  const logoutResponse = await request.post('/api/auth/admin/logout')
  expect(logoutResponse.status()).toBe(200)

  const meResponse = await request.get('/api/auth/admin/me')
  expect(meResponse.status()).toBe(200)
  const me = await meResponse.json()
  expect(me.isAdmin).toBe(false)
})

test('비인증 상태에서 me는 isAdmin false를 반환한다', async ({ request }) => {
  const response = await request.get('/api/auth/admin/me')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.isAdmin).toBe(false)
})
