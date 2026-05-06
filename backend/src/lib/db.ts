import mongoose from 'mongoose'
import { env } from '../env'

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  console.log('MongoDB 연결 완료')
}
