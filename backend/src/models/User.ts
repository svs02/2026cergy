import { Schema, model } from 'mongoose'

const UserRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const

type UserRole = (typeof UserRole)[keyof typeof UserRole]

interface IUser {
  provider: 'google' | 'naver'
  providerId: string
  email?: string
  name: string
  profileImage?: string
  role: UserRole
  createdAt: Date
}

const userSchema = new Schema<IUser>(
  {
    provider: { type: String, required: true, enum: ['google', 'naver'] },
    providerId: { type: String, required: true },
    email: { type: String },
    name: { type: String, required: true },
    profileImage: { type: String },
    role: { type: String, required: true, enum: Object.values(UserRole), default: UserRole.MEMBER },
  },
  { timestamps: true }
)

userSchema.index({ provider: 1, providerId: 1 }, { unique: true })

export const User = model<IUser>('User', userSchema)
