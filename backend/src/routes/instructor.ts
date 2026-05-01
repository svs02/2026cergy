import path from 'path'
import fs from 'fs/promises'
import { Router } from 'express'
import { z } from 'zod/v4'
import { Instructor, PhotoTone, Day } from '../models/Instructor'
import { requireAdmin } from '../middleware/auth'
import { upload, UPLOAD_DIR } from '../lib/multer'

export const instructorRouter = Router()

const photoToneValues = Object.values(PhotoTone) as [string, ...string[]]
const dayValues = Object.values(Day) as [string, ...string[]]

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const scheduleSlotSchema = z.strictObject({
  day: z.enum(dayValues),
  startTime: z.string().regex(timePattern, '시간 형식은 HH:mm이어야 합니다'),
  endTime: z.string().regex(timePattern, '시간 형식은 HH:mm이어야 합니다'),
  lessonName: z.string().min(1, '수업명을 입력해 주세요'),
}).check(
  z.refine((slot) => slot.startTime < slot.endTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다',
  }),
)

const createInstructorSchema = z.strictObject({
  name: z.string().min(1, '이름을 입력해 주세요'),
  nameEn: z.string().min(1, '영문 이름을 입력해 주세요').regex(/^[A-Z\s]+$/, '영문 대문자와 공백만 입력 가능합니다'),
  role: z.string().min(1, '직책을 입력해 주세요'),
  photoUrl: z.string().optional(),
  tone: z.enum(photoToneValues),
  major: z.string().min(1, '전공을 입력해 주세요'),
  career: z.array(z.string().min(1)).min(1, '경력을 최소 1개 입력해 주세요').max(10),
  quote: z.string().optional(),
  schedule: z.array(scheduleSlotSchema).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
})

const updateInstructorSchema = z.strictObject({
  name: z.string().min(1).optional(),
  nameEn: z.string().min(1).regex(/^[A-Z\s]+$/, '영문 대문자와 공백만 입력 가능합니다').optional(),
  role: z.string().min(1).optional(),
  photoUrl: z.string().nullable().optional(),
  tone: z.enum(photoToneValues).optional(),
  major: z.string().min(1).optional(),
  career: z.array(z.string().min(1)).min(1).max(10).optional(),
  quote: z.string().nullable().optional(),
  schedule: z.array(scheduleSlotSchema).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
})

const reorderSchema = z.strictObject({
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
})

// GET /api/instructors
instructorRouter.get('/', async (req, res, next) => {
  try {
    const featured = req.query.featured === 'true'
    const isAdmin = req.session?.isAdmin === true
    const filter: Record<string, unknown> = {}

    if (!isAdmin) {
      filter.active = true
    }
    if (featured) {
      filter.featured = true
    }

    const items = await Instructor.find(filter).sort({ sortOrder: 1 })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

// GET /api/instructors/:id
instructorRouter.get('/:id', async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id).orFail()
    res.json(instructor)
  } catch (error) {
    next(error)
  }
})

// POST /api/instructors
instructorRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parsed = createInstructorSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }

    const top = await Instructor.findOne().sort({ sortOrder: 1 }).select({ sortOrder: 1 }).lean()
    const nextSortOrder = top ? top.sortOrder - 1 : 0

    const instructor = await Instructor.create({
      ...parsed.data,
      sortOrder: nextSortOrder,
    })
    res.status(201).json(instructor)
  } catch (error) {
    next(error)
  }
})

// PUT /api/instructors/:id
instructorRouter.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateInstructorSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
      return
    }

    const instructor = await Instructor.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
      runValidators: true,
    }).orFail()
    res.json(instructor)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/instructors/:id
instructorRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const instructor = await Instructor.findById(req.params.id).orFail()

    if (instructor.photoUrl) {
      const fileName = path.basename(instructor.photoUrl)
      await fs.unlink(path.join(UPLOAD_DIR, fileName)).catch(() => {})
    }

    await Instructor.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/instructors/reorder
instructorRouter.patch('/reorder', requireAdmin, async (req, res, next) => {
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
      await Instructor.bulkWrite(operations)
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})
