import { Schema, model } from 'mongoose'

export interface ILesson {
  title: string
  subtitle: string
  description: string
  price: string
  sortOrder: number
  active: boolean
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    sortOrder: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

lessonSchema.index({ sortOrder: 1 })

export const Lesson = model<ILesson>('Lesson', lessonSchema)
