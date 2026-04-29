import { Schema, model } from 'mongoose'

export const PhotoTone = {
  GREEN: 'green',
  GREEN_L: 'greenL',
  WOOD: 'wood',
  SUN: 'sun',
  CREAM: 'cream',
  IVORY: 'ivory',
} as const

export type PhotoTone = (typeof PhotoTone)[keyof typeof PhotoTone]

export const Day = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
} as const

export type Day = (typeof Day)[keyof typeof Day]

export interface IScheduleSlot {
  day: Day
  startTime: string
  endTime: string
  lessonName: string
}

export interface IInstructor {
  name: string
  nameEn: string
  role: string
  photoUrl?: string
  tone: PhotoTone
  major: string
  career: string[]
  quote?: string
  schedule: IScheduleSlot[]
  featured: boolean
  sortOrder: number
  active: boolean
}

const scheduleSlotSchema = new Schema<IScheduleSlot>(
  {
    day: { type: String, required: true, enum: Object.values(Day) },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    lessonName: { type: String, required: true },
  },
  { _id: false },
)

const instructorSchema = new Schema<IInstructor>(
  {
    name: { type: String, required: true },
    nameEn: { type: String, required: true },
    role: { type: String, required: true },
    photoUrl: { type: String },
    tone: {
      type: String,
      required: true,
      enum: Object.values(PhotoTone),
    },
    major: { type: String, required: true },
    career: { type: [String], required: true },
    quote: { type: String },
    schedule: { type: [scheduleSlotSchema], default: [] },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

instructorSchema.index({ sortOrder: 1 })

export const Instructor = model<IInstructor>('Instructor', instructorSchema)
