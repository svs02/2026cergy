import { Schema, model } from 'mongoose'

export const NoticeTag = {
  NOTICE: 'NOTICE',
  EVENT: 'EVENT',
} as const

export type NoticeTag = (typeof NoticeTag)[keyof typeof NoticeTag]

export interface INotice {
  title: string
  body: string
  images: string[]
  tag: NoticeTag
  views: number
}

const noticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    images: { type: [String], default: [] },
    tag: {
      type: String,
      required: true,
      enum: Object.values(NoticeTag),
      default: NoticeTag.NOTICE,
    },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
)

noticeSchema.index({ createdAt: -1 })

export const Notice = model<INotice>('Notice', noticeSchema)
