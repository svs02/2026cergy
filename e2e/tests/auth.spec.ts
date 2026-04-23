import { test, expect } from '@playwright/test'

test('비인증 상태에서 GET /api/auth/me는 401을 반환한다', async ({ request }) => {
  const response = await request.get('/api/auth/me')
  expect(response.status()).toBe(401)
})

test('MEMBER로 test-login 후 /api/auth/me는 사용자 정보를 반환한다', async ({ request }) => {
  const loginResponse = await request.post('/api/auth/test-login', {
    data: { role: 'MEMBER' },
  })
  expect(loginResponse.status()).toBe(200)

  const meResponse = await request.get('/api/auth/me')
  expect(meResponse.status()).toBe(200)

  const user = await meResponse.json()
  expect(user.role).toBe('MEMBER')
  expect(user.name).toBe('테스트 사용자')
})

test('ADMIN으로 test-login 후 /api/auth/me는 ADMIN role을 반환한다', async ({ request }) => {
  await request.post('/api/auth/test-login', { data: { role: 'ADMIN' } })

  const meResponse = await request.get('/api/auth/me')
  expect(meResponse.status()).toBe(200)

  const user = await meResponse.json()
  expect(user.role).toBe('ADMIN')
})

test('로그아웃 후 /api/auth/me는 401을 반환한다', async ({ request }) => {
  await request.post('/api/auth/test-login', { data: { role: 'MEMBER' } })
  await request.post('/api/auth/logout')

  const meResponse = await request.get('/api/auth/me')
  expect(meResponse.status()).toBe(401)
})

test('비인증 상태에서 관리자 전용 엔드포인트에 접근하면 401을 반환한다', async ({ request }) => {
  const response = await request.post('/api/posts', { data: { title: '테스트' } })
  expect(response.status()).toBe(401)
})

test('MEMBER가 관리자 전용 엔드포인트에 접근하면 403을 반환한다', async ({ request }) => {
  await request.post('/api/auth/test-login', { data: { role: 'MEMBER' } })

  const response = await request.post('/api/posts', { data: { title: '테스트' } })
  expect(response.status()).toBe(403)
})

test('ADMIN이 관리자 전용 엔드포인트에 접근하면 403이 아닌 응답을 받는다', async ({ request }) => {
  await request.post('/api/auth/test-login', { data: { role: 'ADMIN' } })

  const response = await request.post('/api/posts', { data: { title: '테스트' } })
  expect(response.status()).not.toBe(403)
  expect(response.status()).not.toBe(401)
})
