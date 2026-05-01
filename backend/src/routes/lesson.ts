import { Router } from 'express'
import { z } from 'zod/v4'
import { Lesson } from '../models/Lesson'
import { requireAdmin } from '../middleware/auth'

export const lessonRouter = Router()

const createLessonSchema = z.strictObject({
  title: z.string().min(1, '제목을 입력해 주세요'),
  subtitle: z.string().min(1, '부제를 입력해 주세요'),
  description: z.string().min(1, '설명을 입력해 주세요'),
  price: z.string().min(1, '가격을 입력해 주세요'),
  active: z.boolean().default(true),
})

const updateLessonSchema = z.strictObject({
  title: z.string().min(1).optional(),
  subtitle: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.string().min(1).optional(),
  active: z.boolean().optional(),
})

const reorderSchema = z.strictObject({
  orderedIds: z.array(z.string().min(1)).min(1),
})

// GET /api/lessons
lessonRouter.get('/', async (req, res, next) => {
  try {
    const isAdmin = req.session?.isAdmin === true
    const filter: Record<string, unknown> = {}

    if (!isAdmin) {
      filter.active = true
    }

    const items = await Lesson.find(filter).sort({ sortOrder: 1 })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

// GET /api/lessons/:id
lessonRouter.get('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).orFail()
    res.json(lesson)
  } catch (error) {
    next(error)
  }
})

// POST /api/lessons
lessonRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parsed = createLessonSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }

    const top = await Lesson.findOne().sort({ sortOrder: 1 }).select({ sortOrder: 1 }).lean()
    const nextSortOrder = top ? top.sortOrder - 1 : 0

    const lesson = await Lesson.create({
      ...parsed.data,
      sortOrder: nextSortOrder,
    })
    res.status(201).json(lesson)
  } catch (error) {
    next(error)
  }
})

// PUT /api/lessons/:id
lessonRouter.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateLessonSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
      runValidators: true,
    }).orFail()
    res.json(lesson)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/lessons/:id
lessonRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id).orFail()
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/lessons/reorder
lessonRouter.patch('/reorder', requireAdmin, async (req, res, next) => {
  try {
    const parsed = reorderSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }

    const operations = parsed.data.orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder: index } },
      },
    }))

    if (operations.length > 0) {
      await Lesson.bulkWrite(operations)
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})
