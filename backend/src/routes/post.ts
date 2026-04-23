import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth'

export const postRouter = Router()

// 목록 조회 (공개)
postRouter.get('/', (_req, res) => {
  res.json({ message: '게시글 목록 — 구현 예정' })
})

// 상세 조회 (공개)
postRouter.get('/:id', (_req, res) => {
  res.json({ message: '게시글 상세 — 구현 예정' })
})

// 작성 (관리자)
postRouter.post('/', requireAdmin, (_req, res) => {
  res.json({ message: '게시글 작성 — 구현 예정' })
})

// 수정 (관리자)
postRouter.put('/:id', requireAdmin, (_req, res) => {
  res.json({ message: '게시글 수정 — 구현 예정' })
})

// 삭제 (관리자)
postRouter.delete('/:id', requireAdmin, (_req, res) => {
  res.json({ message: '게시글 삭제 — 구현 예정' })
})
