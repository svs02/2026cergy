import { test, expect } from '@playwright/test'

// ── 현재 구현된 범위 ────────────────────────────────────────────────────────

test('GET /api/gallery는 200을 반환한다', async ({ request }) => {
  const response = await request.get('/api/gallery')
  expect(response.status()).toBe(200)
})

// ── TODO: 갤러리 기능 구현 후 아래 테스트를 완성하세요 ────────────────────
//
// test('ADMIN이 POST /api/gallery로 이미지를 업로드한다', async ({ request }) => {
//   await request.post('/api/auth/test-login', { data: { role: 'ADMIN' } })
//   // presigned URL 요청 → S3 업로드 → 메타데이터 저장 흐름 검증
//   const response = await request.post('/api/gallery', {
//     data: { title: '봄 연주회', description: '2026 봄 연주회 사진' },
//   })
//   expect(response.status()).toBe(201)
// })
//
// test('ADMIN이 DELETE /api/gallery/:id로 이미지를 삭제한다', async ({ request }) => { ... })
// test('GET /api/gallery는 앨범별로 필터링된다 (?album=spring2026)', async ({ request }) => { ... })
