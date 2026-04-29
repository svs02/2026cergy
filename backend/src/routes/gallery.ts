import path from 'path'
import fs from 'fs/promises'
import { Router } from 'express'
import { z } from 'zod/v4'
import { Gallery, GalleryCategory } from '../models/Gallery'
import { requireAdmin } from '../middleware/auth'
import { galleryUpload, mediaTypeFromMime, UPLOAD_DIR } from '../lib/multer'

export const galleryRouter = Router()

const galleryCategoryValues = Object.values(GalleryCategory) as [string, ...string[]]

const createGallerySchema = z.strictObject({
  category: z.enum(galleryCategoryValues),
  caption: z.string().optional(),
  featured: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') {
        return value
      }
      if (value === 'true') {
        return true
      }
      return false
    }),
})

const reorderSchema = z.strictObject({
  orderedIds: z.array(z.string().min(1)).min(1),
})

galleryRouter.get('/', async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const filter: Record<string, unknown> = {}
    if (category && category !== '전체') {
      filter.category = category
    }
    const items = await Gallery.find(filter).sort({ sortOrder: 1 })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

galleryRouter.post(
  '/',
  requireAdmin,
  galleryUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined
      const imageFile = files?.image?.[0]
      const thumbnailFile = files?.thumbnail?.[0]

      if (!imageFile) {
        res.status(400).json({ error: '파일이 필요합니다' })
        return
      }

      const parsed = createGallerySchema.safeParse(req.body)
      if (!parsed.success) {
        await fs.unlink(imageFile.path).catch(() => {})
        if (thumbnailFile) {
          await fs.unlink(thumbnailFile.path).catch(() => {})
        }
        res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues })
        return
      }

      const top = await Gallery.findOne().sort({ sortOrder: 1 }).select({ sortOrder: 1 }).lean()
      const nextSortOrder = top ? top.sortOrder - 1 : 0

      const gallery = await Gallery.create({
        imageUrl: `/uploads/${imageFile.filename}`,
        mediaType: mediaTypeFromMime(imageFile.mimetype),
        thumbnailUrl: thumbnailFile ? `/uploads/${thumbnailFile.filename}` : undefined,
        caption: parsed.data.caption ?? '',
        category: parsed.data.category as GalleryCategory,
        featured: parsed.data.featured ?? false,
        sortOrder: nextSortOrder,
      })

      res.status(201).json(gallery)
    } catch (error) {
      next(error)
    }
  },
)

galleryRouter.patch('/reorder', requireAdmin, async (req, res, next) => {
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
      await Gallery.bulkWrite(operations)
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

galleryRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const gallery = await Gallery.findById(req.params.id).orFail()

    const fileName = path.basename(gallery.imageUrl)
    await fs.unlink(path.join(UPLOAD_DIR, fileName)).catch(() => {})

    if (gallery.thumbnailUrl) {
      const thumbName = path.basename(gallery.thumbnailUrl)
      await fs.unlink(path.join(UPLOAD_DIR, thumbName)).catch(() => {})
    }

    await Gallery.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})
