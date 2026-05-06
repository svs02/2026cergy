import { test, expect } from '@playwright/test'

const ADMIN_PASSWORD = 'test-admin'

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

// Minimal valid MP4 (ftyp + mdat boxes)
const TINY_MP4 = Buffer.from(
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0',
  'base64',
)

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

test('비인증 상태에서 GET /api/gallery는 200을 반환한다', async ({ request }) => {
  const response = await request.get('/api/gallery')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(Array.isArray(body.items)).toBe(true)
})

test('비인증 상태에서 POST /api/gallery는 401을 반환한다', async ({ request }) => {
  const response = await request.post('/api/gallery', {
    multipart: {
      category: '공간',
      image: { name: 'tiny.png', mimeType: 'image/png', buffer: TINY_PNG },
    },
  })
  expect(response.status()).toBe(401)
})

test('관리자 로그인 + multipart 업로드 시 201과 imageUrl을 반환한다', async ({ request }) => {
  await loginAdmin(request)

  const response = await request.post('/api/gallery', {
    multipart: {
      category: '공간',
      caption: '레슨실 입구',
      image: { name: 'tiny.png', mimeType: 'image/png', buffer: TINY_PNG },
    },
  })
  expect(response.status()).toBe(201)
  const body = await response.json()
  expect(body.imageUrl).toMatch(/^\/uploads\//)
  expect(body.category).toBe('공간')
  expect(body.caption).toBe('레슨실 입구')
})

test('카테고리 필터가 동작한다', async ({ request }) => {
  await loginAdmin(request)

  await request.post('/api/gallery', {
    multipart: {
      category: '공간',
      image: { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
    },
  })
  await request.post('/api/gallery', {
    multipart: {
      category: '레슨',
      image: { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
    },
  })

  const allResponse = await request.get('/api/gallery')
  const all = await allResponse.json()
  expect(all.items.length).toBe(2)

  const filtered = await request.get('/api/gallery?category=공간')
  const filteredBody = await filtered.json()
  expect(filteredBody.items.length).toBe(1)
  expect(filteredBody.items[0].category).toBe('공간')

  const allByLabel = await request.get('/api/gallery?category=전체')
  const allByLabelBody = await allByLabel.json()
  expect(allByLabelBody.items.length).toBe(2)
})

test('DELETE 후 목록에서 사라진다', async ({ request }) => {
  await loginAdmin(request)

  const createResponse = await request.post('/api/gallery', {
    multipart: {
      category: '발표회',
      image: { name: 'r.png', mimeType: 'image/png', buffer: TINY_PNG },
    },
  })
  const created = await createResponse.json()

  const deleteResponse = await request.delete(`/api/gallery/${created._id}`)
  expect(deleteResponse.status()).toBe(200)

  const listResponse = await request.get('/api/gallery')
  const list = await listResponse.json()
  expect(list.items.length).toBe(0)
})

test('비인증 PATCH /api/gallery/reorder는 401을 반환한다', async ({ request }) => {
  const response = await request.patch('/api/gallery/reorder', {
    data: { orderedIds: ['64aa00000000000000000000'] },
  })
  expect(response.status()).toBe(401)
})

test('새 사진은 기본적으로 맨 위에 추가된다', async ({ request }) => {
  await loginAdmin(request)

  const captions = ['첫번째', '두번째', '세번째']
  for (const caption of captions) {
    await request.post('/api/gallery', {
      multipart: {
        category: '공간',
        caption,
        image: { name: `${caption}.png`, mimeType: 'image/png', buffer: TINY_PNG },
      },
    })
  }

  const listResponse = await request.get('/api/gallery')
  const list = await listResponse.json()
  expect(list.items.map((item: { caption: string }) => item.caption)).toEqual([
    '세번째',
    '두번째',
    '첫번째',
  ])
})

test('관리자는 reorder로 순서를 변경할 수 있다', async ({ request }) => {
  await loginAdmin(request)

  const ids: string[] = []
  for (const caption of ['A', 'B', 'C']) {
    const response = await request.post('/api/gallery', {
      multipart: {
        category: '공간',
        caption,
        image: { name: `${caption}.png`, mimeType: 'image/png', buffer: TINY_PNG },
      },
    })
    const body = await response.json()
    ids.push(body._id)
  }

  // 업로드 직후 순서: [C, B, A]
  // 업로드 순서대로(=역순) 재정렬 → [A, B, C]
  const reorderResponse = await request.patch('/api/gallery/reorder', {
    data: { orderedIds: [ids[0], ids[1], ids[2]] },
  })
  expect(reorderResponse.status()).toBe(200)

  const listResponse = await request.get('/api/gallery')
  const list = await listResponse.json()
  expect(list.items.map((item: { caption: string }) => item.caption)).toEqual(['A', 'B', 'C'])
})

test('관리자 비디오 업로드 시 201과 mediaType video를 반환한다', async ({ request }) => {
  await loginAdmin(request)

  const response = await request.post('/api/gallery', {
    multipart: {
      category: '공간',
      caption: '레슨 영상',
      image: { name: 'tiny.mp4', mimeType: 'video/mp4', buffer: TINY_MP4 },
    },
  })
  expect(response.status()).toBe(201)
  const body = await response.json()
  expect(body.imageUrl).toMatch(/^\/uploads\//)
  expect(body.mediaType).toBe('video')
  expect(body.caption).toBe('레슨 영상')
})

test('비디오 DELETE 후 목록에서 사라진다', async ({ request }) => {
  await loginAdmin(request)

  const createResponse = await request.post('/api/gallery', {
    multipart: {
      category: '발표회',
      image: { name: 'v.mp4', mimeType: 'video/mp4', buffer: TINY_MP4 },
    },
  })
  const created = await createResponse.json()

  const deleteResponse = await request.delete(`/api/gallery/${created._id}`)
  expect(deleteResponse.status()).toBe(200)

  const listResponse = await request.get('/api/gallery')
  const list = await listResponse.json()
  expect(list.items.length).toBe(0)
})

test('이미지와 비디오가 같은 목록에 표시된다', async ({ request }) => {
  await loginAdmin(request)

  await request.post('/api/gallery', {
    multipart: {
      category: '공간',
      image: { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG },
    },
  })
  await request.post('/api/gallery', {
    multipart: {
      category: '공간',
      image: { name: 'clip.mp4', mimeType: 'video/mp4', buffer: TINY_MP4 },
    },
  })

  const listResponse = await request.get('/api/gallery')
  const list = await listResponse.json()
  expect(list.items.length).toBe(2)

  const types = list.items.map((item: { mediaType: string }) => item.mediaType).sort()
  expect(types).toEqual(['image', 'video'])
})
