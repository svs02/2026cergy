import path from 'path'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { env } from './env'

import { authRouter } from './routes/auth'
import { noticeRouter } from './routes/notice'
import { galleryRouter } from './routes/gallery'
import { uploadRouter } from './routes/upload'
import { instructorRouter } from './routes/instructor'
import { lessonRouter } from './routes/lesson'
import { Notice } from './models/Notice'
import { Gallery } from './models/Gallery'
import { Instructor } from './models/Instructor'
import { Lesson } from './models/Lesson'

const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
)

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: env.MONGODB_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  })
)

app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    },
  })
)

const isTest = process.env.NODE_ENV === 'test'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요' },
  skip: () => isTest,
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요' },
  skip: () => isTest,
})

app.use('/api/', apiLimiter)
app.use('/api/auth/admin/login', loginLimiter)
app.use('/api/auth', authRouter)
app.use('/api/notices', noticeRouter)
app.use('/api/gallery', galleryRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/instructors', instructorRouter)
app.use('/api/lessons', lessonRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

if (process.env.NODE_ENV === 'test') {
  app.post('/api/test/reset', async (_req, res, next) => {
    try {
      await Promise.all([Notice.deleteMany({}), Gallery.deleteMany({}), Instructor.deleteMany({}), Lesson.deleteMany({})])
      res.json({ ok: true })
    } catch (error) {
      next(error)
    }
  })
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as { name?: string; message?: string; statusCode?: number }
  if (error?.name === 'DocumentNotFoundError') {
    res.status(404).json({ error: '존재하지 않는 리소스입니다' })
    return
  }
  if (error?.name === 'CastError') {
    res.status(400).json({ error: '잘못된 식별자입니다' })
    return
  }
  if (process.env.NODE_ENV === 'production') {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[ERROR] ${message}`)
  } else {
    console.error(err)
  }
  res.status(500).json({ error: '서버 오류가 발생했습니다' })
})

export default app
