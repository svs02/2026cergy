import { Schema, model } from 'mongoose'

export const GalleryCategory = {
  SPACE: '공간',
  LESSON: '레슨',
  RECITAL: '발표회',
  INSTRUMENT: '악기',
} as const

export type GalleryCategory = (typeof GalleryCategory)[keyof typeof GalleryCategory]

export interface IGallery {
  imageUrl: string
  caption: string
  category: GalleryCategory
  featured: boolean
  sortOrder: number
}

const gallerySchema = new Schema<IGallery>(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: Object.values(GalleryCategory),
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
)

gallerySchema.index({ sortOrder: 1 })

export const Gallery = model<IGallery>('Gallery', gallerySchema)
