import { test, expect } from '@playwright/test'

const ADMIN_PASSWORD = 'test-admin'

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset')
})

test.afterEach(async ({ request }) => {
  await request.post('/api/test/reset')
})

async function loginAdmin(request: import('@playwright/test').APIRequestContext) {
  const response = await request.post('/api/auth/admin/login', {
    data: { password: ADMIN_PASSWORD },
  })
  expect(response.status()).toBe(200)
}

test('비인증 상태에서 GET /api/notices는 200을 반환한다', async ({ request }) => {
  const response = await request.get('/api/notices')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(Array.isArray(body.items)).toBe(true)
  expect(typeof body.total).toBe('number')
})

test('비인증 상태에서 POST /api/notices는 401을 반환한다', async ({ request }) => {
  const response = await request.post('/api/notices', {
    data: { title: '제목', body: '본문', tag: 'NOTICE', images: [] },
  })
  expect(response.status()).toBe(401)
})

test('비인증 상태에서 PUT /api/notices/:id는 401을 반환한다', async ({ request }) => {
  const response = await request.put('/api/notices/000000000000000000000000', {
    data: { title: '수정' },
  })
  expect(response.status()).toBe(401)
})

test('비인증 상태에서 DELETE /api/notices/:id는 401을 반환한다', async ({ request }) => {
  const response = await request.delete('/api/notices/000000000000000000000000')
  expect(response.status()).toBe(401)
})

test('관리자 로그인 후 공지사항 생성/조회/수정/삭제가 가능하다', async ({ request }) => {
  await loginAdmin(request)

  const createResponse = await request.post('/api/notices', {
    data: {
      title: '봄 발표회 안내',
      body: '2026 봄 발표회 일정 공지입니다.',
      tag: 'EVENT',
      images: [],
    },
  })
  expect(createResponse.status()).toBe(201)
  const created = await createResponse.json()
  expect(created.title).toBe('봄 발표회 안내')
  expect(created.tag).toBe('EVENT')
  const id = created._id

  const getResponse = await request.get(`/api/notices/${id}`)
  expect(getResponse.status()).toBe(200)
  const fetched = await getResponse.json()
  expect(fetched.title).toBe('봄 발표회 안내')
  expect(fetched.views).toBe(1)

  const listResponse = await request.get('/api/notices')
  expect(listResponse.status()).toBe(200)
  const list = await listResponse.json()
  expect(list.total).toBe(1)
  expect(list.items[0]._id).toBe(id)

  const putResponse = await request.put(`/api/notices/${id}`, {
    data: { title: '봄 발표회 안내(수정)' },
  })
  expect(putResponse.status()).toBe(200)
  const updated = await putResponse.json()
  expect(updated.title).toBe('봄 발표회 안내(수정)')

  const deleteResponse = await request.delete(`/api/notices/${id}`)
  expect(deleteResponse.status()).toBe(200)

  const finalList = await request.get('/api/notices')
  const finalBody = await finalList.json()
  expect(finalBody.total).toBe(0)
})
