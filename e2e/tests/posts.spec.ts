import { test, expect } from '@playwright/test'

// ── 현재 구현된 범위 ────────────────────────────────────────────────────────

test('GET /api/posts는 200을 반환한다', async ({ request }) => {
  const response = await request.get('/api/posts')
  expect(response.status()).toBe(200)
})

test('GET /api/posts/:id는 200을 반환한다', async ({ request }) => {
  const response = await request.get('/api/posts/placeholder-id')
  expect(response.status()).toBe(200)
})

// ── TODO: 게시글 기능 구현 후 아래 테스트를 완성하세요 ────────────────────
//
// test('ADMIN이 POST /api/posts로 게시글을 생성한다', async ({ request }) => {
//   await request.post('/api/auth/test-login', { data: { role: 'ADMIN' } })
//   const response = await request.post('/api/posts', {
//     data: { title: '공지사항', content: '내용', category: 'NOTICE' },
//   })
//   expect(response.status()).toBe(201)
//   const post = await response.json()
//   expect(post.title).toBe('공지사항')
//   expect(post.category).toBe('NOTICE')
// })
//
// test('ADMIN이 PUT /api/posts/:id로 게시글을 수정한다', async ({ request }) => { ... })
// test('ADMIN이 DELETE /api/posts/:id로 게시글을 삭제한다', async ({ request }) => { ... })
// test('GET /api/posts는 페이지네이션을 지원한다 (?page=1&limit=10)', async ({ request }) => { ... })
// test('GET /api/posts?category=NOTICE는 공지사항만 반환한다', async ({ request }) => { ... })
