import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'

export const galleryRouter = Router()

// 목록 조회 (공개)
galleryRouter.get('/', (_req, res) => {
  res.json({ message: '갤러리 목록 — 구현 예정' })
})

// 업로드 (관리자)
galleryRouter.post('/', requireAdmin, (_req, res) => {
  res.json({ message: '갤러리 업로드 — 구현 예정' })
})

// 삭제 (관리자)
galleryRouter.delete('/:id', requireAdmin, (_req, res) => {
  res.json({ message: '갤러리 삭제 — 구현 예정' })
})
