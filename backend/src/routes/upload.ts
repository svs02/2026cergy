import { Router } from 'express'
import { upload } from '../lib/multer'
import { requireAdmin } from '../middleware/auth'

export const uploadRouter = Router()

uploadRouter.post('/', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: '이미지 파일이 필요합니다' })
    return
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})
