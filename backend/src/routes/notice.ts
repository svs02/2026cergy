import { Router } from 'express'
import { z } from 'zod/v4'
import { Notice, NoticeTag } from '../models/Notice'
import { requireAdmin } from '../middleware/auth'

export const noticeRouter = Router()

const createNoticeSchema = z.strictObject({
  title: z.string().min(1),
  body: z.string().min(1),
  tag: z.enum(NoticeTag),
  images: z.array(z.string()).default([]),
})

const updateNoticeSchema = z.strictObject({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  tag: z.enum(NoticeTag).optional(),
  images: z.array(z.string()).optional(),
})

const listQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

noticeRouter.get('/', async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: '잘못된 쿼리 파라미터입니다' })
      return
    }
    const { page, limit } = parsed.data
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      Notice.find().sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
      Notice.countDocuments(),
    ])

    res.json({ items, total, page, limit })
  } catch (error) {
    next(error)
  }
})

noticeRouter.get('/:id', async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).orFail()
    res.json(notice)
  } catch (error) {
    next(error)
  }
})

noticeRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parsed = createNoticeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }
    const notice = await Notice.create(parsed.data)
    res.status(201).json(notice)
  } catch (error) {
    next(error)
  }
})

noticeRouter.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateNoticeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }
    const notice = await Notice.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
      runValidators: true,
    }).orFail()
    res.json(notice)
  } catch (error) {
    next(error)
  }
})

noticeRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Notice.findByIdAndDelete(req.params.id).orFail()
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

const pinNoticeSchema = z.strictObject({
  isPinned: z.boolean(),
})

noticeRouter.patch('/:id/pin', requireAdmin, async (req, res, next) => {
  try {
    const parsed = pinNoticeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }
    const { isPinned } = parsed.data
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { isPinned, pinnedAt: isPinned ? new Date() : null },
      { new: true, runValidators: true }
    ).orFail()
    res.json(notice)
  } catch (error) {
    next(error)
  }
})
